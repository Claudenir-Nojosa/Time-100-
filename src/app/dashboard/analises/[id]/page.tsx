// app/dashboard/analises/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Download, Copy } from "lucide-react";
import { toast } from "sonner";

interface AnaliseDetalhes {
  id: string;
  mesReferencia: string;
  createdAt: string;
  analiseTexto: string;
  dadosApuracao: any;
  empresa: {
    razaoSocial: string;
    cnpj: string;
  };
}

export default function AnaliseDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [analise, setAnalise] = useState<AnaliseDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      carregarAnalise(params.id as string);
    }
  }, [params.id]);

  const carregarAnalise = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analises/${id}`);

      if (!response.ok) {
        throw new Error("Análise não encontrada");
      }

      const data = await response.json();
      setAnalise(data);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar análise");
    } finally {
      setLoading(false);
    }
  };

  const copiarParaAreaTransferencia = () => {
    if (analise?.analiseTexto) {
      navigator.clipboard.writeText(analise.analiseTexto);
      toast.success("Análise copiada para a área de transferência!");
    }
  };

  const exportarComoTxt = () => {
    if (analise?.analiseTexto) {
      const blob = new Blob([analise.analiseTexto], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analise-${analise.empresa.razaoSocial}-${analise.mesReferencia}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!analise) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Análise não encontrada</h3>
            <p className="text-gray-500 mb-6">
              A análise solicitada não foi encontrada
            </p>
            <Button onClick={() => router.push("/dashboard/analises")}>
              Voltar para Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/analises")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copiarParaAreaTransferencia}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
          <Button variant="outline" onClick={exportarComoTxt}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            {analise.empresa.razaoSocial}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            CNPJ: {analise.empresa.cnpj}
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span>Mês de referência: {analise.mesReferencia}</span>
            <span>
              Criada em:{" "}
              {new Date(analise.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none dark:prose-invert prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-headings:text-foreground">
            <div
              className="analise-content text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: analise.analiseTexto
                  .replace(/\n/g, "<br />")
                  .replace(
                    /\*\*(.*?)\*\*/g,
                    "<strong class='font-semibold'>$1</strong>"
                  )
                  .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>"),
              }}
            />
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .analise-content {
          color: hsl(var(--foreground));
          line-height: 1.6;
        }

        .analise-content strong {
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .analise-content em {
          color: hsl(var(--foreground));
          font-style: italic;
        }

        .analise-content br {
          content: "";
          display: block;
          margin-bottom: 0.75em;
        }

        /* Estilos específicos para modo escuro */
        .dark .analise-content {
          color: hsl(var(--foreground));
        }

        /* Garantir contraste adequado */
        @media (prefers-color-scheme: dark) {
          .analise-content {
            color: hsl(var(--foreground));
          }
        }
      `}</style>
    </div>
  );
}
