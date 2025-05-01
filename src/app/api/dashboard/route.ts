// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface MesData {
  mes: number;
  percentual: number;
}

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();

    // Dados do gráfico
    const principais = await db.$queryRaw<MesData[]>`
      SELECT EXTRACT(MONTH FROM dataEntrega) as mes,
             AVG(CASE WHEN entregue THEN 100 ELSE 0 END) as percentual
      FROM "EntregaObrigacaoPrincipal"
      WHERE EXTRACT(YEAR FROM dataEntrega) = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM dataEntrega)
      ORDER BY mes
    `;

    const acessorias = await db.$queryRaw<MesData[]>`
      SELECT EXTRACT(MONTH FROM dataEntrega) as mes,
             AVG(CASE WHEN entregue THEN 100 ELSE 0 END) as percentual
      FROM "EntregaObrigacaoAcessoria"
      WHERE EXTRACT(YEAR FROM dataEntrega) = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM dataEntrega)
      ORDER BY mes
    `;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = meses.map((mes, index) => ({
      name: mes,
      principais: Math.round(principais.find(p => p.mes === index + 1)?.percentual || 0),
      acessorias: Math.round(acessorias.find(a => a.mes === index + 1)?.percentual || 0)
    }));

    // Estatísticas adicionais
    const totalEmpresas = await db.empresa.count();
    
    const totalAcessorias = await db.empresaObrigacaoAcessoria.count();
    const entreguesAcessorias = await db.entregaObrigacaoAcessoria.count({
      where: { entregue: true, ano: currentYear }
    });
    const mediaAcessorias = 20

    const totalPrincipais = await db.empresaObrigacaoPrincipal.count();
    const entreguesPrincipais = await db.parcelamento.count({
      where: {
        status: 'PAGO',
        dataVencimento: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    });
    const mediaPrincipais = totalPrincipais > 0 
      ? Math.round((entreguesPrincipais / (totalPrincipais * 12)) * 100)
      : 0;

    return NextResponse.json({
      chartData,
      stats: {
        totalEmpresas,
        mediaAcessorias,
        mediaPrincipais
      }
    });

  } catch (error) {
    console.error('Erro no endpoint /api/dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}