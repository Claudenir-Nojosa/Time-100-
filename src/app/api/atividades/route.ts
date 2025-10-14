import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET todas as atividades
export async function GET() {
  try {
    const atividades = await db.atividade.findMany({
      orderBy: [
        { data: "asc" },
        { ordem: "asc" },
      ],
      select: {
        id: true,
        nome: true,
        horario: true,
        responsavel: true,
        responsavelId: true,
        responsavelImg: true,
        data: true,
        concluida: true,
        categoria: true,
        ordem: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(atividades);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar atividades",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT atualizar atividade - CORRIGIDO
export async function PUT(
  request: NextRequest, // ← Mude para NextRequest
  { params }: { params: Promise<{ id: string }> } // ← params é Promise
) {
  try {
    const { id } = await params; // ← Aguarde a Promise
    const { nome, horario, responsavel, data, concluida, categoria, ordem } =
      await request.json();

    const atividade = await db.atividade.update({
      where: { id },
      data: {
        nome,
        horario,
        responsavel,
        data: new Date(data),
        concluida,
        categoria,
        ordem,
      },
      select: {
        id: true,
        nome: true,
        horario: true,
        responsavel: true,
        responsavelId: true,
        responsavelImg: true,
        data: true,
        concluida: true,
        categoria: true,
        ordem: true,
      },
    });

    return NextResponse.json(atividade);
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar atividade" },
      { status: 500 }
    );
  }
}

// POST nova atividade - CORRIGIDO
export async function POST(request: NextRequest) { // ← Mude para NextRequest
  try {
    const body = await request.json();
    console.log("Dados recebidos:", body);

    // Validação dos campos obrigatórios
    if (!body.nome) {
      return NextResponse.json(
        { error: "O nome da atividade é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.data) {
      return NextResponse.json(
        { error: "A data da atividade é obrigatória" },
        { status: 400 }
      );
    }

    if (!body.responsavelId) {
      return NextResponse.json(
        { error: "ID do responsável é obrigatório" },
        { status: 400 }
      );
    }

    // Formata a data corretamente
    const dataAtividade = new Date(body.data);
    if (isNaN(dataAtividade.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    // Encontrar a maior ordem atual para esta data e responsável
    const atividadesDoDia = await db.atividade.findMany({
      where: {
        data: dataAtividade,
        responsavelId: body.responsavelId,
      },
      orderBy: { ordem: "desc" },
    });

    // Calcular a nova ordem (última ordem + 1, ou 0 se for a primeira)
    const novaOrdem =
      atividadesDoDia.length > 0 ? (atividadesDoDia[0].ordem || 0) + 1 : 0;

    // Cria a atividade com todos os campos incluindo a ordem
    const atividade = await db.atividade.create({
      data: {
        nome: body.nome,
        horario: body.horario || null,
        responsavel: body.responsavel || "Usuário Anônimo",
        responsavelId: body.responsavelId,
        responsavelImg: body.responsavelImg || null,
        data: dataAtividade,
        concluida: body.concluida || false,
        categoria: body.categoria || "apuracao",
        ordem: novaOrdem,
      },
      select: {
        id: true,
        nome: true,
        horario: true,
        responsavel: true,
        responsavelId: true,
        responsavelImg: true,
        data: true,
        concluida: true,
        categoria: true,
        ordem: true,
      },
    });

    console.log("Atividade criada:", atividade);
    return NextResponse.json(atividade, { status: 201 });
  } catch (error) {
    console.error("Erro detalhado:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar atividade",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}