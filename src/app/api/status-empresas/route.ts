import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET todos os status das empresas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");

    const where = empresaId ? { empresaId } : {};

    const statusEmpresas = await db.statusEmpresa.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Se não houver status, retorna array vazio instead de erro
    return NextResponse.json(statusEmpresas || []);
  } catch (error) {
    console.error("Erro ao buscar status das empresas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status das empresas" },
      { status: 500 }
    );
  }
}

// POST criar novo status para empresa
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação dos campos obrigatórios
    if (!body.empresaId) {
      return NextResponse.json(
        { error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe
    const empresa = await db.empresa.findUnique({
      where: { id: body.empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se já existe status para esta empresa
    const statusExistente = await db.statusEmpresa.findUnique({
      where: { empresaId: body.empresaId },
    });

    if (statusExistente) {
      return NextResponse.json(
        { error: "Já existe um status para esta empresa" },
        { status: 400 }
      );
    }

    // Criar o status da empresa
    const statusEmpresa = await db.statusEmpresa.create({
      data: {
        empresaId: body.empresaId,
        integracao: body.integracao || false,
        analiseNCM: body.analiseNCM || false,
        estudoTributacaoGeral: body.estudoTributacaoGeral || false,
        levantamentoPendencias: body.levantamentoPendencias || false,
        analiseServicos: body.analiseServicos || false,
        complianceObrigacoesAcessorias:
          body.complianceObrigacoesAcessorias || false,
        diagnostico: body.diagnostico || false,
        repasse: body.repasse || false,
        competencia:
          body.competencia ||
          new Date().toLocaleDateString("pt-BR", {
            month: "2-digit",
            year: "numeric",
          }),
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
          },
        },
      },
    });

    return NextResponse.json(statusEmpresa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar status da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar status da empresa" },
      { status: 500 }
    );
  }
}
