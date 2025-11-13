"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Filter,
  Download,
  Upload,
  BarChart3,
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
import { Calendar, User, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  periodoCadastro: Date;
  situacao: "ATIVA" | "NAO_VIGENTE";
  tributacao: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
  ie?: string;
  im?: string;
  certificadoDigital: boolean;
  email?: string;

  // 🆕 CAMPOS DE COMPLEXIDADE
  nivelEstudoTecnico?: number;
  demandaDuvidas?: number;
  tempoOperacional?: number;
  organizacaoCliente?: number;
  volumeDocumentos?: number;
  diversidadeOperacoes?: number;
  percentualComplexidade?: number;

  createdAt: Date;
  updatedAt: Date;
}

export default function EmpresasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [openComplexidadeDialog, setOpenComplexidadeDialog] = useState(false);
  const [empresaParaComplexidade, setEmpresaParaComplexidade] =
    useState<Empresa | null>(null);
  const [complexidadeData, setComplexidadeData] = useState({
    nivelEstudoTecnico: 0,
    demandaDuvidas: 0,
    tempoOperacional: 0,
    organizacaoCliente: 0,
    volumeDocumentos: 0,
    diversidadeOperacoes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");
  const [filterSituacao, setFilterSituacao] = useState("");
  const [openRepasseDialog, setOpenRepasseDialog] = useState(false);
  const [empresaParaRepasse, setEmpresaParaRepasse] = useState<Empresa | null>(
    null
  );
  const [repasseData, setRepasseData] = useState<Date>(new Date());
  const [colaborador, setColaborador] = useState("");
  const [observacoesRepasse, setObservacoesRepasse] = useState("");

  // Estado do formulário
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    cnpj: "",
    uf: "",
    grupo: "",
    periodoCadastro: new Date().toISOString().split("T")[0],
    situacao: "ATIVA" as "ATIVA" | "NAO_VIGENTE",
    tributacao: "SIMPLES_NACIONAL" as
      | "SIMPLES_NACIONAL"
      | "LUCRO_PRESUMIDO"
      | "LUCRO_REAL",
    ie: "",
    im: "",
    certificadoDigital: false,
    email: "",
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Buscar empresas
  useEffect(() => {
    if (status === "authenticated") {
      fetchEmpresas();
    }
  }, [status]);

  // 🆕 FUNÇÃO PARA CALCULAR COMPLEXIDADE
  const calcularComplexidade = (notas: typeof complexidadeData) => {
    const valores = Object.values(notas);
    const soma = valores.reduce((acc, nota) => acc + nota, 0);
    const maximoPossivel = 10 * 6; // 6 critérios com nota máxima 10
    return (soma / maximoPossivel) * 100;
  };

  // 🆕 FUNÇÃO PARA ABRIR DIALOG DE COMPLEXIDADE
  const handleAbrirComplexidade = (empresa: Empresa) => {
    setEmpresaParaComplexidade(empresa);
    setComplexidadeData({
      nivelEstudoTecnico: empresa.nivelEstudoTecnico || 0,
      demandaDuvidas: empresa.demandaDuvidas || 0,
      tempoOperacional: empresa.tempoOperacional || 0,
      organizacaoCliente: empresa.organizacaoCliente || 0,
      volumeDocumentos: empresa.volumeDocumentos || 0,
      diversidadeOperacoes: empresa.diversidadeOperacoes || 0,
    });
    setOpenComplexidadeDialog(true);
  };

  // 🆕 FUNÇÃO PARA SALVAR COMPLEXIDADE
  const handleSalvarComplexidade = async () => {
    if (!empresaParaComplexidade) return;

    try {
      const percentual = calcularComplexidade(complexidadeData);

      const response = await fetch(
        `/api/empresas/${empresaParaComplexidade.id}/complexidade`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...complexidadeData,
            percentualComplexidade: percentual,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar complexidade");
      }

      const empresaAtualizada = await response.json();

      // Atualiza a empresa na lista
      setEmpresas(
        empresas.map((e) =>
          e.id === empresaParaComplexidade.id ? empresaAtualizada : e
        )
      );

      toast.success("Complexidade avaliada com sucesso!");
      setOpenComplexidadeDialog(false);
    } catch (error) {
      console.error("Erro ao salvar complexidade:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar complexidade"
      );
    }
  };

  // 🆕 FUNÇÃO PARA OBTER COR DA COMPLEXIDADE
  const getCorComplexidade = (percentual: number) => {
    if (percentual <= 30) return "text-green-600 bg-green-100";
    if (percentual <= 60) return "text-yellow-600 bg-yellow-100";
    if (percentual <= 80) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  // 🆕 FUNÇÃO PARA OBTER LABEL DA COMPLEXIDADE
  const getLabelComplexidade = (percentual: number) => {
    if (percentual <= 20) return "Muito Baixa";
    if (percentual <= 40) return "Baixa";
    if (percentual <= 60) return "Média";
    if (percentual <= 80) return "Alta";
    return "Extrema";
  };

  // 🆕 FUNÇÃO PARA REPASSAR EMPRESA
  const handleRepassarEmpresa = async () => {
    if (!empresaParaRepasse || !colaborador) {
      toast.error("Preencha o colaborador para realizar o repasse");
      return;
    }

    try {
      const response = await fetch("/api/empresas/repasse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: empresaParaRepasse.id,
          colaborador,
          dataRepasse: repasseData.toISOString(),
          observacoes: observacoesRepasse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao repassar empresa");
      }

      const resultado = await response.json();

      // Atualiza a empresa na lista
      setEmpresas(
        empresas.map((e) =>
          e.id === empresaParaRepasse.id ? { ...e, situacao: "NAO_VIGENTE" } : e
        )
      );

      toast.success(`Empresa repassada para ${colaborador} com sucesso!`);
      setOpenRepasseDialog(false);
      resetRepasseForm();
    } catch (error) {
      console.error("Erro ao repassar empresa:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao repassar empresa"
      );
    }
  };

  // 🆕 FUNÇÃO PARA RESETAR FORMULÁRIO DE REPASSE
  const resetRepasseForm = () => {
    setEmpresaParaRepasse(null);
    setColaborador("");
    setRepasseData(new Date());
    setObservacoesRepasse("");
  };

  // 🆕 FUNÇÃO PARA ABRIR DIALOG DE REPASSE
  const handleAbrirRepasse = (empresa: Empresa) => {
    setEmpresaParaRepasse(empresa);
    setColaborador("");
    setRepasseData(new Date());
    setObservacoesRepasse("");
    setOpenRepasseDialog(true);
  };

  // 🆕 FUNÇÃO PARA VER DETALHES DO REPASSE
  const handleVerRepasse = async (empresa: Empresa) => {
    try {
      const response = await fetch(`/api/empresas/${empresa.id}/repasse`);
      if (response.ok) {
        const repasse = await response.json();

        toast.info(`Repassada para: ${repasse.colaborador}`, {
          description: `Data: ${new Date(repasse.dataRepasse).toLocaleDateString("pt-BR")}`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar repasse:", error);
    }
  };

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/empresas");
      const data = await res.json();
      setEmpresas(data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar empresas
  const empresasFiltradas = empresas.filter((empresa) => {
    const matchesSearch =
      empresa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.cnpj.includes(searchTerm);

    const matchesGrupo =
      filterGrupo === "all" || filterGrupo === ""
        ? true
        : empresa.grupo === filterGrupo;
    const matchesSituacao =
      filterSituacao === "all" || filterSituacao === ""
        ? true
        : empresa.situacao === filterSituacao;

    return matchesSearch && matchesGrupo && matchesSituacao;
  });

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      codigo: "",
      descricao: "",
      cnpj: "",
      uf: "",
      grupo: "",
      periodoCadastro: new Date().toISOString().split("T")[0],
      situacao: "ATIVA",
      tributacao: "SIMPLES_NACIONAL",
      ie: "",
      im: "",
      certificadoDigital: false,
      email: "",
    });
    setEditingEmpresa(null);
  };

  // Abrir dialog para nova empresa
  const handleNewEmpresa = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Abrir dialog para editar empresa
  const handleEditEmpresa = (empresa: Empresa) => {
    setFormData({
      codigo: empresa.codigo,
      descricao: empresa.descricao,
      cnpj: empresa.cnpj,
      uf: empresa.uf,
      grupo: empresa.grupo,
      periodoCadastro: new Date(empresa.periodoCadastro)
        .toISOString()
        .split("T")[0],
      situacao: empresa.situacao,
      tributacao: empresa.tributacao,
      ie: empresa.ie || "",
      im: empresa.im || "",
      certificadoDigital: empresa.certificadoDigital,
      email: empresa.email || "",
    });
    setEditingEmpresa(empresa);
    setOpenDialog(true);
  };

  // Salvar empresa
  const handleSaveEmpresa = async () => {
    try {
      if (
        !formData.codigo ||
        !formData.descricao ||
        !formData.cnpj ||
        !formData.uf ||
        !formData.grupo
      ) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const url = editingEmpresa
        ? `/api/empresas/${editingEmpresa.id}`
        : "/api/empresas";

      const method = editingEmpresa ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          periodoCadastro: new Date(formData.periodoCadastro).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar empresa");
      }

      const empresaSalva = await response.json();

      if (editingEmpresa) {
        setEmpresas(
          empresas.map((e) => (e.id === empresaSalva.id ? empresaSalva : e))
        );
        toast.success("Empresa atualizada com sucesso!");
      } else {
        setEmpresas([...empresas, empresaSalva]);
        toast.success("Empresa cadastrada com sucesso!");
      }

      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error("Erro ao salvar empresa");
    }
  };

  // Excluir empresa
  const handleDeleteEmpresa = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) {
      return;
    }

    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir empresa");
      }

      setEmpresas(empresas.filter((e) => e.id !== id));
      toast.success("Empresa excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      toast.error("Erro ao excluir empresa");
    }
  };

  // Grupos únicos para filtro
  const gruposUnicos = [...new Set(empresas.map((e) => e.grupo))];

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

  return (
    <div className="container mx-auto py-6 px-4 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Building className="h-8 w-8" />
            Cadastro de Empresas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as empresas do seu grupo
          </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNewEmpresa}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Código */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Código *</label>
                <Input
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="Código único"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição *</label>
                <Input
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <label className="text-sm font-medium">CNPJ *</label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>

              {/* UF */}
              <div className="space-y-2">
                <label className="text-sm font-medium">UF *</label>
                <Input
                  value={formData.uf}
                  onChange={(e) =>
                    setFormData({ ...formData, uf: e.target.value })
                  }
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              {/* Grupo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo *</label>
                <Input
                  value={formData.grupo}
                  onChange={(e) =>
                    setFormData({ ...formData, grupo: e.target.value })
                  }
                  placeholder="Ex: Grupo Grafnet"
                />
              </div>

              {/* Período de Cadastro */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Período de Cadastro *
                </label>
                <Input
                  type="month"
                  value={formData.periodoCadastro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodoCadastro: e.target.value,
                    })
                  }
                />
              </div>

              {/* Situação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Situação *</label>
                <Select
                  value={formData.situacao}
                  onValueChange={(value: "ATIVA" | "NAO_VIGENTE") =>
                    setFormData({ ...formData, situacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVA">Ativa</SelectItem>
                    <SelectItem value="NAO_VIGENTE">Não Vigente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tributação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tributação *</label>
                <Select
                  value={formData.tributacao}
                  onValueChange={(
                    value: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL"
                  ) => setFormData({ ...formData, tributacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a tributação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLES_NACIONAL">
                      Simples Nacional
                    </SelectItem>
                    <SelectItem value="LUCRO_PRESUMIDO">
                      Lucro Presumido
                    </SelectItem>
                    <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">IE</label>
                <Input
                  value={formData.ie}
                  onChange={(e) =>
                    setFormData({ ...formData, ie: e.target.value })
                  }
                  placeholder="Inscrição Estadual"
                />
              </div>

              {/* IM */}
              <div className="space-y-2">
                <label className="text-sm font-medium">IM</label>
                <Input
                  value={formData.im}
                  onChange={(e) =>
                    setFormData({ ...formData, im: e.target.value })
                  }
                  placeholder="Inscrição Municipal"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@empresa.com"
                />
              </div>

              {/* Certificado Digital */}
              <div className="flex items-center space-x-2 md:col-span-2 pt-4">
                <input
                  type="checkbox"
                  id="certificadoDigital"
                  checked={formData.certificadoDigital}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificadoDigital: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="certificadoDigital"
                  className="text-sm font-medium"
                >
                  Possui certificado digital A1
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEmpresa}>
                {editingEmpresa ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Estatísticas */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro Grupo */}
            <Select value={filterGrupo} onValueChange={setFilterGrupo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por grupo" />
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

            {/* Filtro Situação */}
            <Select value={filterSituacao} onValueChange={setFilterSituacao}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                <SelectItem value="ATIVA">Ativas</SelectItem>
                <SelectItem value="NAO_VIGENTE">Não Vigentes</SelectItem>
              </SelectContent>
            </Select>

            {/* Estatísticas */}
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {empresasFiltradas.length}
              </div>
              <div className="text-xs text-gray-600">Empresas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando empresas...</div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {empresas.length === 0
                ? "Nenhuma empresa cadastrada"
                : "Nenhuma empresa encontrada com os filtros aplicados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Tributação</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Complexidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresasFiltradas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell className="font-medium">
                        {empresa.codigo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{empresa.descricao}</div>
                          {empresa.email && (
                            <div className="text-xs text-gray-500">
                              {empresa.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{empresa.cnpj}</TableCell>
                      <TableCell>{empresa.uf}</TableCell>
                      <TableCell>{empresa.grupo}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            empresa.situacao === "ATIVA"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            empresa.situacao === "ATIVA"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {empresa.situacao === "ATIVA"
                            ? "Ativa"
                            : "Não Vigente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {empresa.tributacao === "SIMPLES_NACIONAL" &&
                            "Simples Nacional"}
                          {empresa.tributacao === "LUCRO_PRESUMIDO" &&
                            "Lucro Presumido"}
                          {empresa.tributacao === "LUCRO_REAL" && "Lucro Real"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Botão Complexidade */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAbrirComplexidade(empresa)}
                            title="Avaliar complexidade"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          {/* Botão Repassar - só aparece se empresa estiver ATIVA */}
                          {empresa.situacao === "ATIVA" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirRepasse(empresa)}
                              title="Repassar empresa"
                            >
                              <User className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Botão Ver Repasse - só aparece se empresa estiver NÃO VIGENTE */}
                          {empresa.situacao === "NAO_VIGENTE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerRepasse(empresa)}
                              title="Ver detalhes do repasse"
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmpresa(empresa)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmpresa(empresa.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {empresa.percentualComplexidade ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              className={`text-xs ${getCorComplexidade(empresa.percentualComplexidade)}`}
                            >
                              {Math.round(empresa.percentualComplexidade)}% -{" "}
                              {getLabelComplexidade(
                                empresa.percentualComplexidade
                              )}
                            </Badge>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${getCorComplexidade(empresa.percentualComplexidade).split(" ")[0]}`}
                                style={{
                                  width: `${empresa.percentualComplexidade}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Não avaliada
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog de Repasse de Empresa */}
      <Dialog open={openRepasseDialog} onOpenChange={setOpenRepasseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Repassar Empresa
            </DialogTitle>
          </DialogHeader>

          {empresaParaRepasse && (
            <div className="space-y-4 py-4">
              {/* Informações da Empresa */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">
                  Empresa a ser repassada:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Código:</span>
                    <div className="font-medium">
                      {empresaParaRepasse.codigo}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <div className="font-medium">
                      {empresaParaRepasse.descricao}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">CNPJ:</span>
                    <div className="font-medium">{empresaParaRepasse.cnpj}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Grupo:</span>
                    <div className="font-medium">
                      {empresaParaRepasse.grupo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colaborador */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Colaborador *</label>
                <Input
                  value={colaborador}
                  onChange={(e) => setColaborador(e.target.value)}
                  placeholder="Nome do colaborador"
                />
              </div>

              {/* Data do Repasse */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data do Repasse *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {repasseData ? (
                        format(repasseData, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={repasseData}
                      onSelect={(date) => date && setRepasseData(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  value={observacoesRepasse}
                  onChange={(e) => setObservacoesRepasse(e.target.value)}
                  placeholder="Observações sobre o repasse..."
                  className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Aviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <RotateCcw className="h-4 w-4" />
                  <span>
                    <strong>Atenção:</strong> Após o repasse, a situação da
                    empresa será alterada para "Não Vigente" automaticamente.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpenRepasseDialog(false);
                resetRepasseForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRepassarEmpresa}
              disabled={!colaborador}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <User className="h-4 w-4 mr-2" />
              Confirmar Repasse
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog de Avaliação de Complexidade */}
      <Dialog
        open={openComplexidadeDialog}
        onOpenChange={setOpenComplexidadeDialog}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Avaliar Complexidade da Empresa
            </DialogTitle>
          </DialogHeader>

          {empresaParaComplexidade && (
            <div className="space-y-6 py-4">
              {/* Informações da Empresa */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Empresa:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Código:</span>
                    <div className="font-medium">
                      {empresaParaComplexidade.codigo}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <div className="font-medium">
                      {empresaParaComplexidade.descricao}
                    </div>
                  </div>
                </div>
              </div>

              {/* Critérios de Complexidade */}
              <div className="space-y-6">
                <h4 className="font-semibold text-sm">
                  Critérios de Complexidade (1-10)
                </h4>

                {/* Nível de Estudo Técnico */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Nível de Estudo Técnico</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.nivelEstudoTecnico}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Complexidade técnica dos processos e conhecimentos
                    específicos requeridos
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.nivelEstudoTecnico}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        nivelEstudoTecnico: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Básico</span>
                    <span>10 - Especializado</span>
                  </div>
                </div>

                {/* Demanda de Dúvidas e Conversas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Demanda de Dúvidas e Conversas</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.demandaDuvidas}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Frequência e complexidade das interações e esclarecimentos
                    necessários
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.demandaDuvidas}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        demandaDuvidas: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Raras</span>
                    <span>10 - Constantes</span>
                  </div>
                </div>

                {/* Tempo Operacional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Tempo Operacional</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.tempoOperacional}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Tempo necessário para execução das atividades e processos
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.tempoOperacional}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        tempoOperacional: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Rápido</span>
                    <span>10 - Demorado</span>
                  </div>
                </div>

                {/* Organização do Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Organização do Cliente</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.organizacaoCliente}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Nível de organização, documentação e processos do cliente
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.organizacaoCliente}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        organizacaoCliente: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Organizado</span>
                    <span>10 - Desorganizado</span>
                  </div>
                </div>

                {/* Volume de Documentos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Volume de Documentos</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.volumeDocumentos}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Quantidade e variedade de documentos a serem processados
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.volumeDocumentos}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        volumeDocumentos: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Baixo</span>
                    <span>10 - Alto</span>
                  </div>
                </div>

                {/* Diversidade de Operações */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Diversidade de Operações</span>
                    <span className="text-blue-600 font-bold">
                      {complexidadeData.diversidadeOperacoes}
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    Variedade de tipos de operações, processos e atividades
                    diferentes
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={complexidadeData.diversidadeOperacoes}
                    onChange={(e) =>
                      setComplexidadeData({
                        ...complexidadeData,
                        diversidadeOperacoes: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Poucas</span>
                    <span>10 - Muitas</span>
                  </div>
                </div>
              </div>

              {/* Resultado da Complexidade */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 text-blue-800">
                  Resultado da Complexidade
                </h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {Math.round(calcularComplexidade(complexidadeData))}%
                  </div>
                  <div
                    className={`text-sm font-medium ${getCorComplexidade(calcularComplexidade(complexidadeData))} px-3 py-1 rounded-full`}
                  >
                    {getLabelComplexidade(
                      calcularComplexidade(complexidadeData)
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${getCorComplexidade(calcularComplexidade(complexidadeData)).split(" ")[0]}`}
                      style={{
                        width: `${calcularComplexidade(complexidadeData)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenComplexidadeDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarComplexidade}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Salvar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
