import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Parâmetros 'mes' e 'ano' são obrigatórios" },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    // 1. Busca todas as empresas que tem essa obrigação
    const empresasComObrigacao = await db.empresaObrigacaoAcessoria.findMany({
      where: {
        obrigacaoAcessoriaId: params.id,
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
          },
        },
      },
    });

    const totalEmpresas = empresasComObrigacao.length;

    // 2. Verifica quais empresas já entregaram
    const entregas = await db.entregaObrigacaoAcessoria.findMany({
      where: {
        empresaObrigacaoId: {
          in: empresasComObrigacao.map(eo => eo.id),
        },
        mes: mesNum,
        ano: anoNum,
        entregue: true,
      },
    });

    const totalEntregues = entregas.length;
    const porcentagemConclusao = totalEmpresas > 0 
      ? Math.round((totalEntregues / totalEmpresas) * 100)
      : 0;

    // 3. Detalhamento por empresa
    const empresasDetalhadas = await Promise.all(
      empresasComObrigacao.map(async (eo) => {
        const entrega = await db.entregaObrigacaoAcessoria.findFirst({
          where: {
            empresaObrigacaoId: eo.id,
            mes: mesNum,
            ano: anoNum,
          },
        });

        return {
          empresaId: eo.empresa.id,
          razaoSocial: eo.empresa.razaoSocial,
          diaVencimento: eo.diaVencimento,
          anteciparDiaNaoUtil: eo.anteciparDiaNaoUtil,
          entregue: entrega?.entregue || false,
          dataEntrega: entrega?.dataEntrega || null,
        };
      })
    );

    return NextResponse.json({
      obrigacaoAcessoriaId: params.id,
      mes: mesNum,
      ano: anoNum,
      totalEmpresas,
      totalEntregues,
      porcentagemConclusao,
      empresas: empresasDetalhadas,
    });
  } catch (error) {
    console.error('Erro ao buscar status de entregas:', error);
    return NextResponse.json(
      { error: "Erro ao buscar status de entregas" },
      { status: 500 }
    );
  }
}