// app/api/obrigacoes-acessorias/consolidado/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Obter e converter parâmetros (como antes)
    const mesParam = searchParams.get("mes");
    const anoParam = searchParams.get("ano");

    const mes = mesParam ? parseInt(mesParam) : new Date().getMonth() + 1;
    const ano = anoParam ? parseInt(anoParam) : new Date().getFullYear();

    // Validações (como antes)
    if (isNaN(mes)) {
      return NextResponse.json(
        { error: 'Parâmetro "mes" inválido' },
        { status: 400 }
      );
    }

    if (isNaN(ano)) {
      return NextResponse.json(
        { error: 'Parâmetro "ano" inválido' },
        { status: 400 }
      );
    }

    // Consulta modificada para converter BigInt para Number
    const dadosConsolidados = await db.$queryRaw`
      SELECT 
        o.id as "obrigacaoId",
        o.nome as "obrigacaoNome",
        COUNT(eoa.id)::integer as "totalEmpresas",
        SUM(CASE WHEN eoae.entregue = true THEN 1 ELSE 0 END)::integer as "totalEntregues"
      FROM 
        "ObrigacaoAcessoria" o
      LEFT JOIN 
        "EmpresaObrigacaoAcessoria" eoa ON o.id = eoa."obrigacaoAcessoriaId"
      LEFT JOIN 
        "EntregaObrigacaoAcessoria" eoae ON eoae."empresaObrigacaoId" = eoa.id
        AND eoae.mes = ${mes}
        AND eoae.ano = ${ano}
      GROUP BY 
        o.id, o.nome
      ORDER BY 
        o.nome ASC
    `;

    // Converter explicitamente para objetos JavaScript simples
    const resultado = JSON.parse(
      JSON.stringify(dadosConsolidados, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar dados consolidados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados consolidados" },
      { status: 500 }
    );
  }
}
