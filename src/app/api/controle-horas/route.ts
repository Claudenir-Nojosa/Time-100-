// src/app/api/controle-horas/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

// GET - Buscar registros do mês
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes"); // formato: "2024-01"

    if (!mes) {
      return NextResponse.json({ error: "Mês é obrigatório" }, { status: 400 });
    }

    // Calcular início e fim do mês
    const [ano, mesNum] = mes.split("-").map(Number);
    const inicioMes = new Date(ano, mesNum - 1, 1);
    const fimMes = new Date(ano, mesNum, 0, 23, 59, 59);

    const registros = await db.controleHoras.findMany({
      where: {
        userId: usuario.id,
        data: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      orderBy: {
        data: "asc",
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Erro ao buscar registros:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar/atualizar registro
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validações
    const camposObrigatorios = [
      "data",
      "entradaPrevista",
      "almocoSaidaPrevista",
      "almocoRetornoPrevisto",
      "saidaPrevista",
    ];
    const camposFaltantes = camposObrigatorios.filter((campo) => !body[campo]);

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando", campos: camposFaltantes },
        { status: 400 }
      );
    }

    // Função para calcular diferença em minutos
    function calcularDiferencaMinutos(hora1: string, hora2: string): number {
      const [h1, m1] = hora1.split(":").map(Number);
      const [h2, m2] = hora2.split(":").map(Number);
      return h2 * 60 + m2 - (h1 * 60 + m1);
    }

    // Calcular métricas
    let atrasoEntrada = 0;
    let atrasoAlmoco = 0;
    let horasExtras = 0;
    let horasTrabalhadas = 0;

    if (body.entradaReal) {
      atrasoEntrada = Math.max(
        0,
        calcularDiferencaMinutos(body.entradaPrevista, body.entradaReal)
      );
    }

    if (body.almocoRetornoReal) {
      atrasoAlmoco = Math.max(
        0,
        calcularDiferencaMinutos(
          body.almocoRetornoPrevisto,
          body.almocoRetornoReal
        )
      );
    }

    if (body.saidaReal) {
      const saidaPrevistaMinutos = calcularDiferencaMinutos(
        "00:00",
        body.saidaPrevista
      );
      const saidaRealMinutos = calcularDiferencaMinutos(
        "00:00",
        body.saidaReal
      );
      horasExtras = Math.max(0, saidaRealMinutos - saidaPrevistaMinutos);

      // Calcular horas trabalhadas (entrada até saída, menos almoço)
      if (body.entradaReal && body.almocoSaidaReal && body.almocoRetornoReal) {
        const manha = calcularDiferencaMinutos(
          body.entradaReal,
          body.almocoSaidaReal
        );
        const tarde = calcularDiferencaMinutos(
          body.almocoRetornoReal,
          body.saidaReal
        );
        horasTrabalhadas = manha + tarde;
      }
    }

    // Upsert (criar ou atualizar)
    const registro = await db.controleHoras.upsert({
      where: {
        userId_data: {
          userId: usuario.id,
          data: new Date(body.data),
        },
      },
      update: {
        entradaReal: body.entradaReal || null,
        almocoSaidaReal: body.almocoSaidaReal || null,
        almocoRetornoReal: body.almocoRetornoReal || null,
        saidaReal: body.saidaReal || null,
        atrasoEntrada,
        atrasoAlmoco,
        horasExtras,
        horasTrabalhadas,
        observacoes: body.observacoes || null,
      },
      create: {
        data: new Date(body.data),
        userId: usuario.id,
        entradaPrevista: body.entradaPrevista,
        almocoSaidaPrevista: body.almocoSaidaPrevista,
        almocoRetornoPrevisto: body.almocoRetornoPrevisto,
        saidaPrevista: body.saidaPrevista,
        entradaReal: body.entradaReal || null,
        almocoSaidaReal: body.almocoSaidaReal || null,
        almocoRetornoReal: body.almocoRetornoReal || null,
        saidaReal: body.saidaReal || null,
        atrasoEntrada,
        atrasoAlmoco,
        horasExtras,
        horasTrabalhadas,
        observacoes: body.observacoes || null,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar registro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
