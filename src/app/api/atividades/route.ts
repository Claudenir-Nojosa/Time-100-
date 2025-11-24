import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET todas as atividades
export async function GET() {
  try {
    const atividades = await db.atividade.findMany({
      orderBy: [{ data: "asc" }, { ordem: "asc" }],
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
        // 🆕 ADICIONE OS NOVOS CAMPOS DE TEMPO
        tempoEstimado: true,
        tempoReal: true,
        dataInicio: true,
        dataConclusao: true,
        emAndamento: true,
        historicoTempo: true,
        // 🆕 ADICIONE OS CAMPOS DE ENTREGA
        empresaId: true,
        obrigacaoId: true,
        mesReferencia: true,
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

// POST nova atividade - ATUALIZADA
export async function POST(request: NextRequest) {
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

    // Cria a atividade com todos os campos incluindo os novos campos de tempo E ENTREGA
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
        // 🆕 ADICIONE OS NOVOS CAMPOS DE TEMPO
        tempoEstimado: body.tempoEstimado || null,
        tempoReal: body.tempoReal || null,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataConclusao: body.dataConclusao ? new Date(body.dataConclusao) : null,
        emAndamento: body.emAndamento || false,
        historicoTempo: body.historicoTempo || null,
        // 🆕 ADICIONE OS CAMPOS DE ENTREGA
        empresaId: body.empresaId || null,
        obrigacaoId: body.obrigacaoId || null,
        mesReferencia: body.mesReferencia || null,
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
        // 🆕 INCLUA OS NOVOS CAMPOS NO SELECT
        tempoEstimado: true,
        tempoReal: true,
        dataInicio: true,
        dataConclusao: true,
        emAndamento: true,
        historicoTempo: true,
        // 🆕 INCLUA OS CAMPOS DE ENTREGA NO SELECT
        empresaId: true,
        obrigacaoId: true,
        mesReferencia: true,
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