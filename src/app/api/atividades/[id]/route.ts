import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await db.atividade.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar atividade' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { nome, horario, responsavel, data, concluida } = await request.json();
    
    const atividade = await db.atividade.update({
      where: { id },
      data: {
        nome,
        horario,
        responsavel,
        data: new Date(data),
        concluida,
      },
    });

    return NextResponse.json(atividade);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    );
  }
}