import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar se a empresa pertence ao usuário
    const empresaExistente = await db.empresa.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!empresaExistente) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const empresa = await db.empresa.update({
      where: { id },
      data: {
        nivelEstudoTecnico: body.nivelEstudoTecnico,
        demandaDuvidas: body.demandaDuvidas,
        tempoOperacional: body.tempoOperacional,
        organizacaoCliente: body.organizacaoCliente,
        volumeDocumentos: body.volumeDocumentos,
        diversidadeOperacoes: body.diversidadeOperacoes,
        percentualComplexidade: body.percentualComplexidade,
      },
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar complexidade:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar complexidade" },
      { status: 500 }
    );
  }
}
