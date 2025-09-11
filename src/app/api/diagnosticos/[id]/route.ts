import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Correção: Receber o params diretamente no primeiro argumento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const diagnostico = await prisma.diagnostico.findUnique({
      where: { id },
    });

    if (!diagnostico) {
      return NextResponse.json(
        { error: "Diagnóstico não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(diagnostico);
  } catch (error: any) {
    console.error("Erro ao buscar diagnóstico:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Correção: Mesma assinatura para DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.diagnostico.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Diagnóstico excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir diagnóstico:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
