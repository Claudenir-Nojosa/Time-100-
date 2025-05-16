import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '../../../../../auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { concluida } = await request.json();
    
    const pendencia = await db.pendencia.update({
      where: { id: params.id },
      data: { concluida },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    return NextResponse.json(pendencia);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar pendência' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const pendencia = await db.pendencia.findUnique({
      where: { id: params.id }
    });

    if (!pendencia) {
      return NextResponse.json({ error: 'Pendência não encontrada' }, { status: 404 });
    }

    if (pendencia.usuarioId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await db.pendencia.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar pendência' },
      { status: 500 }
    );
  }
}