import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

// GET todas as empresas
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresas = await db.empresa.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar empresas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST nova empresa
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validação dos campos obrigatórios
    if (
      !body.codigo ||
      !body.descricao ||
      !body.cnpj ||
      !body.uf ||
      !body.grupo
    ) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
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
        certificadoDigital: body.certificadoDigital,
        email: body.email || null,
        userId: session.user.id, // Usar o ID do usuário logado
      },
    });

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar empresa",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
