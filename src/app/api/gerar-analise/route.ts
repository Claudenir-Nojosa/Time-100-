// app/api/gerar-analise/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Inicializar o cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não está configurada");
      return NextResponse.json(
        { error: "API key não configurada" },
        { status: 500 }
      );
    }

    // System prompt para análise tributária especializada
    const systemPrompt = `
Você é um especialista em contabilidade e análise tributária brasileira com mais de 20 anos de experiência.
Sua tarefa é analisar dados financeiros e fiscais de empresas e gerar relatórios detalhados e precisos.

DIRETRIZES:
1. Forneça uma análise completa, profissional e técnica
2. Use terminologia contábil e tributária adequada ao contexto brasileiro
3. Compare os resultados mês a mês com percentuais de variação
4. Calcule percentuais de carga tributária efetiva
5. Identifique oportunidades de economia fiscal baseadas na legislação brasileira
6. Destaque pontos de atenção e riscos fiscais
7. Forneça recomendações específicas para o regime tributário informado
8. Formate a resposta em markdown com títulos claros
9. Inclua tabelas comparativas quando apropriado
10. Baseie-se na legislação tributária vigente no Brasil

ESPECIFICAÇÕES TÉCNICAS:
- Use como referência a legislação brasileira (Leis, Instruções Normativas, etc.)
- Considere as particularidades de cada estado (UF) para ICMS
- Diferencie análises para Simples Nacional, Lucro Presumido e Lucro Real
- Considere as diferentes atividades (comércio, indústria, serviços)

ESTRUTURA SUGERIDA:
# Análise Tributária - [Nome da Empresa]

## 📊 Resumo Executivo
[Visão geral com os pontos mais importantes]

## 📈 Análise Comparativa Mensal
[Comparativo mês a mês com tabelas]

## 💰 Cálculo de Percentuais Tributários
[Carga tributária efetiva e comparativos]

## 🏭 Análise por Atividade
[Análise específica para cada atividade]

## 💡 Oportunidades de Economia Tributária
[Sugestões baseadas na legislação]

## ⚠️ Pontos de Atenção
[Riscos e observações importantes]

## ✅ Recomendações Específicas
[Ações concretas a serem tomadas]

## 🎯 Próximos Passos
[Cronograma e prioridades]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3, // Baixa temperatura para respostas mais precisas
      top_p: 0.9,
    });

    const analise = completion.choices[0]?.message?.content;

    if (!analise) {
      throw new Error("Não foi possível gerar a análise");
    }

    return NextResponse.json({ analise });
  } catch (error) {
    console.error("Erro ao gerar análise:", error);

    // Tratamento de erro seguro para TypeScript
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno do servidor";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
