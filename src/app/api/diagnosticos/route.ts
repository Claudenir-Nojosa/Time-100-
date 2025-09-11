import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("[API DIAGNOSTICOS] Iniciando processamento da requisição POST...");

    const body = await request.json();
    const { data, cnpj, nomeEmpresa, status, formData, usuarioId } = body;

    console.log("[API DIAGNOSTICOS] Dados recebidos:", {
      cnpj,
      nomeEmpresa,
      status,
      usuarioId,
    });

    // Validação dos campos obrigatórios
    if (!cnpj || !nomeEmpresa || !usuarioId) {
      console.error("[API DIAGNOSTICOS] Campos obrigatórios faltando");
      return NextResponse.json(
        { error: "Campos obrigatórios faltando: cnpj, nomeEmpresa, usuarioId" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true },
    });

    if (!usuario) {
      console.error("[API DIAGNOSTICOS] Usuário não encontrado:", usuarioId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Criar o diagnóstico no banco de dados
    const diagnostico = await prisma.diagnostico.create({
      data: {
        data: new Date(data || new Date()),
        cnpj,
        nomeEmpresa,
        status: status || "Concluído",
        formData: formData || {},
        usuario: {
          connect: { id: usuarioId },
        },
      },
    });

    console.log("[API DIAGNOSTICOS] Diagnóstico criado com sucesso:", {
      id: diagnostico.id,
      nomeEmpresa: diagnostico.nomeEmpresa,
    });

    return NextResponse.json(diagnostico, { status: 201 });
  } catch (error: any) {
    console.error("[API DIAGNOSTICOS] Erro completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Erro ao criar diagnóstico",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log("[API DIAGNOSTICOS] Iniciando processamento da requisição GET...");

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    console.log("[API DIAGNOSTICOS] Parâmetros recebidos:", { usuarioId });

    if (!usuarioId) {
      console.error("[API DIAGNOSTICOS] ID do usuário não especificado");
      return NextResponse.json(
        { error: "ID do usuário não especificado" },
        { status: 400 }
      );
    }

    // Buscar diagnósticos do usuário
    const diagnosticos = await prisma.diagnostico.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        data: "desc",
      },
    });

    console.log("[API DIAGNOSTICOS] Diagnósticos encontrados:", diagnosticos.length);

    return NextResponse.json(diagnosticos);
  } catch (error: any) {
    console.error("[API DIAGNOSTICOS] Erro completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Erro ao buscar diagnósticos",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}