import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("[API] Iniciando processamento da requisição...");

    const body = await request.json().catch((error) => {
      console.error("[API] Erro ao parsear JSON:", error);
      throw new Error("Formato de dados inválido");
    });

    console.log("[API] Dados recebidos:", {
      ...body,
      // Ocultar dados sensíveis nos logs
      parcelamentos: body.parcelamentos?.length,
      obrigacoesAcessorias: body.obrigacoesAcessorias?.length,
      obrigacoesPrincipais: body.obrigacoesPrincipais?.length,
    });

    // Validação dos campos obrigatórios
    const camposObrigatorios = [
      { field: "razaoSocial", value: body.razaoSocial },
      { field: "cnpj", value: body.cnpj },
      { field: "regimeTributacao", value: body.regimeTributacao },
      { field: "usuarioId", value: body.usuarioId },
      { field: "uf", value: body.uf },
    ];

    const camposFaltantes = camposObrigatorios.filter((campo) => !campo.value);
    if (camposFaltantes.length > 0) {
      console.error("[API] Campos obrigatórios faltando:", camposFaltantes);
      return NextResponse.json(
        {
          error: "Campos obrigatórios faltando",
          campos: camposFaltantes.map((c) => c.field),
        },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: body.usuarioId },
      select: { id: true, email: true },
    });

    if (!usuario) {
      console.error("[API] Usuário não encontrado:", body.usuarioId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("[API] Criando empresa no banco de dados...");

    // Primeiro cria a empresa
    const novaEmpresa = await prisma.empresa.create({
      data: {
        razaoSocial: body.razaoSocial,
        cnpj: body.cnpj,
        email: body.email,
        cidade: body.cidade,
        uf: body.uf,
        regimeTributacao: body.regimeTributacao,
        responsavel: body.responsavel,
        observacoes: body.observacoes,
        usuarioId: body.usuarioId,

        obrigacoesAcessorias:
          body.obrigacoesAcessorias?.length > 0
            ? {
                create: body.obrigacoesAcessorias.map((oa: any) => ({
                  obrigacaoAcessoria: {
                    connect: { id: oa.obrigacaoAcessoriaId },
                  },
                  diaVencimento: oa.diaVencimento,
                  anteciparDiaNaoUtil: oa.anteciparDiaNaoUtil,
                })),
              }
            : undefined,

        obrigacoesPrincipais:
          body.obrigacoesPrincipais?.length > 0
            ? {
                create: body.obrigacoesPrincipais.map((op: any) => ({
                  obrigacaoPrincipal: {
                    connect: { id: op.obrigacaoPrincipalId },
                  },
                  diaVencimento: op.diaVencimento,
                  anteciparDiaNaoUtil: op.anteciparDiaNaoUtil,
                  aliquota: op.aliquota || 0,
                  descricao: op.descricao || null,
                  uf: op.uf || null,
                })),
              }
            : undefined,

        parcelamentos:
          body.parcelamentos?.length > 0
            ? {
                create: body.parcelamentos.map((p: any, index: number) => ({
                  numero: index + 1,
                  valor: p.debitoConsolidado,
                  dataVencimento: new Date(p.dataVencimento),
                  observacoes: p.observacoes || null,
                  status: "PENDENTE",
                })),
              }
            : undefined,
      },
      include: {
        obrigacoesAcessorias: {
          include: {
            obrigacaoAcessoria: true,
          },
        },
        obrigacoesPrincipais: {
          include: {
            obrigacaoPrincipal: true,
          },
        },
        parcelamentos: true,
      },
    });

    // Depois cria o status inicial da empresa
    const statusEmpresa = await prisma.statusEmpresa.create({
      data: {
        empresaId: novaEmpresa.id, // ← Use o ID real da empresa aqui
        integracao: false,
        analiseNCM: false,
        estudoTributacaoGeral: false,
        levantamentoPendencias: false,
        analiseServicos: false,
        complianceObrigacoesAcessorias: false,
        diagnostico: false,
        repasse: false,
        competencia: new Date().toLocaleDateString("pt-BR", {
          month: "2-digit",
          year: "numeric",
        }),
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
          },
        },
      },
    });

    console.log("[API] Empresa e status criados com sucesso:", {
      id: novaEmpresa.id,
      cnpj: novaEmpresa.cnpj,
      totalObrigacoes:
        novaEmpresa.obrigacoesAcessorias.length +
        novaEmpresa.obrigacoesPrincipais.length,
      totalParcelamentos: novaEmpresa.parcelamentos.length,
      statusId: statusEmpresa.id,
    });

    // Retorne a empresa com o status incluído
    const empresaComStatus = {
      ...novaEmpresa,
      status: statusEmpresa,
    };

    return NextResponse.json(empresaComStatus, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Erro ao criar empresa",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const responsavel = searchParams.get("responsavel");

    const where = responsavel ? { responsavel } : {};

    const empresas = await prisma.empresa.findMany({
      where,
      select: {
        id: true,
        razaoSocial: true,
        cnpj: true,
        uf: true,
        regimeTributacao: true,
        responsavel: true,
      },
      orderBy: {
        razaoSocial: "asc",
      },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}
