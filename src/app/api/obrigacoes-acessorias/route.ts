// app/api/obrigacoes-acessorias/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const obrigacoes = await db.obrigacaoAcessoria.findMany({
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(obrigacoes);
  } catch (error) {
    console.error('Erro ao buscar obrigações acessórias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar obrigações acessórias' },
      { status: 500 }
    );
  }
}