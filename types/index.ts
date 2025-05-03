import { Empresa, EmpresaObrigacaoAcessoria, EntregaObrigacaoAcessoria } from "@prisma/client";

export type EmpresaComObrigacaos = Empresa & {
  empresaObrigacaoAcessoria: EmpresaObrigacaoAcessoria & {
    entregas: EntregaObrigacaoAcessoria[];
  };
};