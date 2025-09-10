import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { supabase } from "@/lib/supabase";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log(`[API ARQUIVO] Excluindo arquivo ID: ${resolvedParams.id}`);

    // Buscar o arquivo no banco
    const arquivo = await prisma.arquivoBaseLegal.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!arquivo) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Excluir do Supabase Storage
    const urlParts = arquivo.url.split("/");
    const filePath = urlParts.slice(urlParts.indexOf("bases-legais")).join("/");

    const { error: storageError } = await supabase.storage
      .from("bases-legais")
      .remove([filePath]);

    if (storageError) {
      console.error("Erro ao excluir arquivo do storage:", storageError);
    }

    // Excluir do banco de dados
    await prisma.arquivoBaseLegal.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({
      success: true,
      message: "Arquivo excluído com sucesso",
    });
  } catch (error: any) {
    console.error("[API ARQUIVO] Erro ao excluir:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir arquivo" },
      { status: 500 }
    );
  }
}
