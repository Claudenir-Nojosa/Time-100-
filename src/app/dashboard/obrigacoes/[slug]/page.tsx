import { EmpresasObrigacaoTable } from "@/components/shared/empresas-obrigacao-table";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import { EmpresaComObrigacaos } from "../../../../../types";
import { EmpresaObrigacaoAcessoria } from "@prisma/client";

const obrigacoesDisponiveis = {
  "efd-icms-ipi": "EFD ICMS IPI",
  destda: "DeSTDA",
  "efd-contribuicoes": "EFD Contribuições",
  gia: "GIA",
  dime: "DIME",
  "gia-rs": "GIA RS",
  mit: "MIT",
  "efd-reinf": "EFD Reinf",
  dapi: "DAPI",
  declan: "DECLAN",
} as const;

type ObrigacaoSlug = keyof typeof obrigacoesDisponiveis;

export async function generateStaticParams() {
  return Object.keys(obrigacoesDisponiveis).map((slug) => ({
    slug: slug as ObrigacaoSlug,
  }));
}

export default async function ObrigacaoPage({
  params,
}: {
  params: { slug: ObrigacaoSlug };
}) {
  const { slug } = params;
  const obrigacaoNome = obrigacoesDisponiveis[slug];

  if (!obrigacaoNome) return notFound();

  const obrigacao = await db.obrigacaoAcessoria.findUnique({
    where: { nome: obrigacaoNome },
    include: {
      empresas: {
        include: {
          empresa: true,
          entregas: true,
        },
      },
    },
  });

  if (!obrigacao) return notFound();

  const empresas: EmpresaComObrigacaos[] = obrigacao.empresas.map((eo) => {
    const empresaObrigacao = {
      id: eo.id,
      empresaId: eo.empresaId,
      obrigacaoAcessoriaId: eo.obrigacaoAcessoriaId,
      diaVencimento: eo.diaVencimento,
      anteciparDiaNaoUtil: eo.anteciparDiaNaoUtil,
      observacoes: eo.observacoes || null,
      entregas: eo.entregas.map(entrega => ({
        id: entrega.id,
        mes: entrega.mes,
        ano: entrega.ano,
        entregue: entrega.entregue,
        dataEntrega: entrega.dataEntrega || null,
        observacoes: entrega.observacoes || null,
        createdAt: entrega.createdAt,
        updatedAt: entrega.updatedAt,
      })),
    };

    return {
      id: eo.empresa.id,
      razaoSocial: eo.empresa.razaoSocial,
      cnpj: eo.empresa.cnpj,
      inscricaoEstadual: eo.empresa.inscricaoEstadual || null,
      email: eo.empresa.email || null,
      cidade: eo.empresa.cidade || null,
      uf: eo.empresa.uf,
      regimeTributacao: eo.empresa.regimeTributacao,
      responsavel: eo.empresa.responsavel,
      observacoes: eo.empresa.observacoes || null,
      createdAt: eo.empresa.createdAt,
      updatedAt: eo.empresa.updatedAt,
      usuarioId: eo.empresa.usuarioId,
      empresaObrigacaoAcessoria: empresaObrigacao,
    };
  });

  return (
    <div className="space-y-4 mt-20">
      <EmpresasObrigacaoTable
        empresas={empresas}
        obrigacaoNome={obrigacao.nome}
      />
    </div>
  );
}