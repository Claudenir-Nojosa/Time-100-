import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET todas as atividades
export async function GET() {
  try {
    const atividades = await db.atividade.findMany();
    return NextResponse.json(atividades);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar atividades' },
      { status: 500 }
    );
  }
}

// POST nova atividade
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Dados recebidos:', body);

    // Validação básica
    if (!body.nome) {
      return NextResponse.json(
        { error: 'O nome da atividade é obrigatório' },
        { status: 400 }
      );
    }

    const atividade = await db.atividade.create({
      data: {
        nome: body.nome,
        horario: body.horario || null,
        responsavel: body.responsavel || 'Usuário Anônimo',
        data: new Date(body.data),
      },
    });

    console.log('Atividade criada:', atividade);
    return NextResponse.json(atividade);

  } catch (error) {
    console.error('Erro detalhado:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar atividade',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}