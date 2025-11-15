import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

// GET todas as empresas - VERSÃO CORRIGIDA
export async function GET() {
  try {
    console.log("🔍 Iniciando busca de empresas...");

    const session = await auth();
    console.log("📋 Sessão:", session);

    if (!session?.user?.id) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("👤 User ID:", session.user.id);

    // Buscar empresas com tratamento de erro mais específico
    const empresas = await db.empresa.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Empresas encontradas: ${empresas.length}`);

    // Garantir que sempre retornamos um array
    return NextResponse.json(empresas || []);
  } catch (error) {
    console.error("❌ Erro detalhado ao buscar empresas:", error);

    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error("📝 Mensagem de erro:", error.message);
      console.error("🧩 Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Erro interno ao buscar empresas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST nova empresa - VERSÃO CORRIGIDA
export async function POST(request: NextRequest) {
  try {
    console.log("📦 Iniciando criação de empresa...");

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📄 Dados recebidos:", body);

    // Validação dos campos obrigatórios
    const camposObrigatorios = ["codigo", "descricao", "cnpj", "uf", "grupo"];
    const camposFaltantes = camposObrigatorios.filter((campo) => !body[campo]);

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios faltando",
          campos: camposFaltantes,
        },
        { status: 400 }
      );
    }

    // Verificar se código já existe
    const codigoExistente = await db.empresa.findFirst({
      where: {
        codigo: body.codigo,
        userId: session.user.id,
      },
    });

    if (codigoExistente) {
      return NextResponse.json(
        { error: "Já existe uma empresa com este código" },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe
    const cnpjExistente = await db.empresa.findFirst({
      where: {
        cnpj: body.cnpj,
        userId: session.user.id,
      },
    });

    if (cnpjExistente) {
      return NextResponse.json(
        { error: "Já existe uma empresa com este CNPJ" },
        { status: 400 }
      );
    }

    // Criar empresa
    const empresa = await db.empresa.create({
      data: {
        codigo: body.codigo,
        descricao: body.descricao,
        cnpj: body.cnpj,
        uf: body.uf,
        grupo: body.grupo,
        periodoCadastro: new Date(body.periodoCadastro),
        situacao: body.situacao,
        tributacao: body.tributacao,
        ie: body.ie || null,
        im: body.im || null,
        certificadoDigital: Boolean(body.certificadoDigital),
        email: body.email || null,
        userId: session.user.id,
      },
    });

    console.log("✅ Empresa criada com sucesso:", empresa.id);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error("❌ Erro detalhado ao criar empresa:", error);

    if (error instanceof Error) {
      console.error("📝 Mensagem de erro:", error.message);
      console.error("🧩 Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Erro interno ao criar empresa",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
