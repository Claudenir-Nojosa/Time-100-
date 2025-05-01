"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusEntregaObrigacao } from "@/components/shared/StatusEntrega";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getObrigacoesAcessorias,
  ObrigacaoAcessoria,
} from "@/lib/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTodasObrigacoes } from "@/components/shared/DashboardTodasObrigacoes";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoAcessoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObrigacao, setSelectedObrigacao] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadObrigacoes();
    }
  }, [status, router]);

  const loadObrigacoes = async () => {
    try {
      setLoading(true);
      const obrigacoesList = await getObrigacoesAcessorias();
      setObrigacoes(obrigacoesList);

      if (obrigacoesList.length > 0) {
        setSelectedObrigacao(obrigacoesList[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar obrigações:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <div>Não autenticado</div>;
  }

  return (
    <div className="space-y-6 mt-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seletor de Obrigação */}
        <div>
          <Label htmlFor="obrigacao">Obrigação Acessória</Label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedObrigacao}
              onValueChange={setSelectedObrigacao}
            >
              <SelectTrigger id="obrigacao">
                <SelectValue placeholder="Selecione uma obrigação" />
              </SelectTrigger>
              <SelectContent className="dark:bg-black bg-white">
                <SelectItem value="TODOS">TODAS AS OBRIGAÇÕES</SelectItem>
                {obrigacoes.map((obrigacao) => (
                  <SelectItem key={obrigacao.id} value={obrigacao.id}>
                    {obrigacao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Seletor de Mês */}
        <div>
          <Label htmlFor="month">Mês</Label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent className="dark:bg-black bg-white">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2000, month - 1, 1).toLocaleString("pt-BR", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Ano */}
        <div>
          <Label htmlFor="year">Ano</Label>
          <Input
            id="year"
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            min={2000}
            max={2100}
          />
        </div>
      </div>

      {/* Conteúdo do Dashboard */}
      {/* Conteúdo do Dashboard */}
      {selectedObrigacao === "TODOS" ? (
        <DashboardTodasObrigacoes mes={selectedMonth} ano={selectedYear} />
      ) : selectedObrigacao ? (
        <StatusEntregaObrigacao
          obrigacaoId={selectedObrigacao}
          mes={selectedMonth}
          ano={selectedYear}
        />
      ) : (
        <div className="flex justify-center items-center h-64">
          {loading ? "Carregando..." : "Nenhuma obrigação disponível"}
        </div>
      )}
    </div>
  );
}
