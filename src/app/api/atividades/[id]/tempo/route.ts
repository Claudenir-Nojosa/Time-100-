import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, tempoEstimado } = body;

    console.log(`Ação: ${action} para atividade: ${id}`);

    const atividade = await db.atividade.findUnique({
      where: { id },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    // Converter historicoTempo para array seguro
    let historico: any[] = [];
    if (atividade.historicoTempo && Array.isArray(atividade.historicoTempo)) {
      historico = [...atividade.historicoTempo];
    }

    let data: any = {};

    switch (action) {
      case "iniciar":
        console.log("Iniciando timer");

        const novaSessao = {
          inicio: new Date().toISOString(),
          emAndamento: true,
        };

        data = {
          emAndamento: true,
          dataInicio: atividade.dataInicio || new Date(),
          historicoTempo: [...historico, novaSessao],
        };
        break;

      case "parar":
        console.log("Parando timer");

        const sessaoAtual = historico.find((s: any) => s.emAndamento);

        if (sessaoAtual) {
          const fim = new Date();
          const inicio = new Date(sessaoAtual.inicio);
          const duracao = Math.round(
            (fim.getTime() - inicio.getTime()) / 60000
          );

          console.log(`Duração: ${duracao} minutos`);

          const historicoAtualizado = historico.map((s: any) =>
            s.emAndamento
              ? {
                  ...s,
                  fim: fim.toISOString(),
                  duracao,
                  emAndamento: false,
                }
              : s
          );

          const tempoTotalAnterior = atividade.tempoReal || 0;

          data = {
            emAndamento: false,
            tempoReal: tempoTotalAnterior + duracao,
            historicoTempo: historicoAtualizado,
          };
        } else {
          console.log("Nenhuma sessão ativa encontrada");
          return NextResponse.json(
            { error: "Nenhuma sessão em andamento encontrada" },
            { status: 400 }
          );
        }
        break;

      case "concluir":
        console.log("Concluindo atividade");

        data = {
          concluida: true,
          dataConclusao: new Date(),
          emAndamento: false,
        };
        break;

      case "estimativa":
        console.log("Definindo estimativa:", tempoEstimado);

        data = {
          tempoEstimado: tempoEstimado,
        };
        break;

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    // Fazer o update
    const atividadeAtualizada = await db.atividade.update({
      where: { id },
      data,
    });

    // Buscar a atividade completa para retornar
    const atividadeCompleta = await db.atividade.findUnique({
      where: { id },
    });

    // Serializar datas para JSON
    const resposta = {
      ...atividadeCompleta,
      data: atividadeCompleta?.data?.toISOString(),
      createdAt: atividadeCompleta?.createdAt?.toISOString(),
      updatedAt: atividadeCompleta?.updatedAt?.toISOString(),
      dataInicio: atividadeCompleta?.dataInicio?.toISOString(),
      dataConclusao: atividadeCompleta?.dataConclusao?.toISOString(),
    };

    console.log("Sucesso - atividade atualizada");
    return NextResponse.json(resposta);
  } catch (error) {
    console.error("Erro completo:", error);
    return NextResponse.json(
      {
        error: "Erro ao atualizar tempo da atividade",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
