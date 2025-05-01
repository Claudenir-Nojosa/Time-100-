import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '../../../../auth';

export async function GET() {
 const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const pendencias = await db.pendencia.findMany({
      where: { usuarioId: session.user.id },
      orderBy: { criadoEm: 'desc' },
    });
    return NextResponse.json(pendencias);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar pendências' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
 const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { titulo, descricao } = await request.json();
    
    const pendencia = await db.pendencia.create({
      data: {
        titulo,
        descricao,
        usuarioId: session.user.id,
      },
    });
    
    return NextResponse.json(pendencia);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar pendência' },
      { status: 500 }
    );
  }
}