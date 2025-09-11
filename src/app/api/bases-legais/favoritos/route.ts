// app/api/bases-legais/favoritos/route.ts - CORREÇÃO
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { baseLegalId, usuarioId } = await request.json();

    console.log("[API FAVORITOS] Dados recebidos:", { baseLegalId, usuarioId });

    // Verificar se a base legal existe
    const baseLegal = await prisma.baseLegal.findUnique({
      where: { id: baseLegalId },
    });

    if (!baseLegal) {
      console.error("[API FAVORITOS] Base legal não encontrada");
      return NextResponse.json(
        { error: "Base legal não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se já é favorito
    const favoritoExistente = await prisma.baseLegalFavorito.findUnique({
      where: {
        baseLegalId_usuarioId: {
          baseLegalId,
          usuarioId,
        },
      },
    });

    console.log("[API FAVORITOS] Favorito existente:", favoritoExistente);

    if (favoritoExistente) {
      // Remover dos favoritos
      await prisma.baseLegalFavorito.delete({
        where: {
          id: favoritoExistente.id,
        },
      });
      console.log("[API FAVORITOS] Favorito removido");
      return NextResponse.json({ favoritado: false, success: true });
    } else {
      // Adicionar aos favoritos
      await prisma.baseLegalFavorito.create({
        data: {
          baseLegalId,
          usuarioId,
        },
      });
      console.log("[API FAVORITOS] Favorito adicionado");
      return NextResponse.json({ favoritado: true, success: true });
    }
  } catch (error: any) {
    console.error("[API FAVORITOS] Erro:", error.message);
    return NextResponse.json(
      { error: "Erro ao atualizar favorito" },
      { status: 500 }
    );
  }
}
