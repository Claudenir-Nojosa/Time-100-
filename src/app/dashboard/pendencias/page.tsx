// app/dashboard/pendencias/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Usuario = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type Pendencia = {
  id: string;
  titulo: string;
  descricao: string | null;
  concluida: boolean;
  criadoEm: string;
  usuario: Usuario;
  usuarioId: string;
};

export default function PendenciasPage() {
  const { data: session } = useSession();
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [novaPendencia, setNovaPendencia] = useState({
    titulo: "",
    descricao: "",
  });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      carregarPendencias();
    }
  }, [session]);

  const carregarPendencias = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pendencias");
      const data = await response.json();
      setPendencias(data);
    } catch (error) {
      console.error("Erro ao carregar pendências:", error);
    } finally {
      setLoading(false);
    }
  };

  const criarPendencia = async () => {
    if (!novaPendencia.titulo.trim()) {
      toast.warning("Por favor, insira um título para a pendência");
      return;
    }

    try {
      const response = await fetch("/api/pendencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: novaPendencia.titulo,
          descricao: novaPendencia.descricao,
        }),
      });

      if (response.ok) {
        toast.success("Pendência criada com sucesso!");
        setNovaPendencia({ titulo: "", descricao: "" });
        await carregarPendencias();
      }
    } catch (error) {
      toast.error("Erro ao criar pendência");
      console.error("Erro ao criar pendência:", error);
    }
  };

  const atualizarPendencia = async (id: string, concluida: boolean) => {
    try {
      await fetch(`/api/pendencias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ concluida }),
      });

      toast.success(
        concluida
          ? "Pendência marcada como concluída!"
          : "Pendência marcada como pendente"
      );
      await carregarPendencias();
    } catch (error) {
      toast.error("Erro ao atualizar pendência");
      console.error("Erro ao atualizar pendência:", error);
    }
  };

  const deletarPendencia = async (id: string) => {
    try {
      await fetch(`/api/pendencias/${id}`, {
        method: "DELETE",
      });

      toast.success("Pendência removida com sucesso!");
      await carregarPendencias();
    } catch (error) {
      toast.error("Erro ao deletar pendência");
      console.error("Erro ao deletar pendência:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Gerenciador de Pendências
        </h1>
        <Badge variant="outline" className="text-sm">
          {pendencias.filter((p) => !p.concluida).length} pendentes
        </Badge>
      </div>

      {/* Formulário para nova pendência */}
      <Card className="mb-8 border-none shadow-lg bg-gradient-to-br from-card to-gray-50 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Nova Pendência</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Título da pendência"
              value={novaPendencia.titulo}
              onChange={(e) =>
                setNovaPendencia({ ...novaPendencia, titulo: e.target.value })
              }
              className="border border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Textarea
              placeholder="Descrição (opcional)"
              value={novaPendencia.descricao}
              onChange={(e) =>
                setNovaPendencia({
                  ...novaPendencia,
                  descricao: e.target.value,
                })
              }
              className="border border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-primary min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={criarPendencia}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardFooter>
      </Card>

      {/* Lista de pendências */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {pendencias.length === 0 ? (
            <Card className="border-none shadow-sm bg-gradient-to-br from-card to-gray-50 dark:to-gray-900">
              <CardContent className="py-12 text-center">
                <div className="mx-auto max-w-md space-y-4">
                  <Check className="h-12 w-12 mx-auto text-primary opacity-50" />
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                    Nenhuma pendência encontrada
                  </h3>
                  <p className="text-sm text-gray-400">
                    Adicione sua primeira pendência usando o formulário acima
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendencias.map((pendencia) => (
              <Card
                key={pendencia.id}
                className={`border-none shadow-sm transition-all duration-200 ${
                  pendencia.concluida
                    ? "bg-gray-50/50 dark:bg-gray-800/30"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-start p-4">
                    <Checkbox
                      checked={pendencia.concluida}
                      onCheckedChange={(checked) =>
                        atualizarPendencia(pendencia.id, !!checked)
                      }
                      className={`mt-1 h-5 w-5 rounded-full border-2 ${
                        pendencia.concluida
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />

                    <div
                      className="flex-1 ml-3 cursor-pointer"
                      onClick={() => toggleExpand(pendencia.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3
                          className={`font-medium ${
                            pendencia.concluida
                              ? "line-through text-gray-500 dark:text-gray-400"
                              : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {pendencia.titulo}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(pendencia.id);
                          }}
                        >
                          {expandedId === pendencia.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {expandedId === pendencia.id && (
                        <div className="mt-2 space-y-2">
                          {pendencia.descricao && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {pendencia.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>Criado por:</span>
                            {pendencia.usuario.image && (
                              <img
                                src={pendencia.usuario.image}
                                alt="User"
                                className="h-4 w-4 rounded-full"
                              />
                            )}
                            <span>
                              {pendencia.usuario.name ||
                                pendencia.usuario.email}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Criado em: {formatDate(pendencia.criadoEm)}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => deletarPendencia(pendencia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
