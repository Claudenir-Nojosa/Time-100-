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
  aliquota?: number | null;
  descricao?: string | null;
  uf?: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Resolve a Promise

    const empresa = await db.empresa.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params; // Resolve a Promise uma única vez

    // Atualiza a empresa
    const empresa = await db.empresa.update({
      where: { id: resolvedParams.id },
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

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Agora deleta a empresa
    const empresa = await db.empresa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, empresa });
  } catch (error) {
    console.error("Erro ao deletar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao deletar empresa", details: error },
      { status: 500 }
    );
  }
}
