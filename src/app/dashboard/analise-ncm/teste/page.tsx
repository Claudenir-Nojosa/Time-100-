// app/dashboard/gastos/page.tsx
"use client";

import { useState, useEffect, JSX } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Download,
  Upload,
  Filter,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIntegration } from "@/components/shared/whatsapp-integration";

interface Gasto {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  tipo: "compartilhado" | "individual";
  responsavel: string;
  pago: boolean;
  origem: string;
  mensagemOriginal: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumoMensal {
  receitas: number;
  despesas: number;
  saldo: number;
  compartilhado: number;
  individualEle: number;
  individualEla: number;
}

export default function DashboardGastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    compartilhado: 0,
    individualEle: 0,
    individualEla: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [atualizando, setAtualizando] = useState(false);

  // Buscar dados reais do Supabase
  useEffect(() => {
    carregarDados();
  }, [filtroCategoria, filtroTipo]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria !== "todas")
        params.append("categoria", filtroCategoria);
      if (filtroTipo !== "todos") params.append("tipo", filtroTipo);

      const response = await fetch(`/api/gastos?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const data = await response.json();
      setGastos(data.gastos);
      calcularResumo(data.gastos);
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar os dados");
    } finally {
      setCarregando(false);
    }
  };

  const atualizarDados = async () => {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  };

  const calcularResumo = (gastos: Gasto[]) => {
    let receitas = 0;
    let despesas = 0;
    let compartilhado = 0;
    let individualEle = 0;
    let individualEla = 0;

    gastos.forEach((gasto) => {
      if (gasto.categoria === "receita") {
        receitas += gasto.valor;
        if (gasto.responsavel === "Claudenir") individualEle += gasto.valor;
        else if (gasto.responsavel === "Esposa") individualEla += gasto.valor;
      } else {
        despesas += gasto.valor;
        if (gasto.tipo === "compartilhado") {
          compartilhado += gasto.valor;
        } else if (gasto.responsavel === "Claudenir") {
          individualEle -= gasto.valor;
        } else if (gasto.responsavel === "Esposa") {
          individualEla -= gasto.valor;
        }
      }
    });

    setResumoMensal({
      receitas,
      despesas,
      saldo: receitas - despesas,
      compartilhado,
      individualEle,
      individualEla,
    });
  };

  const gastosFiltrados = gastos.filter((gasto) => {
    const categoriaMatch =
      filtroCategoria === "todas" || gasto.categoria === filtroCategoria;
    const tipoMatch = filtroTipo === "todos" || gasto.tipo === filtroTipo;
    return categoriaMatch && tipoMatch;
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const getCorCategoria = (categoria: string) => {
    const cores: Record<string, string> = {
      alimentacao: "bg-orange-100 text-orange-800",
      transporte: "bg-blue-100 text-blue-800",
      casa: "bg-purple-100 text-purple-800",
      pessoal: "bg-pink-100 text-pink-800",
      receita: "bg-green-100 text-green-800",
      lazer: "bg-yellow-100 text-yellow-800",
      outros: "bg-gray-100 text-gray-800",
    };
    return cores[categoria] || "bg-gray-100 text-gray-800";
  };

  const getIconCategoria = (categoria: string) => {
    const icons: Record<string, JSX.Element> = {
      alimentacao: <span>🍕</span>,
      transporte: <span>🚗</span>,
      casa: <span>🏠</span>,
      pessoal: <span>👕</span>,
      receita: <span>💰</span>,
      lazer: <span>🎬</span>,
      outros: <span>📁</span>,
    };
    return icons[categoria] || <span>📁</span>;
  };

  const exportarDados = () => {
    const csv = gastos
      .map(
        (gasto) =>
          `${formatarData(gasto.data)},${gasto.descricao},${gasto.categoria},${gasto.tipo},${gasto.responsavel},${gasto.valor},${gasto.pago ? "Pago" : "Pendente"}`
      )
      .join("\n");

    const blob = new Blob(
      [`Data,Descrição,Categoria,Tipo,Responsável,Valor,Status\n${csv}`],
      { type: "text/csv" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gastos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6 mt-20">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando gastos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Gastos</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={atualizarDados}
            disabled={atualizando}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${atualizando ? "animate-spin" : ""}`}
            />
            {atualizando ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportarDados}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </div>
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${resumoMensal.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumoMensal.saldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastos.length} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumoMensal.receitas)}
            </div>
            <p className="text-xs text-muted-foreground">Entradas do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumoMensal.despesas)}
            </div>
            <p className="text-xs text-muted-foreground">Saídas do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compartilhado</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatarMoeda(resumoMensal.compartilhado)}
            </div>
            <p className="text-xs text-muted-foreground">
              A ser dividido: {formatarMoeda(resumoMensal.compartilhado / 2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="categoria">Categoria</Label>
          <select
            id="categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="todas">Todas categorias</option>
            <option value="alimentacao">Alimentação</option>
            <option value="transporte">Transporte</option>
            <option value="casa">Casa</option>
            <option value="pessoal">Pessoal</option>
            <option value="lazer">Lazer</option>
            <option value="receita">Receita</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="todos">Todos os tipos</option>
            <option value="individual">Individual</option>
            <option value="compartilhado">Compartilhado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Gastos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Últimos Gastos</CardTitle>
            <span className="text-sm text-muted-foreground">
              {gastosFiltrados.length} registros
            </span>
          </div>
          <CardDescription>Lista de todos os gastos e receitas</CardDescription>
        </CardHeader>
        <CardContent>
          {gastosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum gasto encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastosFiltrados.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell className="font-medium">
                      {formatarData(gasto.data)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{gasto.descricao}</div>
                        {gasto.mensagemOriginal && (
                          <div className="text-xs text-muted-foreground">
                            Original: {gasto.mensagemOriginal.substring(0, 30)}
                            ...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getCorCategoria(gasto.categoria)}`}
                      >
                        {getIconCategoria(gasto.categoria)}
                        <span className="ml-1">{gasto.categoria}</span>
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{gasto.tipo}</TableCell>
                    <TableCell className="capitalize">
                      {gasto.responsavel}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${gasto.categoria === "receita" ? "text-green-600" : "text-red-600"}`}
                    >
                      {gasto.categoria === "receita" ? "+" : "-"}
                      {formatarMoeda(gasto.valor)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {gasto.origem}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
