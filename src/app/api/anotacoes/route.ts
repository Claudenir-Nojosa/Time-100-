// app/api/anotacoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseLegalId = searchParams.get("baseLegalId");
  const userId = searchParams.get("userId");

  if (!baseLegalId || !userId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const anotacao = await db.anotacao.findUnique({
      where: {
        baseLegalId_userId: {
          baseLegalId,
          userId,
        },
      },
    });

    return NextResponse.json(anotacao);
  } catch (error) {
    console.error("Erro ao buscar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conteudo, baseLegalId, userId } = await request.json();

    const anotacao = await db.anotacao.create({
      data: {
        conteudo,
        baseLegalId,
        userId,
      },
    });

    return NextResponse.json(anotacao);
  } catch (error) {
    console.error("Erro ao criar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

