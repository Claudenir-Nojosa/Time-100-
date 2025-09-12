// app/api/bases-legais/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { supabase } from "@/lib/supabase";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log(
      "[API BASES LEGAIS] Iniciando processamento da requisição GET..."
    );

    const { searchParams } = new URL(request.url);
    const uf = searchParams.get("uf");
    const usuarioId = searchParams.get("usuarioId");
    const apenasFavoritos = searchParams.get("apenasFavoritos") === "true";
    const tags = searchParams.get("tags")?.split(",") || [];
    const palavraChave = searchParams.get("palavraChave") || "";
    const tipoTributo = searchParams.get("tipoTributo") || "";
    const categoria = searchParams.get("categoria") || "";

    console.log("[API BASES LEGAIS] Parâmetros recebidos:", {
      uf,
      usuarioId,
      apenasFavoritos,
      tags,
      palavraChave,
      tipoTributo,
      categoria,
    });

    // Validação dos campos obrigatórios
    if (!usuarioId) {
      console.error("[API BASES LEGAIS] ID do usuário não especificado");
      return NextResponse.json(
        { error: "ID do usuário não especificado" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true },
    });

    if (!usuario) {
      console.error("[API BASES LEGAIS] Usuário não encontrado:", usuarioId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log(
      "[API BASES LEGAIS] Buscando bases legais no banco de dados..."
    );

    // Construir condições where - CORREÇÃO AQUI
    const whereConditions: any = {
      usuarioId,
    };

    if (uf) {
      whereConditions.uf = uf;
    }

    // CORREÇÃO: Filtro por favoritos - deve ser uma condição separada
    if (apenasFavoritos) {
      console.log("[API] Aplicando filtro de favoritos");
      whereConditions.favoritos = {
        some: {
          usuarioId: usuarioId,
        },
      };
    } else {
      console.log("[API] Sem filtro de favoritos");
    }

    // CORREÇÃO: Filtro por tags - use hasSome em vez de hasEvery
    if (tags.length > 0 && tags[0] !== "") {
      whereConditions.tags = {
        hasSome: tags,
      };
    }

    if (palavraChave) {
      const keyword = palavraChave.toLowerCase();

      const searchConditions: any[] = [
        { titulo: { contains: keyword, mode: "insensitive" } },
        { descricao: { contains: keyword, mode: "insensitive" } },
        { anotacoes: { contains: keyword, mode: "insensitive" } }, // Campo anotacoes da base legal
        {
          ArquivoBaseLegal: {
            some: {
              nome: { contains: keyword, mode: "insensitive" },
            },
          },
        },
        {
          tags: {
            hasSome: [keyword],
          },
        },
        // ADICIONE ESTA CONDIÇÃO PARA BUSCAR NAS ANOTAÇÕES DO USUÁRIO
        {
          Anotacao: {
            some: {
              conteudo: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          },
        },
      ];

      whereConditions.AND = [
        ...(whereConditions.AND || []),
        { OR: searchConditions },
      ];
    }
    if (tipoTributo) {
      whereConditions.tipoTributo = tipoTributo;
    }

    if (categoria) {
      whereConditions.categoria = categoria;
    }

    console.log("[API BASES LEGAIS] Condições WHERE:", whereConditions);

    // Buscar bases legais com filtros
    // Atualize o include para trazer o conteúdo das anotações
    const basesLegais = await prisma.baseLegal.findMany({
      where: whereConditions,
      include: {
        ArquivoBaseLegal: true,
        favoritos: {
          where: {
            usuarioId: usuarioId,
          },
        },
        Anotacao: {
          where: {
            usuarioId: usuarioId,
          },
          select: {
            id: true,
            conteudo: true, // IMPORTANTE: trazer o conteúdo
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        dataPublicacao: "desc",
      },
    });

    console.log(
      "[API BASES LEGAIS] Bases legais encontradas:",
      basesLegais.length
    );

    // DEBUG: Verificar se os favoritos estão sendo incluídos
    basesLegais.forEach((base, index) => {
      console.log(`[DEBUG] Base ${index + 1}:`, {
        id: base.id,
        titulo: base.titulo,
        favoritosCount: base.favoritos.length,
        hasFavorito: base.favoritos.length > 0,
      });
    });

    return NextResponse.json(basesLegais);
  } catch (error: any) {
    console.error("[API BASES LEGAIS] Erro completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Erro ao buscar bases legais",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(
      "[API BASES LEGAIS] Iniciando processamento da requisição POST..."
    );

    const formData = await request.formData();

    // Debug: verificar todos os campos recebidos
    const allFields: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "arquivos" && value instanceof File) {
        allFields[key] = allFields[key] || [];
        allFields[key].push({
          name: value.name,
          size: value.size,
          type: value.type,
        });
      } else {
        allFields[key] = value;
      }
    }

    console.log("[API BASES LEGAIS] Todos os campos recebidos:", allFields);
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
    const usuarioId = formData.get("usuarioId") as string;
    const arquivos = formData.getAll("arquivos") as File[];

    console.log("[API BASES LEGAIS] Dados recebidos:", {
      titulo,
      uf,
      usuarioId,
      categoria,
      tipoTributo,
      arquivosCount: arquivos.length,
    });

    // Validação dos campos obrigatórios
    const camposObrigatorios = [
      { field: "titulo", value: titulo },
      { field: "uf", value: uf },
      { field: "usuarioId", value: usuarioId },
    ];

    const camposFaltantes = camposObrigatorios.filter((campo) => !campo.value);
    if (camposFaltantes.length > 0) {
      console.error(
        "[API BASES LEGAIS] Campos obrigatórios faltando:",
        camposFaltantes
      );
      return NextResponse.json(
        {
          error: "Campos obrigatórios faltando",
          campos: camposFaltantes.map((c) => c.field),
        },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true },
    });

    if (!usuario) {
      console.error("[API BASES LEGAIS] Usuário não encontrado:", usuarioId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("[API BASES LEGAIS] Criando base legal no banco de dados...");

    // Criar a base legal
    const baseLegal = await prisma.baseLegal.create({
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
        usuarioId,
      },
    });

    console.log("[API BASES LEGAIS] Base legal criada com sucesso:", {
      id: baseLegal.id,
      titulo: baseLegal.titulo,
      uf: baseLegal.uf,
    });

    // Processar upload de arquivos se existirem
    if (arquivos && arquivos.length > 0) {
      console.log("[API BASES LEGAIS] Processando arquivos...");

      for (const file of arquivos) {
        if (file.size > 0) {
          try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = `bases-legais/${baseLegal.id}/${fileName}`;

            // Converter File para Buffer
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            console.log("[API BASES LEGAIS] Fazendo upload para Supabase:", {
              fileName,
              fileSize: file.size,
              fileType: file.type,
            });

            // Upload para o Supabase Storage
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("bases-legais")
                .upload(filePath, fileBuffer, {
                  contentType: file.type,
                  upsert: false,
                });

            if (uploadError) {
              console.error("[API BASES LEGAIS] Erro no upload:", uploadError);
              continue;
            }

            // Obter URL pública do arquivo
            const { data: urlData } = supabase.storage
              .from("bases-legais")
              .getPublicUrl(filePath);

            // Salvar metadados do arquivo no banco
            await prisma.arquivoBaseLegal.create({
              data: {
                nome: file.name,
                url: urlData.publicUrl,
                tamanho: file.size,
                baseLegalId: baseLegal.id,
              },
            });

            console.log(
              "[API BASES LEGAIS] Arquivo salvo com sucesso:",
              file.name
            );
          } catch (fileError) {
            console.error(
              "[API BASES LEGAIS] Erro ao processar arquivo:",
              fileError
            );
          }
        }
      }
    }

    // Retornar a base legal com os arquivos
    const baseLegalCompleta = await prisma.baseLegal.findUnique({
      where: { id: baseLegal.id },
      include: {
        ArquivoBaseLegal: true,
      },
    });

    return NextResponse.json(baseLegalCompleta, { status: 201 });
  } catch (error: any) {
    console.error("[API BASES LEGAIS] Erro completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Erro ao criar base legal",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
