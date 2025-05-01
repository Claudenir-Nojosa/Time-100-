// app/api/obrigacoes-principais/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const obrigacoes = await db.obrigacaoPrincipal.findMany({
    });

    return NextResponse.json(obrigacoes);
  } catch (error) {
    console.error('Erro ao buscar obrigações principais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar obrigações principais' },
      { status: 500 }
    );
  }
}