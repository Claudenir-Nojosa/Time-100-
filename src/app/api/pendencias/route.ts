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
      // Remova o where clause que filtra por usuarioId
      orderBy: { criadoEm: 'desc' },
      include: {  // Adicione isto para incluir informações do usuário
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      }
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
        userId: session.user.id, // Mantém o usuário que criou
      },
      include: {  // Adicione isto para incluir informações do usuário
        user: {
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
      { error: 'Erro ao criar pendência' },
      { status: 500 }
    );
  }
}