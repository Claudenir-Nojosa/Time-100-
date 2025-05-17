import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

export default async function EmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    // Cria a URL correta para a API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const apiUrl = `${baseUrl}/api/empresas/${(await params).id}`;
    
    const response = await fetch(apiUrl, {
      // Adiciona cache para melhor performance
      next: { revalidate: 60 } // Revalida a cada 60 segundos
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