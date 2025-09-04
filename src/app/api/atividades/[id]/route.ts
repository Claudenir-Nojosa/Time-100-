import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nome, horario, responsavel, data, concluida, categoria } = await request.json(); // ← Adicione categoria

    const atividade = await db.atividade.update({
      where: { id },
      data: {
        nome,
        horario,
        responsavel,
        data: new Date(data),
        concluida,
        categoria, // ← Adicione esta linha
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

    return NextResponse.json(atividade);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    );
  }
}