import { EmpresasObrigacaoTable } from "@/components/shared/empresas-obrigacao-table";
import db from "@/lib/db";
import { notFound } from "next/navigation";


interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string | null;
  email: string | null;
  cidade: string | null;
  uf: string;
  regimeTributacao: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  responsavel: string;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  usuarioId: string;
}

interface EntregaObrigacaoAcessoria {
  id: string;
  empresaObrigacaoId: string;
  mes: number;
  ano: number;
  entregue: boolean;
  dataEntrega: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmpresaObrigacaoComRelacionamentos {
  id: string;
  empresaId: string;
  obrigacaoAcessoriaId: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
  observacoes: string | null;
  empresa: Empresa;
  entregas: EntregaObrigacaoAcessoria[];
}


const obrigacoesDisponiveis = {
  "efd-icms-ipi": "EFD ICMS IPI",
  destda: "DeSTDA",
  "efd-contribuicoes": "EFD Contribuições",
  gia: "GIA",
  dime: "DIME",
  "gia-rs": "GIA RS",
  mit: "MIT",
  "efd-reinf": "EFD Reinf",
  declan: "DECLAN",
  dapi: "DAPI",
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
  const empresas = obrigacao.empresas.map(
    (eo: EmpresaObrigacaoComRelacionamentos) => ({
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
    })
  );

  return (
    <div className="space-y-4 mt-20">
      <EmpresasObrigacaoTable
        empresas={empresas}
        obrigacaoNome={obrigacao.nome}
      />
    </div>
  );
}
