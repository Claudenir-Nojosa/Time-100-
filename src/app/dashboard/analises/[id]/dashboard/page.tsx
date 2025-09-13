"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Image } from "lucide-react";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Analise {
  id: string;
  empresaId: string;
  usuarioId: string;
  mesReferencia: string;
  dadosApuracao: any;
  analiseTexto: string;
  indicadores: any;
  createdAt: string;
  empresa: {
    razaoSocial: string;
    cnpj: string;
  };
}

export default function AnaliseDashboard() {
  const params = useParams();
  const router = useRouter();
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Refs para os gráficos
  // Corrija as definições das refs para serem mais específicas
  const evolucaoRef = useRef<HTMLDivElement>(null);
  const distribuicaoRef = useRef<HTMLDivElement>(null);
  const comparativoRef = useRef<HTMLDivElement>(null);
  const margemRef = useRef<HTMLDivElement>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const downloadChartAsImage = async (
    chartRef: React.RefObject<HTMLDivElement>,
    chartName: string
  ) => {
    const chartElement = getChartElement(chartRef);
    if (!chartElement) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }

    try {
      setDownloading(chartName);

      const dataUrl = await htmlToImage.toPng(chartElement, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `grafico-${chartName.toLowerCase().replace(/\s+/g, "-")}-${analise?.empresa.razaoSocial}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(`Gráfico ${chartName} baixado com sucesso!`);
    } catch (error) {
      console.error("Erro ao baixar gráfico:", error);
      toast.error("Erro ao baixar gráfico");
    } finally {
      setDownloading(null);
    }
  };

  const copyChartAsImage = async (
    chartRef: React.RefObject<HTMLDivElement>,
    chartName: string
  ) => {
    if (!chartRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }

    try {
      setDownloading(`copy-${chartName}`);

      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      // Copiar para área de transferência
      const blob = await fetch(dataUrl).then((r) => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      toast.success(
        `Gráfico ${chartName} copiado para a área de transferência!`
      );
    } catch (error) {
      console.error("Erro ao copiar gráfico:", error);

      // Fallback para navegadores que não suportam Clipboard API
      if (error instanceof Error && error.name === "DataError") {
        toast.error(
          "Seu navegador não suporta copiar imagens. Use o download."
        );
      } else {
        toast.error("Erro ao copiar gráfico");
      }
    } finally {
      setDownloading(null);
    }
  };

  const getChartElement = (
    chartRef: React.RefObject<HTMLDivElement>
  ): HTMLDivElement | null => {
    return chartRef.current;
  };
  // Cores para os gráficos
  const CORES_IMPOSTOS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#F9A826",
    "#6B5B95",
    "#88D8B0",
    "#FF8066",
    "#5B6DBD",
  ];

  const CORES_COMPARATIVO = ["#10b981", "#ef4444", "#3b82f6"];

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!analise || !analise.indicadores) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/analises")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center">
          <p>Nenhum dado disponível para o dashboard</p>
        </div>
      </div>
    );
  }

  const { indicadores, empresa } = analise;

  // Preparar dados para gráficos
  const dadosImpostosPorTipo = indicadores.consolidado?.tributarios
    ?.impostosPorTipo
    ? Object.entries(indicadores.consolidado.tributarios.impostosPorTipo)
        .filter(([_, value]) => Number(value) > 0)
        .map(([name, value], index) => ({
          name: name.toUpperCase(),
          value: Number(value),
          color: CORES_IMPOSTOS[index % CORES_IMPOSTOS.length],
        }))
    : [];

  const dadosEvolucaoFaturamento =
    indicadores.mensal?.map((item: any) => ({
      mes: item.mes,
      faturamento: item.financeiro?.faturamento || 0,
      impostos: item.tributario?.impostos || 0,
      margem: item.financeiro?.margemBruta || 0,
    })) || [];

  const dadosComparativo = [
    {
      name: "Faturamento",
      valor: indicadores.consolidado?.financeiros?.faturamentoTotal || 0,
      cor: CORES_COMPARATIVO[0],
    },
    {
      name: "Impostos",
      valor: indicadores.consolidado?.tributarios?.impostosTotais || 0,
      cor: CORES_COMPARATIVO[1],
    },
    {
      name: "Lucro",
      valor: indicadores.consolidado?.financeiros?.lucroBruto || 0,
      cor: CORES_COMPARATIVO[2],
    },
  ];

  const formatarValor = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatarPercentual = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Funções separadas para cada gráfico para evitar problemas de tipo
  const downloadEvolucao = async () => {
    if (!evolucaoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await downloadChart(evolucaoRef.current, "Evolução Mensal");
  };

  const copyEvolucao = async () => {
    if (!evolucaoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await copyChart(evolucaoRef.current, "Evolução Mensal");
  };

  const downloadDistribuicao = async () => {
    if (!distribuicaoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await downloadChart(distribuicaoRef.current, "Distribuição Impostos");
  };

  const copyDistribuicao = async () => {
    if (!distribuicaoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await copyChart(distribuicaoRef.current, "Distribuição Impostos");
  };

  const downloadComparativo = async () => {
    if (!comparativoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await downloadChart(comparativoRef.current, "Comparativo Financeiro");
  };

  const copyComparativo = async () => {
    if (!comparativoRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await copyChart(comparativoRef.current, "Comparativo Financeiro");
  };

  const downloadMargem = async () => {
    if (!margemRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await downloadChart(margemRef.current, "Evolução Margem");
  };

  const copyMargem = async () => {
    if (!margemRef.current) {
      toast.error("Elemento do gráfico não encontrado");
      return;
    }
    await copyChart(margemRef.current, "Evolução Margem");
  };

  // Funções auxiliares
  const downloadChart = async (element: HTMLDivElement, chartName: string) => {
    try {
      setDownloading(chartName);

      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `grafico-${chartName.toLowerCase().replace(/\s+/g, "-")}-${analise?.empresa.razaoSocial}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(`Gráfico ${chartName} baixado com sucesso!`);
    } catch (error) {
      console.error("Erro ao baixar gráfico:", error);
      toast.error("Erro ao baixar gráfico");
    } finally {
      setDownloading(null);
    }
  };

  const copyChart = async (element: HTMLDivElement, chartName: string) => {
    try {
      setDownloading(`copy-${chartName}`);

      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      // Copiar para área de transferência
      const blob = await fetch(dataUrl).then((r) => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      toast.success(
        `Gráfico ${chartName} copiado para a área de transferência!`
      );
    } catch (error) {
      console.error("Erro ao copiar gráfico:", error);
      toast.error("Erro ao copiar gráfico");
    } finally {
      setDownloading(null);
    }
  };
  return (
    <div className="container mx-auto py-8">
      {/* Header com botão de voltar */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/analises/${params.id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Análise
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Análise</h1>
        <p className="text-gray-600">
          {empresa.razaoSocial} - CNPJ: {empresa.cnpj}
        </p>
        <p className="text-sm text-gray-500">
          Período analisado: {indicadores.metadados?.periodo?.inicio} a{" "}
          {indicadores.metadados?.periodo?.fim}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatarValor(
                indicadores.consolidado?.financeiros?.faturamentoTotal || 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Carga Tributária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatarPercentual(
                indicadores.consolidado?.tributarios?.cargaTributaria || 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatarPercentual(
                indicadores.consolidado?.financeiros?.margemBruta || 0
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Eficiência Tributária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatarPercentual(
                indicadores.consolidado?.tributarios?.eficienciaTributaria || 0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Evolução do Faturamento e Impostos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyEvolucao}
                disabled={downloading === "copy-Evolução Mensal"}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadEvolucao}
                disabled={downloading === "Evolução Mensal"}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={evolucaoRef}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosEvolucaoFaturamento}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [formatarValor(value), ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Faturamento"
                  />
                  <Line
                    type="monotone"
                    dataKey="impostos"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Impostos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição dos Impostos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Distribuição dos Impostos</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyDistribuicao}
                disabled={downloading === "copy-Distribuição Impostos"}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDistribuicao}
                disabled={downloading === "Distribuição Impostos"}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={distribuicaoRef}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosImpostosPorTipo}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {dadosImpostosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatarValor(value),
                      "Valor",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo Faturamento x Impostos x Lucro */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Comparativo Financeiro</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyComparativo}
              disabled={downloading === "copy-Comparativo Financeiro"}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadComparativo}
              disabled={downloading === "Comparativo Financeiro"}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={comparativoRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosComparativo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [formatarValor(value), "Valor"]}
                />
                <Legend />
                <Bar dataKey="valor" name="Valor">
                  {dadosComparativo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Margem Bruta Mensal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Evolução da Margem Bruta</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyMargem}
              disabled={downloading === "copy-Evolução Margem"}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadMargem}
              disabled={downloading === "Evolução Margem"}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={margemRef}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucaoFaturamento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    "Margem",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Margem Bruta (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
