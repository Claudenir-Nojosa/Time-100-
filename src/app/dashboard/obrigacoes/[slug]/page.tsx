import { EmpresasObrigacaoTable } from "@/components/shared/empresas-obrigacao-table";
import db from "@/lib/db";
import { notFound } from "next/navigation";

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
};

export async function generateStaticParams() {
  return Object.keys(obrigacoesDisponiveis).map((slug) => ({
    slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ObrigacaoPage({
  params,
  searchParams,
}: PageProps) {
  // Resolve ambas as Promises em paralelo
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { slug } = resolvedParams;

  const obrigacaoNome = Object.entries(obrigacoesDisponiveis).find(
    ([key]) => key === slug
  )?.[1];

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

  // Transforma os dados para o formato esperado pelo componente
  const empresas = obrigacao.empresas.map((eo) => ({
    ...eo.empresa,
    empresaObrigacaoAcessoria: {
      id: eo.id,
      empresaId: eo.empresaId,
      obrigacaoAcessoriaId: eo.obrigacaoAcessoriaId,
      diaVencimento: eo.diaVencimento,
      anteciparDiaNaoUtil: eo.anteciparDiaNaoUtil,
      observacoes: eo.observacoes,
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
