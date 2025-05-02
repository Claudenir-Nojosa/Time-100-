import { NextResponse } from "next/server";
import db from "@/lib/db";

// Adicione estas interfaces no início do arquivo
interface EmpresaObrigacao {
  id: string;
  empresaId: string;
  obrigacaoAcessoriaId: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
  empresa: {
    id: string;
    razaoSocial: string;
  };
}

interface EntregaDetalhada {
  empresaId: string;
  razaoSocial: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
  entregue: boolean;
  dataEntrega: Date | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");

    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Parâmetros 'mes' e 'ano' são obrigatórios" },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);
    const { id } = await params;

    // 1. Busca todas as empresas que tem essa obrigação
    const empresasComObrigacao = (await db.empresaObrigacaoAcessoria.findMany({
      where: {
        obrigacaoAcessoriaId: id,
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
          },
        },
      },
    })) as EmpresaObrigacao[];

    const totalEmpresas = empresasComObrigacao.length;

    // 2. Verifica quais empresas já entregaram
    const entregas = await db.entregaObrigacaoAcessoria.findMany({
      where: {
        empresaObrigacaoId: {
          in: empresasComObrigacao.map((eo: EmpresaObrigacao) => eo.id),
        },
        mes: mesNum,
        ano: anoNum,
        entregue: true,
      },
    });

    const totalEntregues = entregas.length;
    const porcentagemConclusao =
      totalEmpresas > 0
        ? Math.round((totalEntregues / totalEmpresas) * 100)
        : 0;

    // 3. Detalhamento por empresa
    const empresasDetalhadas = await Promise.all(
      empresasComObrigacao.map(
        async (eo: EmpresaObrigacao): Promise<EntregaDetalhada> => {
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
        }
      )
    );

    return NextResponse.json({
      obrigacaoAcessoriaId: id,
      mes: mesNum,
      ano: anoNum,
      totalEmpresas,
      totalEntregues,
      porcentagemConclusao,
      empresas: empresasDetalhadas,
    });
  } catch (error) {
    console.error("Erro ao buscar status de entregas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status de entregas" },
      { status: 500 }
    );
  }
}
