// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

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

    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const chartData = meses.map((mes, index) => ({
      name: mes,
      principais: Math.round(
        principais.find((p: MesData) => p.mes === index + 1)?.percentual || 0
      ),
      acessorias: Math.round(
        acessorias.find((a: MesData) => a.mes === index + 1)?.percentual || 0
      ),
    }));
  } catch (error) {
    console.error("Erro no endpoint /api/dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
