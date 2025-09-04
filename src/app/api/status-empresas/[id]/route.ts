import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET status específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ← Adicione Promise aqui
) {
  try {
    const { id } = await params; // ← Aguarde a Promise
    
    const statusEmpresa = await db.statusEmpresa.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true
          }
        }
      }
    });

    if (!statusEmpresa) {
      return NextResponse.json(
        { error: "Status da empresa não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(statusEmpresa);
  } catch (error) {
    console.error('Erro ao buscar status da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status da empresa' },
      { status: 500 }
    );
  }
}

// PUT atualizar status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ← Adicione Promise aqui
) {
  try {
    const { id } = await params; // ← Aguarde a Promise
    const body = await request.json();

    const statusEmpresa = await db.statusEmpresa.update({
      where: { id },
      data: {
        integracao: body.integracao,
        analiseNCM: body.analiseNCM,
        estudoTributacaoGeral: body.estudoTributacaoGeral,
        levantamentoPendencias: body.levantamentoPendencias,
        analiseServicos: body.analiseServicos,
        complianceObrigacoesAcessorias: body.complianceObrigacoesAcessorias,
        diagnostico: body.diagnostico,
        repasse: body.repasse,
        competencia: body.competencia
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true
          }
        }
      }
    });

    return NextResponse.json(statusEmpresa);
  } catch (error) {
    console.error('Erro ao atualizar status da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status da empresa' },
      { status: 500 }
    );
  }
}

// DELETE status
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ← Adicione Promise aqui
) {
  try {
    const { id } = await params; // ← Aguarde a Promise
    
    await db.statusEmpresa.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar status da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar status da empresa' },
      { status: 500 }
    );
  }
}