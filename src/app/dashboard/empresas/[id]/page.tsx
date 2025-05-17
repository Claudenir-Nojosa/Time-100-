import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

export default async function EmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params; // Resolve a Promise
    
    // Usando URL relativa para evitar problemas de ambiente
    const response = await fetch(`/api/empresas/${id}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return notFound();
    }

    const empresa = await response.json();

    return (
      <div className="p-6">
        <EmpresaDetalhes empresa={empresa} />
      </div>
    );
  } catch (error) {
    console.error("Error loading empresa:", error);
    return notFound();
  }
}