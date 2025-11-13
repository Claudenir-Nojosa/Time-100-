import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { atividades } = body;

    if (!atividades || !Array.isArray(atividades)) {
      return NextResponse.json(
        { error: "Lista de atividades é obrigatória" },
        { status: 400 }
      );
    }

    // Criar todas as atividades em uma transação
    const atividadesCriadas = await db.$transaction(
      atividades.map((atividade, index) =>
        db.atividade.create({
          data: {
            nome: atividade.nome,
            horario: atividade.horario || null,
            responsavel: atividade.responsavel,
            responsavelId: atividade.responsavelId,
            responsavelImg: atividade.responsavelImg || null,
            data: new Date(atividade.data),
            concluida: false, // Sempre começar como não concluída
            categoria: atividade.categoria || "apuracao",
            ordem: index, // Ordem sequencial inicial
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
        })
      )
    );

    return NextResponse.json(atividadesCriadas, { status: 201 });
  } catch (error) {
    console.error("Erro ao copiar atividades:", error);
    return NextResponse.json(
      {
        error: "Erro ao copiar atividades",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
  