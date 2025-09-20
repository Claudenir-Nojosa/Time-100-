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
    const prompt = `Analise esta mensagem sobre gastos em português do Brasil e extraia as informações em JSON:
    
    Mensagem: "${message.toString()}"
    
    Extraia:
    - descricao: string (descrição do gasto)
    - valor: number (valor em reais)
    - categoria: [alimentacao, transporte, casa, pessoal, lazer, receita, outros]
    - tipo: [individual, compartilhado]
    - responsavel: [Claudenir, Esposa]
    - data: YYYY-MM-DD (use hoje se não especificado)
    
    Retorne apenas JSON.`;

    let dadosGasto;
    try {
      const claudeData = await callClaudeApi(prompt);
      const resposta = claudeData.content[0].text;

      // Extrair JSON da resposta
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

  // Extrair valor (ex: "gastei 50 reais" → 50)
  const valorMatch = mensagem.match(/(\d+[,.]?\d*)\s*(reais|r\$|rs|$)/i);
  const valor = valorMatch ? parseFloat(valorMatch[1].replace(",", ".")) : 0;

  // Extrair descrição (ex: "gastei 50 no almoço" → "almoço")
  const descricaoMatch = mensagem.match(
    /gastei\s+\d+\s*(?:no|na|em|com|por)\s+([^,.!?]+)/i
  );
  const descricao = descricaoMatch
    ? descricaoMatch[1].trim()
    : "Gasto não especificado";

  // Detectar categoria baseada na descrição
  const categoria = detectarCategoria(descricao);

  return {
    descricao,
    valor,
    categoria,
    tipo: "individual",
    responsavel: "Claudenir",
  };
}

function detectarCategoria(descricao: string) {
  const descLower = descricao.toLowerCase();

  if (
    descLower.includes("almoço") ||
    descLower.includes("jantar") ||
    descLower.includes("comida")
  )
    return "alimentacao";
  if (
    descLower.includes("gasolina") ||
    descLower.includes("combustível") ||
    descLower.includes("uber")
  )
    return "transporte";
  if (
    descLower.includes("conta") ||
    descLower.includes("luz") ||
    descLower.includes("água") ||
    descLower.includes("aluguel")
  )
    return "casa";
  if (
    descLower.includes("salário") ||
    descLower.includes("receita") ||
    descLower.includes("renda")
  )
    return "receita";

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
