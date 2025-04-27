import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const empresa = await db.empresa.findUnique({
      where: { id: params.id },
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
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    return NextResponse.json(empresa);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar empresa" },
      { status: 500 }
    );
  }
}