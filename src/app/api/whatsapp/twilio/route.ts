// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { callClaudeApi } from "@/lib/claude-api";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const formDataObj = Object.fromEntries(formData.entries());

    const { From: from, Body: message, ProfileName: profileName } = formDataObj;

    console.log("📨 Mensagem recebida via Twilio:", {
      from: from?.toString(),
      profileName: profileName?.toString(),
      message: message?.toString(),
    });

    if (!from || !message) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Ignorar mensagens de sistema
    const messageText = message.toString().toLowerCase();
    if (messageText.includes("join") || messageText.trim().length < 3) {
      console.log("⚙️ Mensagem de sistema ignorada");
      return new Response(null, { status: 200 });
    }

    // Processar a mensagem com Claude
    const prompt = `Você é um assistente especializado em extrair informações financeiras de mensagens do WhatsApp.

ANÁLISE A MENSAGEM E EXTRAIA AS INFORMAÇÕES EM JSON:

MENSAGEM: "${message.toString()}"

REGAS:
1. Se for um SALÁRIO ou RECEITA, use categoria "receita" e tipo "individual"
2. Se for um GASTO, identifique a categoria correta
3. VALOR: sempre extraia o valor numérico (ex: "4200" de "salario 4200")
4. DESCRIÇÃO: extraia uma descrição clara (ex: "Salário" para "salario 4200")
5. TIPO: "compartilhado" para gastos conjuntos, "individual" para pessoais
6. RESPONSÁVEL: "Claudenir" ou "Beatriz" baseado no contexto
7. DATA: use hoje se não especificado

CATEGORIAS PERMITIDAS: 
["alimentacao", "transporte", "casa", "pessoal", "lazer", "receita", "outros"]

EXEMPLOS:
- "salario 4200" → {"descricao": "Salário", "valor": 4200, "categoria": "receita", "tipo": "individual", "responsavel": "Claudenir"}
- "salário 4200 receita" → {"descricao": "Salário", "valor": 4200, "categoria": "receita", "tipo": "individual", "responsavel": "Claudenir"}
- "gastei 50 no almoço" → {"descricao": "Almoço", "valor": 50, "categoria": "alimentacao", "tipo": "individual", "responsavel": "Claudenir"}
- "jantar 120 compartilhado" → {"descricao": "Jantar", "valor": 120, "categoria": "alimentacao", "tipo": "compartilhado", "responsavel": "Ambos"}

// RETORNE APENAS JSON, SEM TEXTOS ADICIONAIS.`;

    let dadosGasto;
    try {
      const claudeData = await callClaudeApi(prompt);
      const resposta = claudeData.content[0].text;

      // Extrair JSON da resposta s
      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON não encontrado na resposta do Claude");
      }

      dadosGasto = JSON.parse(jsonMatch[0]);
      console.log("✅ Dados extraídos pelo Claude:", dadosGasto);
    } catch (error) {
      console.error("❌ Erro ao processar com Claude:", error);
      // Fallback: tentar extrair valor manualmente
      dadosGasto = extrairDadosManualmente(message.toString());
    }

    // Determinar usuário baseado no número
    const usuario = await determinarUsuario(from.toString());

    // Salvar no Supabase
    const gastoCompleto = {
      descricao: dadosGasto.descricao || "Gasto não identificado",
      valor: dadosGasto.valor > 0 ? dadosGasto.valor : 0,
      categoria: dadosGasto.categoria || "outros",
      tipo: dadosGasto.tipo || "individual",
      responsavel: dadosGasto.responsavel || "Claudenir",
      data: dadosGasto.data ? new Date(dadosGasto.data) : new Date(),
      pago: false,
      origem: "whatsapp",
      mensagemOriginal: message.toString(),
      usuarioId: usuario.id,
    };

    console.log("💾 Salvando no Supabase:", gastoCompleto);

    await db.gasto.create({
      data: gastoCompleto,
    });

    console.log("✅ Gasto salvo no Supabase com sucesso!");

    // Enviar confirmação
    await enviarRespostaTwilio(
      from.toString(),
      `✅ Gasto registrado!\n• ${gastoCompleto.descricao}\n• Valor: R$ ${gastoCompleto.valor.toFixed(2)}\n• Categoria: ${gastoCompleto.categoria}`
    );

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Erro no webhook Twilio:", error);
    return new Response("Erro interno", { status: 500 });
  }
}

// Função fallback para extrair dados manualmente
function extrairDadosManualmente(mensagem: string) {
  console.log("🔄 Usando fallback manual para:", mensagem);

  const mensagemLower = mensagem.toLowerCase();

  // Extrair valor (ex: "salario 4200" → 4200)
  const valorMatch = mensagemLower.match(/(\d+[,.]?\d*)/);
  const valor = valorMatch ? parseFloat(valorMatch[1].replace(",", ".")) : 0;

  // Detectar se é receita
  const isReceita =
    mensagemLower.includes("salario") ||
    mensagemLower.includes("salário") ||
    mensagemLower.includes("receita") ||
    mensagemLower.includes("renda") ||
    mensagemLower.includes("pagamento");

  // Detectar descrição
  let descricao = "Transação não especificada";
  if (isReceita) descricao = "Salário";
  else if (mensagemLower.includes("almoço") || mensagemLower.includes("almoco"))
    descricao = "Almoço";
  else if (mensagemLower.includes("jantar")) descricao = "Jantar";
  else if (mensagemLower.includes("mercado")) descricao = "Mercado";
  else if (
    mensagemLower.includes("combustível") ||
    mensagemLower.includes("combustivel")
  )
    descricao = "Combustível";
  else if (mensagemLower.includes("luz")) descricao = "Conta de Luz";
  else if (mensagemLower.includes("água") || mensagemLower.includes("agua"))
    descricao = "Conta de Água";
  else if (mensagemLower.includes("internet")) descricao = "Internet";
  else if (mensagemLower.includes("telefone")) descricao = "Telefone";
  else if (mensagemLower.includes("cinema") || mensagemLower.includes("filme"))
    descricao = "Cinema";
  else if (mensagemLower.includes("restaurante")) descricao = "Restaurante";

  // Detectar categoria
  let categoria = "outros";
  if (isReceita) categoria = "receita";
  else if (
    mensagemLower.includes("almoço") ||
    mensagemLower.includes("almoco") ||
    mensagemLower.includes("jantar") ||
    mensagemLower.includes("comida") ||
    mensagemLower.includes("restaurante")
  )
    categoria = "alimentacao";
  else if (
    mensagemLower.includes("gasolina") ||
    mensagemLower.includes("combustível") ||
    mensagemLower.includes("combustivel") ||
    mensagemLower.includes("uber") ||
    mensagemLower.includes("transporte") ||
    mensagemLower.includes("ônibus") ||
    mensagemLower.includes("onibus")
  )
    categoria = "transporte";
  else if (
    mensagemLower.includes("luz") ||
    mensagemLower.includes("água") ||
    mensagemLower.includes("agua") ||
    mensagemLower.includes("aluguel") ||
    mensagemLower.includes("internet") ||
    mensagemLower.includes("telefone") ||
    mensagemLower.includes("condomínio") ||
    mensagemLower.includes("condominio")
  )
    categoria = "casa";
  else if (
    mensagemLower.includes("roupa") ||
    mensagemLower.includes("cosmético") ||
    mensagemLower.includes("cosmetico") ||
    mensagemLower.includes("sapato") ||
    mensagemLower.includes("perfume")
  )
    categoria = "pessoal";
  else if (
    mensagemLower.includes("cinema") ||
    mensagemLower.includes("filme") ||
    mensagemLower.includes("shopping") ||
    mensagemLower.includes("viagem") ||
    mensagemLower.includes("parque")
  )
    categoria = "lazer";

  // Detectar tipo e responsável
  let tipo = "individual";
  let responsavel = "Claudenir";

  if (
    mensagemLower.includes("compartilhado") ||
    mensagemLower.includes("compartilhada") ||
    mensagemLower.includes("conjunto") ||
    mensagemLower.includes("nos dois")
  ) {
    tipo = "compartilhado";
    responsavel = "Ambos";
  }

  if (
    mensagemLower.includes("esposa") ||
    mensagemLower.includes("mulher") ||
    mensagemLower.includes("dela") ||
    mensagemLower.includes("beatriz")
  ) {
    responsavel = "Beatriz";
  }

  return {
    descricao,
    valor: isReceita ? Math.abs(valor) : Math.abs(valor) * -1,
    categoria,
    tipo,
    responsavel,
    data: new Date().toISOString().split("T")[0],
  };
}

function detectarCategoria(descricao: string) {
  const descLower = descricao.toLowerCase();

  if (
    descLower.includes("salário") ||
    descLower.includes("salario") ||
    descLower.includes("receita") ||
    descLower.includes("renda")
  )
    return "receita";
  if (
    descLower.includes("almoço") ||
    descLower.includes("almoco") ||
    descLower.includes("jantar") ||
    descLower.includes("comida") ||
    descLower.includes("restaurante") ||
    descLower.includes("lanche")
  )
    return "alimentacao";
  if (
    descLower.includes("gasolina") ||
    descLower.includes("combustível") ||
    descLower.includes("combustivel") ||
    descLower.includes("uber") ||
    descLower.includes("ônibus") ||
    descLower.includes("onibus") ||
    descLower.includes("transporte") ||
    descLower.includes("taxi")
  )
    return "transporte";
  if (
    descLower.includes("luz") ||
    descLower.includes("água") ||
    descLower.includes("agua") ||
    descLower.includes("aluguel") ||
    descLower.includes("internet") ||
    descLower.includes("telefone") ||
    descLower.includes("condomínio") ||
    descLower.includes("condominio")
  )
    return "casa";
  if (
    descLower.includes("roupa") ||
    descLower.includes("cosmético") ||
    descLower.includes("cosmetico") ||
    descLower.includes("sapato") ||
    descLower.includes("perfume") ||
    descLower.includes("maquiagem")
  )
    return "pessoal";
  if (
    descLower.includes("cinema") ||
    descLower.includes("filme") ||
    descLower.includes("shopping") ||
    descLower.includes("viagem") ||
    descLower.includes("parque") ||
    descLower.includes("festival")
  )
    return "lazer";

  return "outros";
}

async function determinarUsuario(from: string) {
  try {
    // Buscar usuário padrão
    let usuario = await db.usuario.findFirst({
      where: { email: "clau.nojosaf@gmail.com" },
    });

    if (!usuario) {
      // Usar primeiro usuário disponível
      usuario = await db.usuario.findFirst();
      if (!usuario) throw new Error("Nenhum usuário encontrado");
    }

    return usuario;
  } catch (error) {
    console.error("Erro ao determinar usuário:", error);
    throw error;
  }
}

async function enviarRespostaTwilio(to: string, message: string) {
  try {
    const twilio = require("twilio");
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: to,
    });
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
  }
}

function validarDadosGasto(dados: any) {
  // Garantir que valor é número
  if (typeof dados.valor !== 'number') {
    dados.valor = parseFloat(dados.valor) || 0;
  }
  
  // Garantir categorias válidas
  const categoriasValidas = ["alimentacao", "transporte", "casa", "pessoal", "lazer", "receita", "outros"];
  if (!categoriasValidas.includes(dados.categoria)) {
    dados.categoria = "outros";
  }
  
  // Garantir tipos válidos
  if (!["individual", "compartilhado"].includes(dados.tipo)) {
    dados.tipo = "individual";
  }
  
  // Garantir responsáveis válidos
  if (!["Claudenir", "Beatriz", "Ambos"].includes(dados.responsavel)) {
    dados.responsavel = "Claudenir";
  }
  
  return dados;
}