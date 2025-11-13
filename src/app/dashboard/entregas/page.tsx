"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  X,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  FileText,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Empresa {
  id: string;
  codigo: string;
  descricao: string;
  cnpj: string;
  uf: string;
  grupo: string;
  situacao: "ATIVA" | "NAO_VIGENTE";
}

interface Obrigacao {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
}

interface Entrega {
  id: string;
  empresaId: string;
  obrigacaoId: string;
  mesReferencia: string;
  entregue: boolean;
  dataEntrega?: Date;
  observacoes?: string;
  empresa: Empresa;
  obrigacao: Obrigacao;
}

export default function EntregasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMes, setFilterMes] = useState(getMesAtual());
  const [filterGrupo, setFilterGrupo] = useState("all");
  const [filterObrigacao, setFilterObrigacao] = useState("all");

  // Dialogs
  const [openObrigacaoDialog, setOpenObrigacaoDialog] = useState(false);
  const [openEntregaDialog, setOpenEntregaDialog] = useState(false);
  const [novaObrigacao, setNovaObrigacao] = useState({
    nome: "",
    descricao: "",
    categoria: "TRIBUTARIA",
  });

  // Função para obter mês atual no formato YYYY-MM
  function getMesAtual() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Buscar dados
  useEffect(() => {
    if (status === "authenticated") {
      fetchDados();
    }
  }, [status, filterMes]);

  const fetchDados = async () => {
    try {
      setLoading(true);

      const [empresasRes, obrigacoesRes, entregasRes] = await Promise.all([
        fetch("/api/empresas"),
        fetch("/api/obrigacoes"),
        fetch(`/api/entregas?mes=${filterMes}`),
      ]);

      const [empresasData, obrigacoesData, entregasData] = await Promise.all([
        empresasRes.json(),
        obrigacoesRes.json(),
        entregasRes.json(),
      ]);

      setEmpresas(empresasData);
      setObrigacoes(obrigacoesData);
      setEntregas(entregasData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Criar nova obrigação
  const handleCriarObrigacao = async () => {
    try {
      if (!novaObrigacao.nome) {
        toast.error("Preencha o nome da obrigação");
        return;
      }

      const response = await fetch("/api/obrigacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaObrigacao),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar obrigação");
      }

      const obrigacaoCriada = await response.json();
      setObrigacoes([...obrigacoes, obrigacaoCriada]);
      setOpenObrigacaoDialog(false);
      setNovaObrigacao({ nome: "", descricao: "", categoria: "TRIBUTARIA" });
      toast.success("Obrigação criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar obrigação:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar obrigação"
      );
    }
  };

  // Toggle entrega
  const handleToggleEntrega = async (
    empresaId: string,
    obrigacaoId: string,
    entregue: boolean
  ) => {
    try {
      const response = await fetch("/api/entregas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId,
          obrigacaoId,
          mesReferencia: filterMes,
          entregue: !entregue,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar entrega");
      }

      const entregaAtualizada = await response.json();

      // Atualizar lista de entregas
      setEntregas(
        entregas.map((e) =>
          e.empresaId === empresaId &&
          e.obrigacaoId === obrigacaoId &&
          e.mesReferencia === filterMes
            ? entregaAtualizada
            : e
        )
      );

      toast.success(
        entregue
          ? "Entrega marcada como pendente"
          : "Entrega marcada como concluída"
      );
    } catch (error) {
      console.error("Erro ao atualizar entrega:", error);
      toast.error("Erro ao atualizar entrega");
    }
  };

  // Gerar matriz de entregas
  const gerarMatrizEntregas = () => {
    const matriz: { [key: string]: { [key: string]: Entrega | null } } = {};

    // Inicializar matriz
    empresas.forEach((empresa) => {
      matriz[empresa.id] = {};
      obrigacoes.forEach((obrigacao) => {
        matriz[empresa.id][obrigacao.id] = null;
      });
    });

    // Preencher com entregas existentes
    entregas.forEach((entrega) => {
      if (
        matriz[entrega.empresaId] &&
        matriz[entrega.empresaId][entrega.obrigacaoId] === null
      ) {
        matriz[entrega.empresaId][entrega.obrigacaoId] = entrega;
      }
    });

    return matriz;
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter((empresa) => {
    const matchesSearch =
      empresa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrupo =
      filterGrupo === "all" ? true : empresa.grupo === filterGrupo;

    return matchesSearch && matchesGrupo;
  });

  // Filtrar obrigações
  const obrigacoesFiltradas = obrigacoes.filter((obrigacao) =>
    filterObrigacao === "all" ? true : obrigacao.id === filterObrigacao
  );

  // Estatísticas
  const totalEntregas = entregas.filter((e) => e.entregue).length;
  const totalPendentes = entregas.filter((e) => !e.entregue).length;
  const percentualConcluido =
    entregas.length > 0
      ? Math.round((totalEntregas / entregas.length) * 100)
      : 0;

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const matrizEntregas = gerarMatrizEntregas();
  const gruposUnicos = [...new Set(empresas.map((e) => e.grupo))];
  const meses = gerarMeses();

  return (
    <div className="container mx-auto py-6 px-4 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Controle de Entregas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as obrigações mensais das empresas
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={openObrigacaoDialog}
            onOpenChange={setOpenObrigacaoDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Obrigação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Obrigação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={novaObrigacao.nome}
                    onChange={(e) =>
                      setNovaObrigacao({
                        ...novaObrigacao,
                        nome: e.target.value,
                      })
                    }
                    placeholder="Ex: ICMS, DCTF, EFD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    value={novaObrigacao.descricao}
                    onChange={(e) =>
                      setNovaObrigacao({
                        ...novaObrigacao,
                        descricao: e.target.value,
                      })
                    }
                    placeholder="Descrição da obrigação"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={novaObrigacao.categoria}
                    onValueChange={(value) =>
                      setNovaObrigacao({ ...novaObrigacao, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIBUTARIA">Tributária</SelectItem>
                      <SelectItem value="FISCAL">Fiscal</SelectItem>
                      <SelectItem value="CONTABIL">Contábil</SelectItem>
                      <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenObrigacaoDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCriarObrigacao}>Criar Obrigação</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros e Estatísticas */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Mês Referência */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês Referência</label>
              <Select value={filterMes} onValueChange={setFilterMes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro Grupo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              <Select value={filterGrupo} onValueChange={setFilterGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {gruposUnicos.map((grupo) => (
                    <SelectItem key={grupo} value={grupo}>
                      {grupo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Obrigação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Obrigação</label>
              <Select
                value={filterObrigacao}
                onValueChange={setFilterObrigacao}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obrigações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obrigações</SelectItem>
                  {obrigacoes.map((obrigacao) => (
                    <SelectItem key={obrigacao.id} value={obrigacao.id}>
                      {obrigacao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estatísticas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Progresso</label>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-lg font-bold text-green-600">
                    {totalEntregas}
                  </div>
                  <div className="text-xs text-green-600">Concluídas</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="text-lg font-bold text-red-600">
                    {totalPendentes}
                  </div>
                  <div className="text-xs text-red-600">Pendentes</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-lg font-bold text-blue-600">
                    {percentualConcluido}%
                  </div>
                  <div className="text-xs text-blue-600">Concluído</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entregas - {meses.find((m) => m.value === filterMes)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando entregas...</div>
          ) : empresasFiltradas.length === 0 ||
            obrigacoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {empresas.length === 0
                ? "Nenhuma empresa cadastrada"
                : "Nenhum dado encontrado com os filtros aplicados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Grupo</TableHead>
                    {obrigacoesFiltradas.map((obrigacao) => (
                      <TableHead
                        key={obrigacao.id}
                        className="text-center min-w-[100px]"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium">
                            {obrigacao.nome}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {obrigacao.categoria}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresasFiltradas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{empresa.descricao}</div>
                          <div className="text-xs text-gray-500">
                            {empresa.codigo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{empresa.cnpj}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {empresa.grupo}
                        </Badge>
                      </TableCell>
                      {obrigacoesFiltradas.map((obrigacao) => {
                        const entrega =
                          matrizEntregas[empresa.id]?.[obrigacao.id];
                        return (
                          <TableCell key={obrigacao.id} className="text-center">
                            <Button
                              variant={
                                entrega?.entregue ? "default" : "outline"
                              }
                              size="sm"
                              className={`w-10 h-10 p-0 ${
                                entrega?.entregue
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : "bg-red-500 hover:bg-red-600 text-white"
                              }`}
                              onClick={() =>
                                handleToggleEntrega(
                                  empresa.id,
                                  obrigacao.id,
                                  entrega?.entregue || false
                                )
                              }
                              title={
                                entrega?.entregue
                                  ? `Entregue em ${entrega.dataEntrega ? new Date(entrega.dataEntrega).toLocaleDateString("pt-BR") : "N/A"}`
                                  : "Marcar como entregue"
                              }
                            >
                              {entrega?.entregue ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Função para gerar lista de meses
function gerarMeses() {
  const meses = [];
  const now = new Date();

  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    meses.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }

  return meses;
}
