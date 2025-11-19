import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import db from "@/lib/db";


export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { month, year } = await request.json();

    if (month === undefined || year === undefined) {
      return NextResponse.json(
        { error: "Mês e ano são obrigatórios" },
        { status: 400 }
      );
    }

    // Calcular datas de início e fim do mês
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Deletar atividades do mês específico
    const result = await db.atividade.deleteMany({
      where: {
        responsavelId: session.user.id,
        data: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} atividades excluídas com sucesso`,
      count: result.count,
    });
  } catch (error) {
    console.error("Erro ao excluir atividades do mês:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
