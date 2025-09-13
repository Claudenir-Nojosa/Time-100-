// app/api/gerar-analise/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { prompt, empresaId, usuarioId, mesReferencia, dadosApuracao } =
      await request.json();

    console.log("Dados recebidos na API:", {
      temPrompt: !!prompt,
      empresaId,
      usuarioId,
      mesReferencia,
      temDadosApuracao: !!dadosApuracao,
      quantidadeMeses: dadosApuracao?.length || 0,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key não configurada" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const analise = data.content[0].text;

    if (!analise) {
      throw new Error("Não foi possível gerar a análise");
    }

    // Salvar no banco de dados se tiver empresaId e usuarioId
    if (empresaId && usuarioId && mesReferencia) {
      console.log("Salvando no banco de dados...");

      // Extrair indicadores detalhados para dashboards
      const indicadores = extrairIndicadoresCompletos(dadosApuracao, analise);

      try {
        await db.analiseTributaria.create({
          data: {
            empresaId,
            usuarioId,
            mesReferencia,
            dadosApuracao: dadosApuracao,
            analiseTexto: analise,
            indicadores: indicadores,
          },
        });
        console.log("Análise salva no banco com sucesso!");
      } catch (dbError) {
        console.error("Erro ao salvar no banco:", dbError);
        // Não interromper o fluxo, apenas logar o erro
      }
    }

    return NextResponse.json({
      analise,
      salvoNoBanco: !!(empresaId && usuarioId && mesReferencia),
    });
  } catch (error) {
    console.error("Erro ao gerar análise:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Função para extrair indicadores completos para dashboards
function extrairIndicadoresCompletos(dadosApuracao: any[], analise: string) {
  const indicadoresBase = calcularIndicadoresBase(dadosApuracao);
  const indicadoresMensais = calcularIndicadoresMensais(dadosApuracao);
  const tendencias = analisarTendencias(dadosApuracao);
  const insights = extrairInsightsDaAnalise(analise);

  return {
    // Indicadores consolidados
    consolidado: indicadoresBase,

    // Dados mensais para gráficos de série temporal
    mensal: indicadoresMensais,

    // Tendências e variações
    tendencias: tendencias,

    // Insights extraídos da análise textual
    insights: insights,

    // Metadados para filtros e organização
    metadados: {
      totalMeses: dadosApuracao.length,
      periodo: {
        inicio: dadosApuracao[0]?.mes,
        fim: dadosApuracao[dadosApuracao.length - 1]?.mes,
      },
      ultimaAtualizacao: new Date().toISOString(),
    },
  };
}

function calcularIndicadoresBase(dadosApuracao: any[]) {
  const faturamentoTotal = calcularFaturamentoTotal(dadosApuracao);
  const impostosTotais = calcularImpostosTotais(dadosApuracao);
  const comprasTotais = calcularComprasTotais(dadosApuracao);
  const cargaTributariaMedia = calcularCargaTributariaMedia(dadosApuracao);
  const margemBrutaMedia = calcularMargemBrutaMedia(dadosApuracao);

  return {
    financeiros: {
      faturamentoTotal,
      comprasTotais,
      lucroBruto: faturamentoTotal - comprasTotais,
      margemBruta:
        ((faturamentoTotal - comprasTotais) / faturamentoTotal) * 100,
      ticketMedio: faturamentoTotal / dadosApuracao.length,
    },

    tributarios: {
      impostosTotais,
      cargaTributaria: cargaTributariaMedia,
      impostosPorTipo: calcularImpostosPorTipo(dadosApuracao),
      eficienciaTributaria: calcularEficienciaTributaria(dadosApuracao),
    },

    operacionais: {
      mesesAnalisados: dadosApuracao.length,
      faturamentoMensalMedio: faturamentoTotal / dadosApuracao.length,
      variacaoMensal: calcularVariacaoMensal(dadosApuracao),
      sazonalidade: analisarSazonalidade(dadosApuracao),
    },
  };
}

function calcularIndicadoresMensais(dadosApuracao: any[]) {
  return dadosApuracao.map((mes, index) => {
    const faturamentoMes =
      (mes.faturamento?.comercio || 0) +
      (mes.faturamento?.industria || 0) +
      (mes.faturamento?.servicos || 0);

    const impostosMes =
      (mes.impostos?.simples || 0) +
      (mes.impostos?.icms || 0) +
      (mes.impostos?.pis || 0) +
      (mes.impostos?.cofins || 0) +
      (mes.impostos?.ipi || 0) +
      (mes.impostos?.iss || 0);

    const comprasMes = mes.totalCompras || 0;
    const lucroBrutoMes = faturamentoMes - comprasMes;
    const margemBrutaMes =
      faturamentoMes > 0 ? (lucroBrutoMes / faturamentoMes) * 100 : 0;
    const cargaTributariaMes =
      faturamentoMes > 0 ? (impostosMes / faturamentoMes) * 100 : 0;

    return {
      mes: mes.mes,
      financeiro: {
        faturamento: faturamentoMes,
        compras: comprasMes,
        lucroBruto: lucroBrutoMes,
        margemBruta: margemBrutaMes,
      },
      tributario: {
        impostos: impostosMes,
        cargaTributaria: cargaTributariaMes,
        impostosPorTipo: {
          simples: mes.impostos?.simples || 0,
          icms: mes.impostos?.icms || 0,
          pis: mes.impostos?.pis || 0,
          cofins: mes.impostos?.cofins || 0,
          ipi: mes.impostos?.ipi || 0,
          iss: mes.impostos?.iss || 0,
        },
      },
      atividades: {
        comercio: mes.faturamento?.comercio || 0,
        industria: mes.faturamento?.industria || 0,
        servicos: mes.faturamento?.servicos || 0,
      },
    };
  });
}

function analisarTendencias(dadosApuracao: any[]) {
  const indicadoresMensais = calcularIndicadoresMensais(dadosApuracao);

  if (indicadoresMensais.length < 2) {
    return { temDadosSuficientes: false };
  }

  const primeiroMes = indicadoresMensais[0];
  const ultimoMes = indicadoresMensais[indicadoresMensais.length - 1];

  return {
    faturamento: {
      variacao:
        ((ultimoMes.financeiro.faturamento -
          primeiroMes.financeiro.faturamento) /
          primeiroMes.financeiro.faturamento) *
        100,
      tendencia:
        ultimoMes.financeiro.faturamento > primeiroMes.financeiro.faturamento
          ? "alta"
          : "baixa",
    },
    margem: {
      variacao:
        ultimoMes.financeiro.margemBruta - primeiroMes.financeiro.margemBruta,
      tendencia:
        ultimoMes.financeiro.margemBruta > primeiroMes.financeiro.margemBruta
          ? "alta"
          : "baixa",
    },
    cargaTributaria: {
      variacao:
        ultimoMes.tributario.cargaTributaria -
        primeiroMes.tributario.cargaTributaria,
      tendencia:
        ultimoMes.tributario.cargaTributaria >
        primeiroMes.tributario.cargaTributaria
          ? "alta"
          : "baixa",
    },
  };
}

function extrairInsightsDaAnalise(analise: string) {
  // Usar um tipo simples que seja compatível com JSON
  const insights: Record<string, string[]> = {
    pontosAtencao: [],
    oportunidades: [],
    recomendacoes: [],
    alertas: [],
  };

  // Exemplos simples de extração (em produção, usar IA mais sofisticada)
  if (
    analise.includes("atenção") ||
    analise.includes("cuidado") ||
    analise.includes("risco")
  ) {
    insights.pontosAtencao.push(
      "Foram identificados pontos de atenção na análise"
    );
  }

  if (
    analise.includes("oportunidade") ||
    analise.includes("vantagem") ||
    analise.includes("benefício")
  ) {
    insights.oportunidades.push("Foram identificadas oportunidades na análise");
  }

  if (
    analise.includes("recomendo") ||
    analise.includes("sugiro") ||
    analise.includes("sugestão")
  ) {
    insights.recomendacoes.push("Foram feitas recomendações na análise");
  }

  return insights;
}

// Funções auxiliares para cálculos
function calcularFaturamentoTotal(dadosApuracao: any[]) {
  return dadosApuracao.reduce((total, mes) => {
    return (
      total +
      (mes.faturamento?.comercio || 0) +
      (mes.faturamento?.industria || 0) +
      (mes.faturamento?.servicos || 0)
    );
  }, 0);
}

function calcularImpostosTotais(dadosApuracao: any[]) {
  return dadosApuracao.reduce((total, mes) => {
    return (
      total +
      (mes.impostos?.simples || 0) +
      (mes.impostos?.icms || 0) +
      (mes.impostos?.pis || 0) +
      (mes.impostos?.cofins || 0) +
      (mes.impostos?.ipi || 0) +
      (mes.impostos?.iss || 0)
    );
  }, 0);
}

function calcularComprasTotais(dadosApuracao: any[]) {
  return dadosApuracao.reduce(
    (total, mes) => total + (mes.totalCompras || 0),
    0
  );
}

function calcularImpostosPorTipo(dadosApuracao: any[]) {
  return dadosApuracao.reduce(
    (totais, mes) => {
      return {
        simples: totais.simples + (mes.impostos?.simples || 0),
        icms: totais.icms + (mes.impostos?.icms || 0),
        pis: totais.pis + (mes.impostos?.pis || 0),
        cofins: totais.cofins + (mes.impostos?.cofins || 0),
        ipi: totais.ipi + (mes.impostos?.ipi || 0),
        iss: totais.iss + (mes.impostos?.iss || 0),
      };
    },
    { simples: 0, icms: 0, pis: 0, cofins: 0, ipi: 0, iss: 0 }
  );
}

function calcularCargaTributariaMedia(dadosApuracao: any[]) {
  const totais = dadosApuracao.map((mes) => {
    const faturamentoMes =
      (mes.faturamento?.comercio || 0) +
      (mes.faturamento?.industria || 0) +
      (mes.faturamento?.servicos || 0);
    const impostosMes =
      (mes.impostos?.simples || 0) +
      (mes.impostos?.icms || 0) +
      (mes.impostos?.pis || 0) +
      (mes.impostos?.cofins || 0) +
      (mes.impostos?.ipi || 0) +
      (mes.impostos?.iss || 0);

    return faturamentoMes > 0 ? (impostosMes / faturamentoMes) * 100 : 0;
  });

  return totais.reduce((a, b) => a + b, 0) / totais.length;
}

function calcularMargemBrutaMedia(dadosApuracao: any[]) {
  const totais = dadosApuracao.map((mes) => {
    const faturamentoMes =
      (mes.faturamento?.comercio || 0) +
      (mes.faturamento?.industria || 0) +
      (mes.faturamento?.servicos || 0);
    const comprasMes = mes.totalCompras || 0;

    return faturamentoMes > 0
      ? ((faturamentoMes - comprasMes) / faturamentoMes) * 100
      : 0;
  });

  return totais.reduce((a, b) => a + b, 0) / totais.length;
}

function calcularEficienciaTributaria(dadosApuracao: any[]) {
  // Métrica personalizada - quanto maior, melhor a eficiência
  const cargaMedia = calcularCargaTributariaMedia(dadosApuracao);
  const margemMedia = calcularMargemBrutaMedia(dadosApuracao);

  return margemMedia > 0 ? (margemMedia / cargaMedia) * 100 : 0;
}

function calcularVariacaoMensal(dadosApuracao: any[]) {
  const indicadoresMensais = calcularIndicadoresMensais(dadosApuracao);
  const variacoes = [];

  for (let i = 1; i < indicadoresMensais.length; i++) {
    const mesAtual = indicadoresMensais[i];
    const mesAnterior = indicadoresMensais[i - 1];

    const variacaoFaturamento =
      mesAnterior.financeiro.faturamento > 0
        ? ((mesAtual.financeiro.faturamento -
            mesAnterior.financeiro.faturamento) /
            mesAnterior.financeiro.faturamento) *
          100
        : 0;

    variacoes.push({
      periodo: `${mesAnterior.mes} → ${mesAtual.mes}`,
      faturamento: variacaoFaturamento,
      margem:
        mesAtual.financeiro.margemBruta - mesAnterior.financeiro.margemBruta,
      cargaTributaria:
        mesAtual.tributario.cargaTributaria -
        mesAnterior.tributario.cargaTributaria,
    });
  }

  return variacoes;
}

function analisarSazonalidade(dadosApuracao: any[]) {
  // Análise básica de sazonalidade - em produção, usar algoritmos mais sofisticados
  const indicadoresMensais = calcularIndicadoresMensais(dadosApuracao);

  return {
    melhorMes: indicadoresMensais.reduce((max, mes) =>
      mes.financeiro.faturamento > max.financeiro.faturamento ? mes : max
    ),
    piorMes: indicadoresMensais.reduce((min, mes) =>
      mes.financeiro.faturamento < min.financeiro.faturamento ? mes : min
    ),
    amplitude:
      indicadoresMensais.reduce(
        (max, mes) => Math.max(max, mes.financeiro.faturamento),
        0
      ) -
      indicadoresMensais.reduce(
        (min, mes) => Math.min(min, mes.financeiro.faturamento),
        Infinity
      ),
  };
}
