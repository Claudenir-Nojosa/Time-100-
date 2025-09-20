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

  // Simulação de dados - na prática viria de uma API
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        // Simular delay de carregamento
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Dados mockados
        const gastosMock: Gasto[] = [
          {
            id: "1",
            data: "2025-09-15",
            descricao: "Mercado Mensal",
            valor: 487.9,
            categoria: "alimentacao",
            tipo: "compartilhado",
            responsavel: "Claudenir",
            pago: true,
          },
          {
            id: "2",
            data: "2025-09-14",
            descricao: "Restaurante",
            valor: 132.5,
            categoria: "alimentacao",
            tipo: "compartilhado",
            responsavel: "Esposa",
            pago: true,
          },
          {
            id: "3",
            data: "2025-09-12",
            descricao: "Salário",
            valor: 4200,
            categoria: "receita",
            tipo: "individual",
            responsavel: "Claudenir",
            pago: true,
          },
          {
            id: "4",
            data: "2025-09-10",
            descricao: "Combustível",
            valor: 180,
            categoria: "transporte",
            tipo: "compartilhado",
            responsavel: "Claudenir",
            pago: true,
          },
          {
            id: "5",
            data: "2025-09-08",
            descricao: "Parcela TV",
            valor: 89.9,
            categoria: "casa",
            tipo: "compartilhado",
            responsavel: "Ambos",
            pago: false,
          },
          {
            id: "6",
            data: "2025-09-05",
            descricao: "Roupas",
            valor: 220,
            categoria: "pessoal",
            tipo: "individual",
            responsavel: "Esposa",
            pago: true,
          },
          {
            id: "7",
            data: "2025-09-03",
            descricao: "Conserto Carro",
            valor: 350,
            categoria: "transporte",
            tipo: "compartilhado",
            responsavel: "Claudenir",
            pago: false,
          },
          {
            id: "8",
            data: "2025-09-01",
            descricao: "Salário",
            valor: 3800,
            categoria: "receita",
            tipo: "individual",
            responsavel: "Esposa",
            pago: true,
          },
        ];

        setGastos(gastosMock);
        calcularResumo(gastosMock);
        toast.success("Dados carregados com sucesso!");
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar os dados");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

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
    };
    return icons[categoria] || <span>📁</span>;
  };

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Gastos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </div>
      <WhatsAppIntegration />
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
              {resumoMensal.saldo >= 0
                ? "+12% em relação ao mês passado"
                : "-5% em relação ao mês passado"}
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
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês passado
            </p>
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
            <p className="text-xs text-muted-foreground">
              +5% em relação ao mês passado
            </p>
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

      {/* Cards de Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Despesas do mês atual por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                gastos.reduce(
                  (acc, gasto) => {
                    if (gasto.categoria !== "receita") {
                      acc[gasto.categoria] =
                        (acc[gasto.categoria] || 0) + gasto.valor;
                    }
                    return acc;
                  },
                  {} as Record<string, number>
                )
              ).map(([categoria, valor]) => (
                <div
                  key={categoria}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="mr-2">{getIconCategoria(categoria)}</span>
                    <span className="capitalize">{categoria}</span>
                  </div>
                  <div className="font-medium">{formatarMoeda(valor)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acerto de Contas</CardTitle>
            <CardDescription>
              Balanço entre os gastos compartilhados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Gastos dele (compartilhado):</span>
                <span className="font-medium">
                  {formatarMoeda(
                    gastos
                      .filter(
                        (g) =>
                          g.tipo === "compartilhado" &&
                          g.responsavel === "Claudenir"
                      )
                      .reduce((sum, g) => sum + g.valor, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gastos dela (compartilhado):</span>
                <span className="font-medium">
                  {formatarMoeda(
                    gastos
                      .filter(
                        (g) =>
                          g.tipo === "compartilhado" &&
                          g.responsavel === "Esposa"
                      )
                      .reduce((sum, g) => sum + g.valor, 0)
                  )}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Saldo:</span>
                  <span
                    className={
                      resumoMensal.individualEle > resumoMensal.individualEla
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {resumoMensal.individualEle > resumoMensal.individualEla
                      ? `Ela deve: ${formatarMoeda(resumoMensal.individualEle - resumoMensal.individualEla)}`
                      : `Ele deve: ${formatarMoeda(resumoMensal.individualEla - resumoMensal.individualEle)}`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Gastos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Últimos Gastos</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>
          <CardDescription>
            Lista de todos os gastos e receitas do mês atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">Carregando gastos...</div>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastosFiltrados.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell className="font-medium">
                      {formatarData(gasto.data)}
                    </TableCell>
                    <TableCell>{gasto.descricao}</TableCell>
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
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gasto.pago ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {gasto.pago ? "Pago" : "Pendente"}
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
