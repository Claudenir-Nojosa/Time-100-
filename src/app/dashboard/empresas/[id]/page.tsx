import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

export default async function EmpresaPage({
  params,
}: {
  params: { id: string };
}) {
  const response = await fetch(`http://localhost:3000/api/empresas/${params.id}`);
  
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