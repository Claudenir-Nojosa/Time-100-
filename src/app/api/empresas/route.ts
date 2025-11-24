import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

// POST nova empresa - VERSÃO CORRIGIDA
export async function POST(request: NextRequest) {
  try {
    console.log("📦 Iniciando criação de empresa...");

    const session = await auth();

    console.log("🔍 Debug sessão:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔥 SOLUÇÃO: Buscar usuário por EMAIL em vez de ID
    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      console.log("❌ Usuário não encontrado no banco pelo email:", session.user.email);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Usuário encontrado pelo email:", usuario.id, usuario.email);

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

    // Verificar se código já existe para este usuário
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

    // Verificar se CNPJ já existe para este usuário
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

    // Preparar dados para criação
    const dadosEmpresa = {
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
      userId: usuario.id, // Agora temos certeza que este userId existe
    };

    console.log("📝 Dados da empresa a serem criados:", dadosEmpresa);

    // Criar empresa
    const empresa = await db.empresa.create({
      data: dadosEmpresa,
    });

    console.log("✅ Empresa criada com sucesso:", empresa.id);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error("❌ Erro detalhado ao criar empresa:", error);

    if (error instanceof Error) {
      console.error("📝 Mensagem de erro:", error.message);
      console.error("🧩 Stack trace:", error.stack);
    }

    // Tratamento específico para erro de chave estrangeira
    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Erro de referência: usuário não encontrado",
          details: "O usuário associado não existe no banco de dados",
        },
        { status: 400 }
      );
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

// GET todas as empresas
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário por email
    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar empresas com ID correto
    const empresas = await db.empresa.findMany({
      where: {
        userId: usuario.id, // ← ID correto do banco
      },
      orderBy: { createdAt: "desc" },
    });
    

    console.log(`✅ Empresas encontradas: ${empresas.length}`);

    return NextResponse.json(empresas || []);
  } catch (error) {
    console.error("❌ Erro detalhado ao buscar empresas:", error);

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
