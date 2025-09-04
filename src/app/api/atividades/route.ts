import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET todas as atividades
export async function GET() {
  try {
    const atividades = await db.atividade.findMany({
      orderBy: {
        data: "asc",
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
        categoria: true, // ← Adicione esta linha
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

// POST nova atividade
export async function POST(request: Request) {
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

    // Cria a atividade com todos os campos
    const atividade = await db.atividade.create({
      data: {
        nome: body.nome,
        horario: body.horario || null,
        responsavel: body.responsavel || "Usuário Anônimo",
        responsavelId: body.responsavelId,
        responsavelImg: body.responsavelImg || null,
        data: dataAtividade,
        concluida: body.concluida || false,
        categoria: body.categoria || "apuracao", // ← Adicione esta linha
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
        categoria: true, // ← Adicione esta linha
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