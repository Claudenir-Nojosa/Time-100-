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
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Verificar o tema atual
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

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

  // Classes condicionais baseadas no tema
  const cardBg = theme === "dark" ? "bg-gray-900" : "bg-white";
  const cardBorder =
    theme === "dark" ? "border-emerald-900/30" : "border-emerald-200";
  const textPrimary =
    theme === "dark" ? "text-emerald-100" : "text-emerald-800";
  const textSecondary =
    theme === "dark" ? "text-emerald-300/70" : "text-emerald-600";
  const hoverBg =
    theme === "dark" ? "hover:bg-emerald-900/20" : "hover:bg-emerald-100";
  const skeletonBg = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const inputBorder =
    theme === "dark" ? "border-emerald-800" : "border-emerald-200";
  const inputBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const emptyStateBg = theme === "dark" ? "bg-gray-900" : "bg-emerald-50";
  const emptyStateText =
    theme === "dark" ? "text-emerald-300" : "text-emerald-600";

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1
          className={`text-3xl font-bold dark:text-emerald-100 `}
        >
          Gerenciador de Pendências
        </h1>
        <Badge
          variant="outline"
          className={`text-sm ${theme === "dark" ? "border-emerald-800 text-emerald-300" : "border-emerald-200 text-emerald-700"}`}
        >
          {pendencias.filter((p) => !p.concluida).length} pendentes
        </Badge>
      </div>

      {/* Formulário para nova pendência */}
      <Card className={`mb-8 ${cardBorder} shadow-lg ${cardBg}` }>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
            <Plus className="h-5 w-5 text-emerald-500" />
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
              className={`${inputBorder} ${inputBg} focus-visible:ring-2 focus-visible:ring-emerald-500`}
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
              className={`${inputBorder} ${inputBg} focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[100px]`}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={criarPendencia}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md"
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
            <Card key={i} className={`${cardBorder} ${cardBg} shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className={`h-5 w-5 rounded ${skeletonBg}`} />
                  <div className="space-y-2 flex-1">
                    <Skeleton className={`h-4 w-3/4 ${skeletonBg}`} />
                    <Skeleton className={`h-3 w-1/2 ${skeletonBg}`} />
                  </div>
                  <Skeleton className={`h-8 w-8 rounded-full ${skeletonBg}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {pendencias.length === 0 ? (
            <Card className={`${cardBorder} ${emptyStateBg} shadow-sm`}>
              <CardContent className="py-12 text-center">
                <div className="mx-auto max-w-md space-y-4">
                  <Check className="h-12 w-12 mx-auto text-emerald-500 opacity-50" />
                  <h3 className={`text-lg font-medium ${emptyStateText}`}>
                    Nenhuma pendência encontrada
                  </h3>
                  <p className={`text-sm ${textSecondary}`}>
                    Adicione sua primeira pendência usando o formulário acima
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendencias.map((pendencia) => (
              <Card
                key={pendencia.id}
                className={`${cardBorder} shadow-sm transition-all duration-200 ${
                  pendencia.concluida
                    ? theme === "dark"
                      ? "bg-gray-800/30"
                      : "bg-emerald-50/50"
                    : cardBg
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
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : theme === "dark"
                            ? "border-gray-600"
                            : "border-gray-300"
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
                              ? `line-through ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`
                              : textPrimary
                          }`}
                        >
                          {pendencia.titulo}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ml-2 ${hoverBg}`}
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
                            <p className={`text-sm ${textSecondary}`}>
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
                          <p className={`text-xs ${textSecondary}`}>
                            Criado em: {formatDate(pendencia.criadoEm)}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 text-red-500 ${
                        theme === "dark"
                          ? "hover:bg-red-900/20"
                          : "hover:bg-red-50"
                      }`}
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
