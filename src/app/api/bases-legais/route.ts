import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log(
      "[API BASES LEGAIS] Iniciando processamento da requisição GET..."
    );

    const { searchParams } = new URL(request.url);
    const uf = searchParams.get("uf");
    const usuarioId = searchParams.get("usuarioId");

    console.log("[API BASES LEGAIS] Parâmetros recebidos:", { uf, usuarioId });

    // Validação dos campos obrigatórios
    if (!uf) {
      console.error("[API BASES LEGAIS] UF não especificada");
      return NextResponse.json(
        { error: "UF não especificada" },
        { status: 400 }
      );
    }

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

    // Buscar bases legais do usuário para a UF especificada
    const basesLegais = await prisma.baseLegal.findMany({
      where: {
        uf,
        usuarioId,
      },
      orderBy: {
        dataPublicacao: "desc",
      },
    });

    console.log(
      "[API BASES LEGAIS] Bases legais encontradas:",
      basesLegais.length
    );

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

export async function POST(request: Request) {
  try {
    console.log(
      "[API BASES LEGAIS] Iniciando processamento da requisição POST..."
    );

    const body = await request.json().catch((error) => {
      console.error("[API BASES LEGAIS] Erro ao parsear JSON:", error);
      throw new Error("Formato de dados inválido");
    });

    console.log("[API BASES LEGAIS] Dados recebidos:", body);

    // Validação dos campos obrigatórios
    const camposObrigatorios = [
      { field: "titulo", value: body.titulo },
      { field: "uf", value: body.uf },
      { field: "usuarioId", value: body.usuarioId },
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
      where: { id: body.usuarioId },
      select: { id: true, email: true },
    });

    if (!usuario) {
      console.error(
        "[API BASES LEGAIS] Usuário não encontrado:",
        body.usuarioId
      );
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("[API BASES LEGAIS] Criando base legal no banco de dados...");

    // Criar a base legal
    const baseLegal = await prisma.baseLegal.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao || "",
        link: body.link || "",
        uf: body.uf,
        categoria: body.categoria || "",
        dataPublicacao: new Date(body.dataPublicacao || new Date()),
        usuarioId: body.usuarioId,
      },
    });

    console.log("[API BASES LEGAIS] Base legal criada com sucesso:", {
      id: baseLegal.id,
      titulo: baseLegal.titulo,
      uf: baseLegal.uf,
    });

    return NextResponse.json(baseLegal, { status: 201 });
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
