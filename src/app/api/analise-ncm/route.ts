// app/api/analise-ncm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ncmDatabase } from "@/lib/ncm-database";

export async function POST(request: NextRequest) {
  try {
    const { dados } = await request.json();

    const resultados = await Promise.all(
      dados.map(async (item: { ncm: string; descricao: string }) => {
        return await analisarItem(item.ncm, item.descricao);
      })
    );

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Erro na análise de NCM:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function analisarItem(ncmUsuario: string, descricaoUsuario: string) {
  const ncmLimpo = ncmUsuario.replace(/\D/g, "").padStart(8, "0");
  const ncmOficial = ncmDatabase.buscarPorCodigo(ncmLimpo);

  // Caso 1: NCM não existe
  if (!ncmOficial) {
    const sugestoes = ncmDatabase.buscarPorSimilaridade(descricaoUsuario, 3);
    return {
      ncm: ncmUsuario,
      descricao: descricaoUsuario,
      status: "ncm_inexistente",
      ncmSugerido: sugestoes[0]?.codigo,
      descricaoSugerida: sugestoes[0]?.descricao,
      confianca: 0.3,
      motivo: `NCM ${ncmUsuario} não existe na base oficial`,
    };
  }

  // Caso 2: Verificar correspondência
  const correspondencia = await verificarCorrespondencia(
    ncmOficial,
    descricaoUsuario
  );

  if (correspondencia.corresponde) {
    return {
      ncm: ncmUsuario,
      descricao: descricaoUsuario,
      status: "correto",
      confianca: correspondencia.confianca,
      motivo: "NCM corresponde à descrição do produto",
    };
  }

  // Caso 3: NCM existe mas não corresponde
  const sugestoes = ncmDatabase.buscarPorSimilaridade(descricaoUsuario, 3);
  const melhorSugestao = sugestoes[0];

  return {
    ncm: ncmUsuario,
    descricao: descricaoUsuario,
    status: "incorreto",
    ncmSugerido: melhorSugestao?.codigo,
    descricaoSugerida: melhorSugestao?.descricao,
    confianca: correspondencia.confianca,
    motivo: `NCM ${ncmUsuario} (${ncmOficial.descricao}) não corresponde à descrição. Sugerimos: ${melhorSugestao?.descricao}`,
  };
}

async function verificarCorrespondencia(
  ncmOficial: any,
  descricaoUsuario: string
) {
  const descricaoLower = descricaoUsuario.toLowerCase();
  const descOficialLower = ncmOficial.descricao.toLowerCase();

  // 1. Verificação exata
  if (descricaoLower === descOficialLower) {
    return { corresponde: true, confianca: 1.0 };
  }

  // 2. Verificação por palavras-chave
  const palavrasUsuario = descricaoLower
    .split(/\s+/)
    .filter((p) => p.length > 2);
  const palavrasNCM = descOficialLower.split(/\s+/).filter((p: any) => p.length > 2);

  const palavrasCorrespondentes = palavrasUsuario.filter((palavra) =>
    palavrasNCM.some(
      (palavraNCM: any) =>
        palavraNCM.includes(palavra) || palavra.includes(palavraNCM)
    )
  );

  const confianca =
    palavrasCorrespondentes.length / Math.max(palavrasUsuario.length, 1);

  return {
    corresponde: confianca > 0.6,
    confianca,
  };
}
