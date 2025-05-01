import { EmpresasTable } from "@/components/shared/empresas-table";
import Link from "next/link";

export default function EmpresasPage() {
  return (
    <div className="p-6 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <Link
          href="/dashboard/empresas/adicionar"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Adicionar Empresa
        </Link>
      </div>
      <EmpresasTable />
    </div>
  );
}