import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.anotacao.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Anotação deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { conteudo } = await request.json();
    const { id } = await params;

    const anotacao = await db.anotacao.update({
      where: { id },
      data: { conteudo },
    });

    return NextResponse.json(anotacao);
  } catch (error) {
    console.error("Erro ao atualizar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
