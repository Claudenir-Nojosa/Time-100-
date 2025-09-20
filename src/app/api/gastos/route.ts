// app/api/gastos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');
    const categoria = searchParams.get('categoria');
    const tipo = searchParams.get('tipo');

    // Construir filtros
    const where: any = {};

    if (mes && ano) {
      where.data = {
        gte: new Date(`${ano}-${mes}-01`),
        lt: new Date(`${ano}-${Number(mes) + 1}-01`),
      };
    }

    if (categoria && categoria !== 'todas') {
      where.categoria = categoria;
    }

    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }

    // Buscar gastos do banco
    const gastos = await db.gasto.findMany({
      where,
      orderBy: {
        data: 'desc',
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Calcular totais
    const totais = await db.gasto.groupBy({
      where,
      by: ['categoria'],
      _sum: {
        valor: true,
      },
    });

    const totalReceitas = await db.gasto.aggregate({
      where: {
        ...where,
        categoria: 'receita',
      },
      _sum: {
        valor: true,
      },
    });

    const totalDespesas = await db.gasto.aggregate({
      where: {
        ...where,
        categoria: { not: 'receita' },
      },
      _sum: {
        valor: true,
      },
    });

    return NextResponse.json({
      gastos,
      totais,
      resumo: {
        receitas: totalReceitas._sum.valor || 0,
        despesas: totalDespesas._sum.valor || 0,
        saldo: (totalReceitas._sum.valor || 0) - (totalDespesas._sum.valor || 0),
      },
    });

  } catch (error) {
    console.error('Erro ao buscar gastos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}