// app/dashboard/analises/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, ArrowRight, Building, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Analise {
  id: string;
  mesReferencia: string;
  createdAt: string;
  empresa: {
    razaoSocial: string;
  };
  indicadores: {
    faturamentoTotal?: number;
    cargaTributariaMedia?: number;
  };
}

export default function AnalisesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      carregarAnalises();
    }
  }, [status]);

  const carregarAnalises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analises");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar análises");
      }
      
      const data = await response.json();
      setAnalises(data);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar análises");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor?: number) => {
    if (!valor) return "N/A";
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Análises Tributárias</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e visualize todas as análises realizadas
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/analises/nova")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Análise
        </Button>
      </div>

      {analises.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Nenhuma análise encontrada</h3>
            <p className="text-gray-500 mb-6">
              Comece criando sua primeira análise tributária
            </p>
            <Button onClick={() => router.push("/dashboard/analises/nova")}>
              Criar Primeira Análise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analises.map((analise) => (
            <Card key={analise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{analise.empresa.razaoSocial}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {analise.mesReferencia}
                  </Badge>
                </div>
                <CardDescription>
                  Criada em {formatarData(analise.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Faturamento
                    </span>
                    <span className="font-medium">
                      {formatarValor(analise.indicadores?.faturamentoTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Carga Tributária
                    </span>
                    <span className="font-medium">
                      {analise.indicadores?.cargaTributariaMedia 
                        ? `${analise.indicadores.cargaTributariaMedia.toFixed(2)}%`
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push(`/dashboard/analises/${analise.id}`)}
                >
                  Ver Detalhes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}