// app/api/atividades/[id]/reordenar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { ordem, data } = await request.json();

    const atividade = await db.atividade.update({
      where: { id },
      data: {
        ordem,
        data: new Date(data), // Atualiza a data se necessário
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
        ordem: true, // ← Inclua o campo ordem
      },
    });

    return NextResponse.json(atividade);
  } catch (error) {
    console.error('Erro ao reordenar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar atividade' },
      { status: 500 }
    );
  }
}