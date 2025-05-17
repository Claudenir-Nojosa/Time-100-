import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

export default async function EmpresaPage({
  params,
}: {
  params: { id: string }; // Remova o Promise aqui também
}) {
  try {
    // URL da API - versão simplificada e confiável
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://time-100.vercel.app'
      : 'http://localhost:3000';
    
    const apiUrl = `${baseUrl}/api/empresas/${params.id}`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store' // Desativa cache para desenvolvimento
    });

    if (!response.ok) {
      console.error('Erro na API:', await response.text());
      return notFound();
    }

    const empresa = await response.json();

    return (
      <div className="p-6">
        <EmpresaDetalhes empresa={empresa} />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar empresa:", error);
    return notFound();
  }
}