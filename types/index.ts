import { Empresa, EmpresaObrigacaoAcessoria, EntregaObrigacaoAcessoria } from "@prisma/client";

export type EmpresaComObrigacaos = {
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
  empresaObrigacaoAcessoria: {
    id: string;
    empresaId: string;
    obrigacaoAcessoriaId: string;
    diaVencimento: number;
    anteciparDiaNaoUtil: boolean;
    observacoes: string | null;
    entregas: Array<{
      id: string;
      mes: number;
      ano: number;
      entregue: boolean;
      dataEntrega: Date | null;
      observacoes: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
};