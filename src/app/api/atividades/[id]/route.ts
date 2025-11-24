import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const atividade = await db.atividade.update({
      where: { id },
      data: {
        nome: body.nome,
        horario: body.horario,
        responsavel: body.responsavel,
        data: body.data ? new Date(body.data) : undefined,
        concluida: body.concluida,
        categoria: body.categoria,
        // 🆕 ADICIONE OS NOVOS CAMPOS DE TEMPO
        tempoEstimado: body.tempoEstimado,
        tempoReal: body.tempoReal,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
        dataConclusao: body.dataConclusao
          ? new Date(body.dataConclusao)
          : undefined,
        emAndamento: body.emAndamento,
        historicoTempo: body.historicoTempo,
        // 🆕 ADICIONE OS CAMPOS DE ENTREGA
        empresaId: body.empresaId,
        obrigacaoId: body.obrigacaoId,
        mesReferencia: body.mesReferencia,
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

    return NextResponse.json(atividade);
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar atividade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.atividade.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar atividade:", error);
    return NextResponse.json(
      { error: "Erro ao deletar atividade" },
      { status: 500 }
    );
  }
}
