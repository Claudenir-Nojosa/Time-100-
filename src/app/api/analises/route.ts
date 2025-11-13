// app/api/analises/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    
    const where = empresaId ? { empresaId } : {};
    
    const analises = await db.analiseTributaria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        empresa: {
          select: {
            descricao: true
          }
        }
      }
    });

    return NextResponse.json(analises);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar análises" },
      { status: 500 }
    );
  }
}