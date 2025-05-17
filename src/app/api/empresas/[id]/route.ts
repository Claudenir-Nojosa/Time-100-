import { NextResponse } from "next/server";
import db from "@/lib/db";

interface ObrigacaoAcessoria {
  id: string;
  empresaId: string;
  obrigacaoAcessoriaId: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
}

interface ObrigacaoPrincipal {
  id: string;
  empresaId: string;
  obrigacaoPrincipalId: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
  aliquota?: number | null; // Adicione | null
  descricao?: string | null; // Adicione | null
  uf?: string | null; // Adicione | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // Correção: Removido o Promise
) {
  try {
    const empresaId = params.id;

    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      include: {
        obrigacoesAcessorias: {
          include: {
            obrigacaoAcessoria: {
              select: {
                nome: true,
              },
            },
          },
        },
        obrigacoesPrincipais: {
          include: {
            obrigacaoPrincipal: {
              select: {
                nome: true,
              },
            },
          },
        },
        parcelamentos: {
          orderBy: {
            numero: "asc",
          },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } } // Correção: Removido o Promise
) {
  try {
    const body = await request.json();
    const empresaId = params.id; // Agora é direto, não precisa resolver Promise

    // Atualiza a empresa
    const empresa = await db.empresa.update({
      where: { id: empresaId },
      data: {
        razaoSocial: body.razaoSocial,
        cnpj: body.cnpj,
        inscricaoEstadual: body.inscricaoEstadual,
        email: body.email,
        cidade: body.cidade,
        uf: body.uf,
        regimeTributacao: body.regimeTributacao,
        responsavel: body.responsavel,
        observacoes: body.observacoes,
      },
    });

    // Atualiza obrigações acessórias
    await Promise.all(
      body.obrigacoesAcessorias.map(async (oa: any) => {
        if (oa.id) {
          // Atualiza existente
          return db.empresaObrigacaoAcessoria.update({
            where: { id: oa.id },
            data: {
              diaVencimento: oa.diaVencimento,
              anteciparDiaNaoUtil: oa.anteciparDiaNaoUtil,
            },
          });
        } else {
          // Cria nova
          return db.empresaObrigacaoAcessoria.create({
            data: {
              empresaId: empresaId, // Usando o resolvedParams
              obrigacaoAcessoriaId: oa.obrigacaoAcessoriaId,
              diaVencimento: oa.diaVencimento,
              anteciparDiaNaoUtil: oa.anteciparDiaNaoUtil,
            },
          });
        }
      })
    );

    // Remove obrigações acessórias não enviadas
    const obrigacoesAcessoriasAtuais =
      await db.empresaObrigacaoAcessoria.findMany({
        where: { empresaId: empresaId }, // Usando o resolvedParams
      });

    // E depois atualize a parte do código com o erro:
    const obrigacoesAcessoriasParaRemover = obrigacoesAcessoriasAtuais.filter(
      (oa: ObrigacaoAcessoria) =>
        !body.obrigacoesAcessorias.some((o: any) => o.id === oa.id)
    );

    await Promise.all(
      obrigacoesAcessoriasParaRemover.map((oa: ObrigacaoAcessoria) =>
        db.empresaObrigacaoAcessoria.delete({ where: { id: oa.id } })
      )
    );

    // Atualiza obrigações principais
    await Promise.all(
      body.obrigacoesPrincipais.map(async (op: any) => {
        if (op.id) {
          return db.empresaObrigacaoPrincipal.update({
            where: { id: op.id },
            data: {
              diaVencimento: op.diaVencimento,
              anteciparDiaNaoUtil: op.anteciparDiaNaoUtil,
              aliquota: op.aliquota,
              descricao: op.descricao,
              uf: op.uf,
            },
          });
        } else {
          return db.empresaObrigacaoPrincipal.create({
            data: {
              empresaId: empresaId,
              obrigacaoPrincipalId: op.obrigacaoPrincipalId,
              diaVencimento: op.diaVencimento,
              anteciparDiaNaoUtil: op.anteciparDiaNaoUtil,
              aliquota: op.aliquota,
              descricao: op.descricao,
              uf: op.uf,
            },
          });
        }
      })
    );

    // Remove obrigações principais não enviadas
    const obrigacoesPrincipaisAtuais =
      await db.empresaObrigacaoPrincipal.findMany({
        where: { empresaId: empresaId }, // Usando o resolvedParams
      });

    const obrigacoesPrincipaisParaRemover = obrigacoesPrincipaisAtuais.filter(
      (op: ObrigacaoPrincipal) =>
        !body.obrigacoesPrincipais.some((o: any) => o.id === op.id)
    );
    await Promise.all(
      obrigacoesPrincipaisParaRemover.map((op: ObrigacaoPrincipal) =>
        db.empresaObrigacaoPrincipal.delete({ where: { id: op.id } })
      )
    );

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}
