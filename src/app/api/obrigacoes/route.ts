import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";


export async function GET() {
  try {
    console.log("🔍 Buscando obrigações...");

    const session = await auth();
    console.log("📋 Sessão obrigações:", session);

    if (!session?.user?.id) {
      console.log("❌ Usuário não autenticado para obrigações");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const obrigacoes = await db.obrigacao.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { nome: "asc" },
    });

    console.log(`✅ Obrigações encontradas: ${obrigacoes.length}`);
    return NextResponse.json(obrigacoes);
  } catch (error) {
    console.error("❌ Erro ao buscar obrigações:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar obrigações",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
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

    if (!body.nome) {
      return NextResponse.json(
        { error: "Nome da obrigação é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se já existe obrigação com mesmo nome para este usuário
    const obrigacaoExistente = await db.obrigacao.findFirst({
      where: {
        nome: body.nome,
        userId: session.user.id,
      },
    });

    if (obrigacaoExistente) {
      return NextResponse.json(
        { error: "Já existe uma obrigação com este nome" },
        { status: 400 }
      );
    }

    const obrigacao = await db.obrigacao.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        categoria: body.categoria || "TRIBUTARIA",
        userId: session.user.id,
      },
    });

    return NextResponse.json(obrigacao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar obrigação:", error);
    return NextResponse.json(
      { error: "Erro ao criar obrigação" },
      { status: 500 }
    );
  }
}
