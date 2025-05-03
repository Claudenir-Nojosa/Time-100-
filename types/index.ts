import { Empresa, EmpresaObrigacaoAcessoria, EntregaObrigacaoAcessoria } from "@prisma/client";

export type EmpresaComObrigacaos = Empresa & {
  empresaObrigacaoAcessoria: EmpresaObrigacaoAcessoria & {
    entregas: EntregaObrigacaoAcessoria[];
  };
};

export type ObrigacaoSlug = 
  | "efd-icms-ipi" 
  | "destda" 
  | "efd-contribuicoes" 
  | "gia" 
  | "dime" 
  | "gia-rs" 
  | "mit" 
  | "efd-reinf" 
  | "dapi"
    "declan";