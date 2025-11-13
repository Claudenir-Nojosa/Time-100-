import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// GET empresa específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const empresa = await db.empresa.findFirst({
      where: {
        id,
        userId: session.user.id, // Só retorna se pertencer ao usuário
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

// PUT atualizar empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar se a empresa pertence ao usuário
    const empresaExistente = await db.empresa.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!empresaExistente) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se novo código já existe (se foi alterado)
    if (body.codigo !== empresaExistente.codigo) {
      const codigoExistente = await db.empresa.findFirst({
        where: {
          codigo: body.codigo,
          userId: session.user.id,
          NOT: { id },
        },
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: "Já existe uma empresa com este código" },
          { status: 400 }
        );
      }
    }

    // Verificar se novo CNPJ já existe (se foi alterado)
    if (body.cnpj !== empresaExistente.cnpj) {
      const cnpjExistente = await db.empresa.findFirst({
        where: {
          cnpj: body.cnpj,
          userId: session.user.id,
          NOT: { id },
        },
      });

      if (cnpjExistente) {
        return NextResponse.json(
          { error: "Já existe uma empresa com este CNPJ" },
          { status: 400 }
        );
      }
    }

    const empresa = await db.empresa.update({
      where: { id },
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
      },
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se a empresa pertence ao usuário
    const empresaExistente = await db.empresa.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!empresaExistente) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    await db.empresa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao deletar empresa" },
      { status: 500 }
    );
  }
}
