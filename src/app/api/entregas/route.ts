import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { empresaObrigacaoId, mes, ano, entregue } = await request.json();

    const entrega = await db.entregaObrigacaoAcessoria.upsert({
      where: {
        empresaObrigacaoId_mes_ano: {
          empresaObrigacaoId,
          mes,
          ano
        }
      },
      update: {
        entregue,
        dataEntrega: entregue ? new Date() : null
      },
      create: {
        empresaObrigacaoId,
        mes,
        ano,
        entregue,
        dataEntrega: entregue ? new Date() : null
      }
    });

    return NextResponse.json(entrega);
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar entrega' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaObrigacaoId = searchParams.get('empresaObrigacaoId');
    
    if (!empresaObrigacaoId) {
      return NextResponse.json(
        { error: 'empresaObrigacaoId é obrigatório' },
        { status: 400 }
      );
    }

    const entregas = await db.entregaObrigacaoAcessoria.findMany({
      where: { empresaObrigacaoId },
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });

    return NextResponse.json(entregas);
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entregas' },
      { status: 500 }
    );
  }
}