import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

export default async function EmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Resolve a Promise dos parâmetros
  const resolvedParams = await params;

  const response = await fetch(`/api/empresas/${resolvedParams.id}`);

  if (!response.ok) {
    return notFound();
  }

  const empresa = await response.json();

  return (
    <div className="p-6">
      <EmpresaDetalhes empresa={empresa} />
    </div>
  );
}
