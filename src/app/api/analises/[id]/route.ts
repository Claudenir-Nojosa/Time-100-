// app/api/analises/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analise = await db.analiseTributaria.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            descricao: true,
            cnpj: true,
          },
        },
      },
    });

    if (!analise) {
      return NextResponse.json(
        { error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(analise);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar análise" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se a análise existe
    const analise = await db.analiseTributaria.findUnique({
      where: { id },
    });

    if (!analise) {
      return NextResponse.json(
        { error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    // Deletar a análise
    await db.analiseTributaria.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Análise deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar análise:", error);
    return NextResponse.json(
      { error: "Erro ao deletar análise" },
      { status: 500 }
    );
  }
}