import { EmpresasObrigacaoTable } from "@/components/shared/empresas-obrigacao-table";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import { EmpresaComObrigacaos } from "../../../../../types";

const obrigacoesDisponiveis = {
  "efd-icms-ipi": "EFD ICMS IPI",
  destda: "DeSTDA",
  "efd-contribuicoes": "EFD Contribuições",
  gia: "GIA",
  dime: "DIME",
  "gia-rs": "GIA RS",
  mit: "MIT",
  "efd-reinf": "EFD Reinf",
  "simples-nacional": "Simples Nacional",
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
  params: Promise<{ slug: ObrigacaoSlug }>;
}) {
  // Aguarda a resolução dos params
  const { slug } = await params;
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

  const empresas: EmpresaComObrigacaos[] = obrigacao.empresas.map((eo) => ({
    ...eo.empresa,
    empresaObrigacaoAcessoria: {
      ...eo,
      entregas: eo.entregas,
    },
  }));

  return (
    <div className="space-y-4 mt-20">
      <EmpresasObrigacaoTable
        empresas={empresas}
        obrigacaoNome={obrigacao.nome}
      />
    </div>
  );
}
