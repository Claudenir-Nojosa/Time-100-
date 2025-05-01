import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '../../../../../auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  
) {

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { concluida } = await request.json();
    
    const pendencia = await db.pendencia.update({
      where: { id: (await params).id, usuarioId: session.user.id },
      data: { concluida },
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
  { params }: { params: Promise<{ id: string }> }  
) {

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await db.pendencia.delete({
      where: { id: (await params).id, usuarioId: session.user.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar pendência' },
      { status: 500 }
    );
  }
}