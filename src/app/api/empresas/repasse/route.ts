import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function POST(request: NextRequest) {
  try {
      const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validação
    if (!body.empresaId || !body.colaborador || !body.dataRepasse) {
      return NextResponse.json(
        { error: "Empresa, colaborador e data são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe e pertence ao usuário
    const empresa = await db.empresa.findFirst({
      where: {
        id: body.empresaId,
        userId: session.user.id,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se já existe repasse para esta empresa
    const repasseExistente = await db.repasseEmpresa.findUnique({
      where: {
        empresaId: body.empresaId,
      },
    });

    if (repasseExistente) {
      return NextResponse.json(
        { error: "Esta empresa já foi repassada anteriormente" },
        { status: 400 }
      );
    }

    // Criar repasse e atualizar empresa em uma transação
    const resultado = await db.$transaction(async (tx) => {
      // Criar o repasse
      const repasse = await tx.repasseEmpresa.create({
        data: {
          empresaId: body.empresaId,
          colaborador: body.colaborador,
          dataRepasse: new Date(body.dataRepasse),
          observacoes: body.observacoes || null,
        },
      });

      // Atualizar situação da empresa para "Não Vigente"
      await tx.empresa.update({
        where: { id: body.empresaId },
        data: { situacao: "NAO_VIGENTE" },
      });

      return repasse;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Erro ao repassar empresa:", error);
    return NextResponse.json(
      {
        error: "Erro ao repassar empresa",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
