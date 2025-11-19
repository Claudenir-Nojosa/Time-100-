"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Calendar,
  Clock,
  TrendingUp,
  Target,
  Users,
  Activity,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Atividade {
  id: string;
  nome: string;
  categoria: "apuracao" | "reuniao" | "diagnostico" | "outros";
  tempoReal: number | null;
  tempoEstimado: number | null;
  data: string;
  concluida: boolean;
  responsavel: string;
  emAndamento?: boolean;
  historicoTempo?: any;
}

interface Estatisticas {
  totalTempoGasto: number;
  totalTempoEstimado: number;
  atividadesConcluidas: number;
  atividadesTotais: number;
  eficiencia: number;
  tempoMedioPorAtividade: number;
}

interface DadosCategoria {
  categoria: string;
  tempoGasto: number;
  tempoEstimado: number;
  quantidade: number;
  cor: string;
}

interface DadosSemanais {
  semana: string;
  tempoGasto: number;
  tempoEstimado: number;
  atividades: number;
}

const COLORS = {
  apuracao: "#3b82f6",
  reuniao: "#06b6d4",
  diagnostico: "#f97316",
  outros: "#6b7280",
};

const COLORS_ARRAY = ["#3b82f6", "#06b6d4", "#f97316", "#6b7280"];

export default function RelatoriosPage() {
  const session = useSession();
  const router = useRouter();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<"7" | "30" | "90" | "365">("30");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/login");
    }
  }, [session.status, router]);

  useEffect(() => {
    if (session.status === "authenticated") {
      buscarAtividades();
    }
  }, [session.status, periodo]);

  const buscarAtividades = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/atividades");

      if (!response.ok) {
        throw new Error("Erro ao buscar atividades");
      }

      const data = await response.json();

      // DEBUG: Verificar os dados recebidos
      console.log("Dados recebidos para relatórios:", data);

      // Garantir que temos um array
      const atividadesArray = Array.isArray(data) ? data : [];

      setAtividades(
        atividadesArray.map((a: any) => ({
          ...a,
          data: a.data,
          tempoReal: a.tempoReal || 0,
          tempoEstimado: a.tempoEstimado || 0,
          // Garantir que os valores numéricos sejam tratados corretamente
          concluida: Boolean(a.concluida),
          emAndamento: Boolean(a.emAndamento),
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
      toast.error("Erro ao carregar dados para relatórios");
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar atividades pelo período
  const atividadesFiltradas = atividades.filter((atividade) => {
    const dataAtividade = new Date(atividade.data);
    const dataLimite = new Date();

    switch (periodo) {
      case "7":
        dataLimite.setDate(dataLimite.getDate() - 7);
        break;
      case "30":
        dataLimite.setDate(dataLimite.getDate() - 30);
        break;
      case "90":
        dataLimite.setDate(dataLimite.getDate() - 90);
        break;
      case "365":
        dataLimite.setDate(dataLimite.getDate() - 365);
        break;
    }

    const filtroCategoriaAplicado =
      filtroCategoria === "todas" || atividade.categoria === filtroCategoria;

    return dataAtividade >= dataLimite && filtroCategoriaAplicado;
  });

  // Calcular estatísticas com tratamento para valores nulos
  const estatisticas: Estatisticas = {
    totalTempoGasto: atividadesFiltradas.reduce(
      (acc, curr) => acc + (curr.tempoReal || 0),
      0
    ),
    totalTempoEstimado: atividadesFiltradas.reduce(
      (acc, curr) => acc + (curr.tempoEstimado || 0),
      0
    ),
    atividadesConcluidas: atividadesFiltradas.filter((a) => a.concluida).length,
    atividadesTotais: atividadesFiltradas.length,
    eficiencia:
      (atividadesFiltradas.reduce(
        (acc, curr) => acc + (curr.tempoReal || 0),
        0
      ) /
        Math.max(
          atividadesFiltradas.reduce(
            (acc, curr) => acc + (curr.tempoEstimado || 0),
            0
          ),
          1
        )) *
      100,
    tempoMedioPorAtividade:
      atividadesFiltradas.length > 0
        ? atividadesFiltradas.reduce(
            (acc, curr) => acc + (curr.tempoReal || 0),
            0
          ) / atividadesFiltradas.length
        : 0,
  };

  // Dados por categoria com tratamento para valores nulos
  const dadosPorCategoria: DadosCategoria[] = [
    {
      categoria: "Apuração",
      tempoGasto: atividadesFiltradas
        .filter((a) => a.categoria === "apuracao")
        .reduce((acc, curr) => acc + (curr.tempoReal || 0), 0),
      tempoEstimado: atividadesFiltradas
        .filter((a) => a.categoria === "apuracao")
        .reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0),
      quantidade: atividadesFiltradas.filter((a) => a.categoria === "apuracao")
        .length,
      cor: COLORS.apuracao,
    },
    {
      categoria: "Reunião",
      tempoGasto: atividadesFiltradas
        .filter((a) => a.categoria === "reuniao")
        .reduce((acc, curr) => acc + (curr.tempoReal || 0), 0),
      tempoEstimado: atividadesFiltradas
        .filter((a) => a.categoria === "reuniao")
        .reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0),
      quantidade: atividadesFiltradas.filter((a) => a.categoria === "reuniao")
        .length,
      cor: COLORS.reuniao,
    },
    {
      categoria: "Diagnóstico",
      tempoGasto: atividadesFiltradas
        .filter((a) => a.categoria === "diagnostico")
        .reduce((acc, curr) => acc + (curr.tempoReal || 0), 0),
      tempoEstimado: atividadesFiltradas
        .filter((a) => a.categoria === "diagnostico")
        .reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0),
      quantidade: atividadesFiltradas.filter(
        (a) => a.categoria === "diagnostico"
      ).length,
      cor: COLORS.diagnostico,
    },
    {
      categoria: "Outros",
      tempoGasto: atividadesFiltradas
        .filter((a) => a.categoria === "outros")
        .reduce((acc, curr) => acc + (curr.tempoReal || 0), 0),
      tempoEstimado: atividadesFiltradas
        .filter((a) => a.categoria === "outros")
        .reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0),
      quantidade: atividadesFiltradas.filter((a) => a.categoria === "outros")
        .length,
      cor: COLORS.outros,
    },
  ];

  // Dados semanais
  const gerarDadosSemanais = (): DadosSemanais[] => {
    const dados: DadosSemanais[] = [];
    const semanas = Math.max(1, Math.floor(parseInt(periodo) / 7));

    for (let i = semanas - 1; i >= 0; i--) {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - (i + 1) * 7);
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() - i * 7);

      const atividadesSemana = atividadesFiltradas.filter((a) => {
        const dataAtividade = new Date(a.data);
        return dataAtividade >= dataInicio && dataAtividade <= dataFim;
      });

      dados.push({
        semana: `Sem ${semanas - i}`,
        tempoGasto: atividadesSemana.reduce(
          (acc, curr) => acc + (curr.tempoReal || 0),
          0
        ),
        tempoEstimado: atividadesSemana.reduce(
          (acc, curr) => acc + (curr.tempoEstimado || 0),
          0
        ),
        atividades: atividadesSemana.length,
      });
    }

    return dados;
  };

  const dadosSemanais = gerarDadosSemanais();

  // Top atividades mais demoradas
  const topAtividadesDemoradas = [...atividadesFiltradas]
    .sort((a, b) => (b.tempoReal || 0) - (a.tempoReal || 0))
    .slice(0, 5);

  // Função para formatar tempo
  const formatarTempo = (minutos: number) => {
    if (minutos === 0) return "0min";
    if (minutos < 60) {
      return `${minutos}min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  };

  // Função para exportar dados
  const exportarDados = () => {
    const dadosExportacao = {
      periodo: `${periodo} dias`,
      estatisticas,
      atividades: atividadesFiltradas,
      exportadoEm: new Date().toISOString(),
      resumo: {
        totalAtividades: atividadesFiltradas.length,
        periodoSelecionado: periodo,
        categoriaFiltro: filtroCategoria,
      },
    };

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-tempo-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Dados exportados com sucesso!");
  };

  // Componente de Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatarTempo(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (session.status === "loading" || carregando) {
    return (
      <div className="container mx-auto py-8 px-4 mt-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando relatórios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios de Tempo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análise visual do tempo gasto em atividades
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {atividadesFiltradas.length} atividades no período selecionado
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Select
            value={periodo}
            onValueChange={(value: "7" | "30" | "90" | "365") =>
              setPeriodo(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="apuracao">Apuração</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="diagnostico">Diagnóstico</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportarDados} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Button onClick={buscarAtividades} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Total Gasto
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarTempo(estatisticas.totalTempoGasto)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatarTempo(estatisticas.totalTempoEstimado)} estimado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.eficiencia.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {estatisticas.eficiencia > 100
                ? "Acima do estimado"
                : "Dentro do estimado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.atividadesConcluidas}/
              {estatisticas.atividadesTotais}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {estatisticas.atividadesConcluidas ===
              estatisticas.atividadesTotais
                ? "Todas concluídas!"
                : "Em andamento"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarTempo(estatisticas.tempoMedioPorAtividade)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Por atividade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Barras - Tempo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="tempoGasto" name="Tempo Gasto" fill="#3b82f6" />
                <Bar
                  dataKey="tempoEstimado"
                  name="Tempo Estimado"
                  fill="#6b7280"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorCategoria.filter((d) => d.tempoGasto > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }) =>
                    `${categoria} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="tempoGasto"
                >
                  {dadosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarTempo(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Evolução Semanal */}
      {dadosSemanais.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Evolução Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosSemanais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tempoGasto"
                  name="Tempo Gasto"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="tempoEstimado"
                  name="Tempo Estimado"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Atividades Mais Demoradas */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 - Atividades Mais Demoradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topAtividadesDemoradas.map((atividade, index) => (
              <div
                key={atividade.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{atividade.nome}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {atividade.categoria} •{" "}
                      {new Date(atividade.data).toLocaleDateString("pt-BR")}
                      {atividade.concluida && " • ✅ Concluída"}
                      {atividade.emAndamento && " • 🔴 Em andamento"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatarTempo(atividade.tempoReal || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatarTempo(atividade.tempoEstimado || 0)} estimado
                  </div>
                </div>
              </div>
            ))}
            {topAtividadesDemoradas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma atividade encontrada no período selecionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
