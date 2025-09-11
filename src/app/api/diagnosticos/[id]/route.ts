import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface para o contexto
interface RouteContext {
  params: Promise<{ id: string }>;
}

// Forma correta para Next.js 13.2+
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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

// Forma correta para Next.js 13.2+
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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
