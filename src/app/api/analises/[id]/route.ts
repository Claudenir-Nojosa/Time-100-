// app/api/analises/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const analise = await db.analiseTributaria.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            razaoSocial: true,
            cnpj: true
          }
        }
      }
    });

    if (!analise) {
      return NextResponse.json(
        { error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(analise);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar análise" },
      { status: 500 }
    );
  }
}