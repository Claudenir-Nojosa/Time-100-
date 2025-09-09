// app/api/gerar-analise/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
      return NextResponse.json(
        { error: "API key não configurada" },
        { status: 500 }
      );
    }
    // Chamada simplificada para teste
    const response = await openai.responses.create({
      model: "gpt-5-mini", // Modelo mais leve para teste
      input: prompt,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
    });

    const analise = response.output_text;

    if (!analise) {
      throw new Error("Não foi possível gerar a análise");
    }

    return NextResponse.json({ analise });
  } catch (error) {
    console.error("Erro ao gerar análise:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
