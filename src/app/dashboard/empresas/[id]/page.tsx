import { notFound } from "next/navigation";
import { EmpresaDetalhes } from "@/components/shared/empresa-detalhes";

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

export default async function EmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/empresas/${id}`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${await response.text()}`);
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