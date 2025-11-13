import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
   const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");

    if (!mes) {
      return NextResponse.json(
        { error: "Parâmetro 'mes' é obrigatório" },
        { status: 400 }
      );
    }

    const entregas = await db.entrega.findMany({
      where: {
        mesReferencia: mes,
        empresa: {
          userId: session.user.id,
        },
      },
      include: {
        empresa: true,
        obrigacao: true,
      },
      orderBy: [
        { empresa: { descricao: "asc" } },
        { obrigacao: { nome: "asc" } },
      ],
    });

    return NextResponse.json(entregas);
  } catch (error) {
    console.error("Erro ao buscar entregas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entregas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
   const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.empresaId || !body.obrigacaoId || !body.mesReferencia) {
      return NextResponse.json(
        { error: "Empresa, obrigação e mês são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a empresa pertence ao usuário
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

    // Buscar ou criar entrega
    const entrega = await db.entrega.upsert({
      where: {
        empresaId_obrigacaoId_mesReferencia: {
          empresaId: body.empresaId,
          obrigacaoId: body.obrigacaoId,
          mesReferencia: body.mesReferencia,
        },
      },
      update: {
        entregue: body.entregue,
        dataEntrega: body.entregue ? new Date() : null,
      },
      create: {
        empresaId: body.empresaId,
        obrigacaoId: body.obrigacaoId,
        mesReferencia: body.mesReferencia,
        entregue: body.entregue,
        dataEntrega: body.entregue ? new Date() : null,
      },
      include: {
        empresa: true,
        obrigacao: true,
      },
    });

    return NextResponse.json(entrega);
  } catch (error) {
    console.error("Erro ao salvar entrega:", error);
    return NextResponse.json(
      { error: "Erro ao salvar entrega" },
      { status: 500 }
    );
  }
}
