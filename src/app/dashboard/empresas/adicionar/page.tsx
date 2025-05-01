// app/dashboard/empresas/adicionar/page.tsx
import { AdicionarEmpresaForm } from "@/components/shared/formularioAdicionarEmpresa";

export default function AdicionarEmpresaPage() {
  return (
    <div className="p-6 mt-10">
      <h1 className="text-2xl font-bold mb-6">Adicionar Nova Empresa</h1>
      <AdicionarEmpresaForm />
    </div>
  );
}