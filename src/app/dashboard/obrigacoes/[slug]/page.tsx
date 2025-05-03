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
} as const;

type ObrigacaoSlug = keyof typeof obrigacoesDisponiveis;

// Define the complete type that matches EmpresaComObrigacao
interface EmpresaComObrigacao {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string | null;
  email?: string | null;
  cidade?: string | null;
  uf: string;
  regimeTributacao: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  responsavel: string;
  observacoes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  usuarioId: string;
  empresaObrigacaoAcessoria: {
    id: string;
    empresaId: string;
    obrigacaoAcessoriaId: string;
    diaVencimento: number;
    anteciparDiaNaoUtil: boolean;
    observacoes?: string | null;
    entregas: Array<{
      id: string;
      mes: number;
      ano: number;
      entregue: boolean;
      dataEntrega?: Date | null;
      observacoes?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
}

interface PageProps {
  params: { slug: ObrigacaoSlug };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateStaticParams() {
  return Object.keys(obrigacoesDisponiveis).map((slug) => ({
    slug,
  }));
}
export default async function ObrigacaoPage({ params }: PageProps) {
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