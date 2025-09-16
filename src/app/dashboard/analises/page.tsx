// app/dashboard/analises/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  ArrowRight,
  Building,
  Calendar,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Analise {
  id: string;
  mesReferencia: string;
  createdAt: string;
  empresa: {
    razaoSocial: string;
  };
  indicadores: {
    consolidado?: {
      financeiros?: {
        faturamentoTotal?: number;
      };
      tributarios?: {
        cargaTributaria?: number;
      };
    };
    // Para compatibilidade com versões antigas
    faturamentoTotal?: number;
    cargaTributariaMedia?: number;
  };
}

export default function AnalisesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      console.log("Dados recebidos da API:", data); // Para debug
      setAnalises(data);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar análises");
    } finally {
      setLoading(false);
    }
  };

  const deletarAnalise = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/analises/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar análise");
      }

      // Remover a análise da lista local
      setAnalises(analises.filter((analise) => analise.id !== id));
      toast.success("Análise deletada com sucesso");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao deletar análise");
    } finally {
      setDeletingId(null);
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString("pt-BR");
  };

  const formatarValor = (valor?: number) => {
    if (valor === undefined || valor === null) return "N/A";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para obter o faturamento da nova estrutura
  const obterFaturamento = (indicadores: any) => {
    // Primeiro tenta a nova estrutura
    if (indicadores?.consolidado?.financeiros?.faturamentoTotal !== undefined) {
      return indicadores.consolidado.financeiros.faturamentoTotal;
    }
    // Depois tenta a estrutura antiga
    return indicadores?.faturamentoTotal || undefined;
  };

  // Função para obter a carga tributária da nova estrutura
  const obterCargaTributaria = (indicadores: any) => {
    // Primeiro tenta a nova estrutura
    if (indicadores?.consolidado?.tributarios?.cargaTributaria !== undefined) {
      return indicadores.consolidado.tributarios.cargaTributaria;
    }
    // Depois tenta a estrutura antiga
    return indicadores?.cargaTributariaMedia || undefined;
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
            <h3 className="text-lg font-medium mb-2">
              Nenhuma análise encontrada
            </h3>
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
            <Card
              key={analise.id}
              className="hover:shadow-lg transition-shadow group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">
                    {analise.empresa.razaoSocial}
                  </CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {analise.mesReferencia}
                  </Badge>
                </div>
                <CardDescription>
                  Criada em {formatarData(analise.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Faturamento
                    </span>
                    <span className="font-medium">
                      {formatarValor(obterFaturamento(analise.indicadores))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Carga Tributária
                    </span>
                    <span className="font-medium">
                      {obterCargaTributaria(analise.indicadores)
                        ? `${obterCargaTributaria(analise.indicadores)?.toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/analises/${analise.id}`)
                      }
                      className="flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/analises/${analise.id}/dashboard`
                        )
                      }
                      className="flex items-center"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === analise.id}
                        className="flex items-center"
                      >
                        {deletingId === analise.id ? (
                          "Deletando..."
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Deletar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar esta análise? Esta ação
                          não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletarAnalise(analise.id)}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
