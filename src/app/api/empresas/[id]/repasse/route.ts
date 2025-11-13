import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

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

    // Verificar se a empresa pertence ao usuário
    const empresa = await db.empresa.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Buscar repasse da empresa
    const repasse = await db.repasseEmpresa.findUnique({
      where: {
        empresaId: id,
      },
    });

    if (!repasse) {
      return NextResponse.json(
        { error: "Repasse não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(repasse);
  } catch (error) {
    console.error("Erro ao buscar repasse:", error);
    return NextResponse.json(
      { error: "Erro ao buscar repasse" },
      { status: 500 }
    );
  }
}
