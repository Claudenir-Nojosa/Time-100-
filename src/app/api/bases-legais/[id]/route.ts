import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import db from "@/lib/db";



export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API BASE LEGAL] Editando base legal ID: ${params.id}`);

    const formData = await request.formData();
    
    // Extrair campos do formulário
    const titulo = formData.get("titulo") as string;
    const descricao = formData.get("descricao") as string;
    const link = formData.get("link") as string;
    const uf = formData.get("uf") as string;
    const categoria = formData.get("categoria") as string;
    const dataPublicacao = formData.get("dataPublicacao") as string;
    const tags = formData.get("tags") as string;
    const tipoTributo = formData.get("tipoTributo") as string;
    const anotacoes = formData.get("anotacoes") as string;
    const status = formData.get("status") as string;
    const arquivos = formData.getAll("arquivos") as File[];

    // Verificar se a base legal existe
    const baseExistente = await db.baseLegal.findUnique({
      where: { id: params.id },
      include: { ArquivoBaseLegal: true },
    });

    if (!baseExistente) {
      return NextResponse.json(
        { error: "Base legal não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar a base legal
    const baseLegal = await db.baseLegal.update({
      where: { id: params.id },
      data: {
        titulo,
        descricao: descricao || "",
        link: link || "",
        uf,
        categoria: categoria || "",
        dataPublicacao: new Date(dataPublicacao || new Date()),
        tags: tags ? JSON.parse(tags) : [],
        tipoTributo: tipoTributo || "",
        anotacoes: anotacoes || "",
        status: status || "Vigente",
      },
      include: {
        ArquivoBaseLegal: true,
      },
    });

    // Processar upload de novos arquivos
    if (arquivos && arquivos.length > 0) {
      for (const file of arquivos) {
        if (file.size > 0) {
          try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = `bases-legais/${baseLegal.id}/${fileName}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // Upload para o Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("bases-legais")
              .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
              });

            if (uploadError) {
              console.error("Erro no upload:", uploadError);
              continue;
            }

            // Obter URL pública do arquivo
            const { data: urlData } = supabase.storage
              .from("bases-legais")
              .getPublicUrl(filePath);

            // Salvar metadados do arquivo no banco
            await db.arquivoBaseLegal.create({
              data: {
                nome: file.name,
                url: urlData.publicUrl,
                tamanho: file.size,
                baseLegalId: baseLegal.id,
              },
            });
          } catch (fileError) {
            console.error("Erro ao processar arquivo:", fileError);
          }
        }
      }
    }

    // Retornar a base legal atualizada com todos os arquivos
    const baseLegalCompleta = await db.baseLegal.findUnique({
      where: { id: params.id },
      include: {
        ArquivoBaseLegal: true,
      },
    });

    return NextResponse.json(baseLegalCompleta);

  } catch (error: any) {
    console.error("[API BASE LEGAL] Erro ao editar:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao editar base legal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API BASE LEGAL] Excluindo base legal ID: ${params.id}`);

    // Verificar se a base legal existe
    const baseExistente = await db.baseLegal.findUnique({
      where: { id: params.id },
      include: { ArquivoBaseLegal: true },
    });

    if (!baseExistente) {
      return NextResponse.json(
        { error: "Base legal não encontrada" },
        { status: 404 }
      );
    }

    // Excluir arquivos do Supabase Storage
    if (baseExistente.ArquivoBaseLegal.length > 0) {
      const pathsToDelete = baseExistente.ArquivoBaseLegal.map(arquivo => {
        const urlParts = arquivo.url.split('/');
        return urlParts.slice(urlParts.indexOf('bases-legais')).join('/');
      });

      const { error: deleteError } = await supabase.storage
        .from("bases-legais")
        .remove(pathsToDelete);

      if (deleteError) {
        console.error("Erro ao excluir arquivos do storage:", deleteError);
      }
    }

    // Excluir registros do banco de dados (em ordem correta por causa das FK)
    await db.anotacao.deleteMany({
      where: { baseLegalId: params.id },
    });

    await db.arquivoBaseLegal.deleteMany({
      where: { baseLegalId: params.id },
    });

    await db.baseLegal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Base legal excluída com sucesso" 
    });

  } catch (error: any) {
    console.error("[API BASE LEGAL] Erro ao excluir:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir base legal" },
      { status: 500 }
    );
  }
}