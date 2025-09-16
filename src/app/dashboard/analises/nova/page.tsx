// app/dashboard/emails/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building,
  Calculator,
  Copy,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Store,
  Factory,
  Wrench,
  FileText,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  Plus,
  X,
  Download,
  History,
} from "lucide-react";

type Empresa = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  uf: string;
  regimeTributacao: string;
  responsavel: string;
};

type Atividade = "comercio" | "industria" | "servicos";

type DadosApuracao = {
  mes: string;
  faturamento: {
    comercio?: number;
    industria?: number;
    servicos?: number;
  };
  totalCompras: number;
  impostos: {
    simples?: number;
    icms?: number;
    pis?: number;
    cofins?: number;
    ipi?: number;
    iss?: number;
  };
};

export default function EmailsPage() {
  const { data: session, status } = useSession();
  const [meses, setMeses] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [novoMes, setNovoMes] = useState("");
  const [novoAno, setNovoAno] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<
    Atividade[]
  >([]);
  const [mesReferenciaSelecionado, setMesReferenciaSelecionado] = useState("");
  const [dadosApuracao, setDadosApuracao] = useState<DadosApuracao[]>([]);
  const [analise, setAnalise] = useState<string>("");
  const [carregandoAnalise, setCarregandoAnalise] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [empresasCarregadas, setEmpresasCarregadas] = useState<boolean>(false);
  const [historicoAnalises, setHistoricoAnalises] = useState<
    { empresa: string; data: string; analise: string }[]
  >([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    {}
  );

  // Gerar lista de meses disponíveis
  const mesesDoAno = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const anosDisponiveis = ["2023", "2024", "2025", "2026"];

  const adicionarMes = () => {
    if (!novoMes || !novoAno) {
      toast.error("Selecione o mês e ano");
      return;
    }

    const mesValue = `${novoMes.toLowerCase()}-${novoAno}`;
    const mesLabel = `${novoMes}/${novoAno}`;

    if (meses.some((m) => m.value === mesValue)) {
      toast.error("Mês já adicionado");
      return;
    }

    setMeses((prev) => [...prev, { value: mesValue, label: mesLabel }]);

    // Definir automaticamente o mês de referência se for o primeiro mês adicionado
    if (meses.length === 0) {
      setMesSelecionado(mesValue);
      setMesReferenciaSelecionado(mesValue);
    }

    setNovoMes("");
    setNovoAno("");
    toast.success("Mês adicionado com sucesso!");
  };

  const removerMes = (mesValue: string) => {
    setMeses((prev) => prev.filter((m) => m.value !== mesValue));
    // Remover também os dados de apuração desse mês
    setDadosApuracao((prev) => prev.filter((d) => d.mes !== mesValue));
    toast.success("Mês removido com sucesso!");
  };

  const toggleExpandMonth = (mesValue: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [mesValue]: !prev[mesValue],
    }));
  };

  const gerarAnaliseTributaria = async () => {
    if (!empresaSelecionada) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    // Verificar se há dados de apuração
    if (dadosApuracao.length === 0 || meses.length === 0) {
      toast.error("Adicione e preencha os dados dos meses primeiro");
      return;
    }

    try {
      setCarregandoAnalise(true);

      const empresa = empresas.find((e) => e.id === empresaSelecionada);
      if (!empresa) return;

      // Usar os meses da lista em vez de dadosApuracao para evitar undefined
      const primeiroMes = meses[0]?.label || "Mês inicial";
      const ultimoMes = meses[meses.length - 1]?.label || "Mês final";

      // Calcular totais para análise
      const totaisMensais = dadosApuracao.map((dados, index) => {
        const faturamentoTotal =
          (dados.faturamento.comercio || 0) +
          (dados.faturamento.industria || 0) +
          (dados.faturamento.servicos || 0);

        const impostosTotal =
          (dados.impostos.simples || 0) +
          (dados.impostos.icms || 0) +
          (dados.impostos.pis || 0) +
          (dados.impostos.cofins || 0) +
          (dados.impostos.ipi || 0) +
          (dados.impostos.iss || 0);

        return {
          mes: dados.mes,
          faturamentoTotal,
          impostosTotal,
          totalCompras: dados.totalCompras || 0,
        };
      });

      // Gerar prompt focado na análise financeira e tributária em formato de e-mail
      const prompt = `
Gere uma análise financeira e tributária detalhada em formato de E-MAIL FORMAL para envio ao cliente.

DESTINATÁRIO: ${empresa.razaoSocial}
CONTATO: ${empresa.responsavel}
ASSUNTO: Análise Financeira e Tributária - Período de ${primeiroMes} a ${ultimoMes}

DADOS PARA ANÁLISE:

EMPRESA: ${empresa.razaoSocial}
CNPJ: ${empresa.cnpj}
UF: ${empresa.uf}
REGIME TRIBUTÁRIO: ${formatarRegimeTributario(empresa.regimeTributacao)}
ATIVIDADES: ${atividadesSelecionadas.join(", ")}

DADOS DOS ÚLTIMOS MESES (${meses.length} meses):
${dadosApuracao
  .map((dados, index) => {
    const total = totaisMensais[index];
    const mesLabel =
      meses.find((m) => m.value === dados.mes)?.label || dados.mes;

    return `
MÊS: ${mesLabel.toUpperCase()}
FATURAMENTO:
${dados.faturamento.comercio ? `- Comércio: R$ ${dados.faturamento.comercio.toFixed(2)}` : ""}
${dados.faturamento.industria ? `- Indústria: R$ ${dados.faturamento.industria.toFixed(2)}` : ""}
${dados.faturamento.servicos ? `- Serviços: R$ ${dados.faturamento.servicos.toFixed(2)}` : ""}
- TOTAL FATURAMENTO: R$ ${total.faturamentoTotal.toFixed(2)}

COMPRAS:
- Total Compras: R$ ${dados.totalCompras.toFixed(2)}

IMPOSTOS PAGOS:
${dados.impostos.simples ? `- Simples Nacional: R$ ${dados.impostos.simples.toFixed(2)}` : ""}
${dados.impostos.icms ? `- ICMS: R$ ${dados.impostos.icms.toFixed(2)}` : ""}
${dados.impostos.pis ? `- PIS: R$ ${dados.impostos.pis.toFixed(2)}` : ""}
${dados.impostos.cofins ? `- COFINS: R$ ${dados.impostos.cofins.toFixed(2)}` : ""}
${dados.impostos.ipi ? `- IPI: R$ ${dados.impostos.ipi.toFixed(2)}` : ""}
${dados.impostos.iss ? `- ISS: R$ ${dados.impostos.iss.toFixed(2)}` : ""}
- TOTAL IMPOSTOS: R$ ${total.impostosTotal.toFixed(2)}
`;
  })
  .join("\n")}

FORMATO DO E-MAIL SOLICITADO:

Prezado(a) Sr(a). ${empresa.responsavel},

Espero que esteja bem.

Finalizado a apuração desse mês, venho por meio deste apresentar a análise financeira e tributária detalhada referente ao período de ${primeiroMes} a ${ultimoMes}.

[INSIRA AQUI A ANÁLISE COMPLETA COM:]

1. SAUDAÇÃO INICIAL FORMAL
2. ANÁLISE HORIZONTAL (variação entre meses) com percentuais detalhados
3. ANÁLISE VERTICAL (composição por atividade) com distribuição percentual
4. ANÁLISE TRIBUTÁRIA DETALHADA com evolução da carga tributária
5. ANÁLISE DE MARGEM E RENTABILIDADE
6. PRINCIPAIS INDICADORES E MÉTRICAS
7. PONTOS DE ATENÇÃO IDENTIFICADOS
8. CONSIDERAÇÕES FINAIS

[FORMATO ESPECÍFICO:]
- Use linguagem formal e profissional de e-mail corporativo
- Não use markdown, tabelas com | ou qualquer formatação técnica
- Use parágrafos bem estruturados e de fácil leitura
- Inclua todos os cálculos percentuais no texto de forma natural
- Seja direto e objetivo, mas completo na análise
- Use expressões como "Observamos uma variação de", "Verificamos que", "Identificamos"
- Termine com uma conclusão clara e disponibilidade para esclarecimentos

Atenciosamente,

Claudenir Laurindo Nojosa


Gere o e-mail completo em português brasileiro, pronto para ser copiado e enviado diretamente ao cliente.
    `.trim();

      console.log("Prompt enviado para análise:", prompt);

      const response = await fetch("/api/gerar-analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          empresaId: empresaSelecionada,
          usuarioId: session?.user?.id,
          mesReferencia: mesReferenciaSelecionado,
          dadosApuracao: dadosApuracao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na API");
      }

      const data = await response.json();
      setAnalise(data.analise);

      if (data.salvoNoBanco) {
        toast.success("Análise gerada e salva com sucesso!");
      } else {
        toast.success("Análise gerada com sucesso!");
      }

      // Atualizar histórico com dados do banco
      await carregarHistoricoAnalises();
    } catch (error) {
      console.error("Erro:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar análise"
      );
      setAnalise(`Prezado(a),...`);
    } finally {
      setCarregandoAnalise(false);
    }
  };

  const carregarHistoricoAnalises = async () => {
    try {
      const response = await fetch(
        `/api/analises?empresaId=${empresaSelecionada}`
      );
      if (response.ok) {
        const analises = await response.json();
        setHistoricoAnalises(
          analises.map((a: any) => ({
            empresa: a.empresa.razaoSocial,
            data: new Date(a.createdAt).toLocaleDateString("pt-BR"),
            analise: a.analiseTexto,
          }))
        );
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const carregarAnaliseDoHistorico = (analiseSalva: string) => {
    setAnalise(analiseSalva);
    setMostrarHistorico(false);
    toast.success("Análise carregada do histórico");
  };

  // Buscar empresas apenas uma vez quando a sessão estiver carregada
  const fetchEmpresas = useCallback(async () => {
    if (empresasCarregadas || !session?.user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/empresas?responsavel=CLAUDENIR");
      if (!response.ok) {
        throw new Error("Erro ao buscar empresas");
      }
      const empresasData = await response.json();
      setEmpresas(empresasData);
      setEmpresasCarregadas(true);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }, [session, empresasCarregadas]);

  useEffect(() => {
    if (status === "authenticated" && !empresasCarregadas) {
      fetchEmpresas();
    }

    if (empresaSelecionada) {
      carregarHistoricoAnalises();
    }
  }, [status, empresasCarregadas, fetchEmpresas, empresaSelecionada]);

  const handleAtividadeChange = (atividade: Atividade) => {
    setAtividadesSelecionadas((prev) => {
      if (prev.includes(atividade)) {
        return prev.filter((a) => a !== atividade);
      } else {
        return [...prev, atividade];
      }
    });
  };

  const handleInputChange = (
    mesIndex: number,
    campo:
      | keyof DadosApuracao
      | keyof DadosApuracao["impostos"]
      | `faturamento.${Atividade}`,
    valor: string
  ) => {
    const novosDados = [...dadosApuracao];

    // Garantir que temos um objeto para este mês com o mes correto
    if (!novosDados[mesIndex]) {
      novosDados[mesIndex] = {
        mes: meses[mesIndex].value,
        faturamento: {},
        totalCompras: 0,
        impostos: {},
      };
    }

    const numValor = parseFloat(valor) || 0;

    if (campo === "totalCompras") {
      novosDados[mesIndex][campo] = numValor;
    } else if (campo.startsWith("faturamento.")) {
      const tipoAtividade = campo.split(".")[1] as Atividade;
      novosDados[mesIndex].faturamento = {
        ...novosDados[mesIndex].faturamento,
        [tipoAtividade]: numValor,
      };
    } else {
      // É um campo de imposto
      novosDados[mesIndex].impostos = {
        ...novosDados[mesIndex].impostos,
        [campo]: numValor,
      };
    }

    setDadosApuracao(novosDados);
  };

  const formatarRegimeTributario = (regime: string): string => {
    const formatacoes: { [key: string]: string } = {
      SIMPLES_NACIONAL: "Simples Nacional",
      LUCRO_PRESUMIDO: "Lucro Presumido",
      LUCRO_REAL: "Lucro Real",
    };

    return formatacoes[regime.toUpperCase()] || regime;
  };

  const getTipoRegime = (regime: string): "simples" | "presumido" | "real" => {
    if (regime.toLowerCase().includes("simples")) return "simples";
    if (regime.toLowerCase().includes("presumido")) return "presumido";
    if (regime.toLowerCase().includes("real")) return "real";
    return "simples"; // default
  };

  const copiarParaAreaTransferencia = () => {
    navigator.clipboard.writeText(analise);
    toast.success("Análise copiada para a área de transferência!");
  };

  const empresa = empresas.find((e) => e.id === empresaSelecionada);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Análise Tributária
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gere análises completas para seus clientes
            </p>
          </div>
        </div>

        {historicoAnalises.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setMostrarHistorico(!mostrarHistorico)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            {mostrarHistorico ? "Ocultar" : "Histórico"}
          </Button>
        )}
      </div>

      {mostrarHistorico && (
        <Card className="mb-6 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Análises Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {historicoAnalises.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{item.empresa}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.data}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => carregarAnaliseDoHistorico(item.analise)}
                      className="h-8 px-2"
                    >
                      Carregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de entrada de dados */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Dados para Análise
            </CardTitle>
            <CardDescription className="text-sm">
              Selecione a empresa e informe os dados dos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-64 w-full bg-gray-200 dark:bg-gray-800" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Selecione a Empresa</Label>
                  <Select
                    value={empresaSelecionada}
                    onValueChange={(value) => {
                      setEmpresaSelecionada(value);
                      setAtividadesSelecionadas([]);
                      setDadosApuracao([]);
                      setMeses([]);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:ring-gray-500">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.razaoSocial} -{" "}
                          {formatarRegimeTributario(empresa.regimeTributacao)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {empresaSelecionada && empresa && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatarRegimeTributario(empresa.regimeTributacao)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs"
                      >
                        <MapPin className="h-3 w-3" />
                        {empresa.uf}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      Responsável: {empresa.responsavel}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">
                        Tipos de Atividade
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="comercio"
                            checked={atividadesSelecionadas.includes(
                              "comercio"
                            )}
                            onCheckedChange={() =>
                              handleAtividadeChange("comercio")
                            }
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor="comercio"
                            className="flex items-center gap-1 text-sm"
                          >
                            <Store className="h-3 w-3" />
                            Comércio
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="industria"
                            checked={atividadesSelecionadas.includes(
                              "industria"
                            )}
                            onCheckedChange={() =>
                              handleAtividadeChange("industria")
                            }
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor="industria"
                            className="flex items-center gap-1 text-sm"
                          >
                            <Factory className="h-3 w-3" />
                            Indústria
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="servicos"
                            checked={atividadesSelecionadas.includes(
                              "servicos"
                            )}
                            onCheckedChange={() =>
                              handleAtividadeChange("servicos")
                            }
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor="servicos"
                            className="flex items-center gap-1 text-sm"
                          >
                            <Wrench className="h-3 w-3" />
                            Serviços
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Adicionar Novo Mês */}
                    <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <h4 className="text-sm font-medium">
                        Adicionar Novo Mês
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={novoMes} onValueChange={setNovoMes}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {mesesDoAno.map((mes) => (
                              <SelectItem key={mes} value={mes.toLowerCase()}>
                                {mes}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={novoAno} onValueChange={setNovoAno}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {anosDisponiveis.map((ano) => (
                              <SelectItem key={ano} value={ano}>
                                {ano}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={adicionarMes}
                        className="w-full mt-1 h-8 text-sm"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Mês
                      </Button>
                    </div>

                    {meses.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Mês de Referência da Análise
                        </Label>
                        <Select
                          value={mesSelecionado}
                          onValueChange={(value) => {
                            setMesSelecionado(value);
                            setMesReferenciaSelecionado(value);
                          }}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:ring-gray-500 text-sm">
                            <SelectValue placeholder="Selecione o mês de referência" />
                          </SelectTrigger>
                          <SelectContent>
                            {meses.map((mes) => (
                              <SelectItem key={mes.value} value={mes.value}>
                                {mes.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Este será o mês principal da análise
                        </p>
                      </div>
                    )}

                    {/* Dados por Mês */}
                    {meses.length > 0 && atividadesSelecionadas.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Dados por Mês
                        </h3>

                        {meses.map((mes, index) => (
                          <div
                            key={mes.value}
                            className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden"
                          >
                            <button
                              onClick={() => toggleExpandMonth(mes.value)}
                              className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-green-950/25 hover:bg-gray-100 dark:hover:bg-green-950/70 transition-colors"
                            >
                              <span className="text-sm font-medium">
                                {mes.label}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${expandedMonths[mes.value] ? "rotate-180" : ""}`}
                              />
                            </button>

                            {expandedMonths[mes.value] && (
                              <div className="p-3 space-y-3">
                                <div className="space-y-2">
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Faturamento por Atividade
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {atividadesSelecionadas.includes(
                                      "comercio"
                                    ) && (
                                      <div className="space-y-1">
                                        <Label className="text-xs flex items-center gap-1">
                                          <Store className="h-3 w-3" />
                                          Comércio
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0,00"
                                          className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                          onChange={(e) =>
                                            handleInputChange(
                                              index,
                                              "faturamento.comercio",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                    {atividadesSelecionadas.includes(
                                      "industria"
                                    ) && (
                                      <div className="space-y-1">
                                        <Label className="text-xs flex items-center gap-1">
                                          <Factory className="h-3 w-3" />
                                          Indústria
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0,00"
                                          className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                          onChange={(e) =>
                                            handleInputChange(
                                              index,
                                              "faturamento.industria",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                    {atividadesSelecionadas.includes(
                                      "servicos"
                                    ) && (
                                      <div className="space-y-1">
                                        <Label className="text-xs flex items-center gap-1">
                                          <Wrench className="h-3 w-3" />
                                          Serviços
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="0,00"
                                          className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                          onChange={(e) =>
                                            handleInputChange(
                                              index,
                                              "faturamento.servicos",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    Total de Compras
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder="0,00"
                                    className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "totalCompras",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    {getTipoRegime(empresa.regimeTributacao) ===
                                    "simples"
                                      ? "Valor do Simples Nacional"
                                      : "Impostos (opcional)"}
                                  </Label>

                                  {getTipoRegime(empresa.regimeTributacao) ===
                                  "simples" ? (
                                    <Input
                                      type="number"
                                      placeholder="0,00"
                                      className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                      onChange={(e) =>
                                        handleInputChange(
                                          index,
                                          "simples",
                                          e.target.value
                                        )
                                      }
                                    />
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        type="number"
                                        placeholder="ICMS"
                                        className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "icms",
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Input
                                        type="number"
                                        placeholder="PIS"
                                        className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "pis",
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Input
                                        type="number"
                                        placeholder="COFINS"
                                        className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "cofins",
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Input
                                        type="number"
                                        placeholder="IPI"
                                        className="border-gray-300 dark:border-gray-600 text-sm h-8"
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "ipi",
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Input
                                        type="number"
                                        placeholder="ISS"
                                        className="border-gray-300 dark:border-gray-600 text-sm h-8 col-span-2"
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "iss",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  )}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs h-7"
                                  onClick={() => removerMes(mes.value)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remover Mês
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={gerarAnaliseTributaria}
              disabled={
                !empresaSelecionada ||
                atividadesSelecionadas.length === 0 ||
                meses.length === 0 ||
                carregandoAnalise
              }
              className="w-full"
            >
              {carregandoAnalise ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Gerando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Gerar Análise
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        {/* Painel de Resultado */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Análise Gerada
              <Badge variant="secondary" className="ml-2">
                Claude
              </Badge>
            </CardTitle>
            <CardDescription>
              {empresa
                ? `Análise para ${empresa.razaoSocial}`
                : "Selecione uma empresa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregandoAnalise ? (
              <div className="space-y-4 py-8 text-center">
                <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
                <p className="text-sm text-gray-500">
                  Gerando análise inteligente...
                </p>
              </div>
            ) : analise ? (
              <div className=" p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div
                    className="analise-tributaria-content whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{
                      __html: analise
                        .replace(/\n/g, "<br />")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Preencha os dados à esquerda e clique em "Gerar Análise" para
                  obter uma análise completa com recomendações personalizadas.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              onClick={copiarParaAreaTransferencia}
              disabled={!analise}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Análise
            </Button>
            {analise && (
              <Button
                onClick={() => {
                  const blob = new Blob([analise], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `analise-${empresa?.razaoSocial || "empresa"}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
