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
  ArrowLeftRight,
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
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<
    Atividade[]
  >([]);
  const [dadosApuracao, setDadosApuracao] = useState<DadosApuracao[]>([]);
  const [analise, setAnalise] = useState<string>("");
  const [carregandoAnalise, setCarregandoAnalise] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [empresasCarregadas, setEmpresasCarregadas] = useState<boolean>(false);
  const [historicoAnalises, setHistoricoAnalises] = useState<
    { empresa: string; data: string; analise: string }[]
  >([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const gerarAnaliseTributaria = async () => {
    if (!empresaSelecionada) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    if (atividadesSelecionadas.length === 0) {
      toast.error("Selecione pelo menos uma atividade");
      return;
    }

    if (
      dadosApuracao.length === 0 ||
      dadosApuracao.some((dados) => {
        const totalVendas = calcularTotalVendas(dados);
        return !totalVendas && !dados.totalCompras;
      })
    ) {
      toast.error("Preencha os dados de pelo menos um mês");
      return;
    }

    try {
      setCarregandoAnalise(true);

      const empresa = empresas.find((e) => e.id === empresaSelecionada);
      if (!empresa) return;

      // Construir prompt detalhado para o ChatGPT
      const prompt = criarPromptAnalise(
        empresa,
        atividadesSelecionadas,
        dadosApuracao
      );

      // Chamar a API para gerar a análise com ChatGPT
      const response = await fetch("/api/gerar-analise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar análise");
      }

      const data = await response.json();

      if (!data.analise) {
        throw new Error("Resposta da API vazia");
      }

      setAnalise(data.analise);

      // Salvar no histórico
      setHistoricoAnalises((prev) => [
        ...prev,
        {
          empresa: empresa.razaoSocial,
          data: new Date().toLocaleString("pt-BR"),
          analise: data.analise,
        },
      ]);

      toast.success("Análise gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      toast.error("Erro ao gerar análise tributária");
    } finally {
      setCarregandoAnalise(false);
    }
  };

  const criarPromptAnalise = (
    empresa: Empresa,
    atividades: Atividade[],
    dados: DadosApuracao[]
  ): string => {
    const regime = getTipoRegime(empresa.regimeTributacao);
    const formatarValor = (valor: number) =>
      valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    let prompt = `
ANÁLISE TRIBUTÁRIA DETALHADA

EMPRESA:
- Razão Social: ${empresa.razaoSocial}
- CNPJ: ${empresa.cnpj}
- UF: ${empresa.uf}
- Regime Tributário: ${formatarRegimeTributario(empresa.regimeTributacao)}
- Responsável: ${empresa.responsavel}

ATIVIDADES: ${atividades.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")}

DADOS FINANCEIROS POR MÊS:
`;

    dados.forEach((dadosMes) => {
      const totalVendas = calcularTotalVendas(dadosMes);
      prompt += `
${dadosMes.mes.toUpperCase()}:
- Faturamento Total: ${formatarValor(totalVendas)}
${atividades
  .map(
    (atividade) =>
      `- Faturamento ${atividade.charAt(0).toUpperCase() + atividade.slice(1)}: ${formatarValor(dadosMes.faturamento[atividade] || 0)}`
  )
  .join("\n")}
- Compras: ${formatarValor(dadosMes.totalCompras || 0)}
`;

      if (regime === "simples") {
        prompt += `- Simples Nacional: ${formatarValor(dadosMes.impostos.simples || 0)}\n`;
      } else {
        prompt += `- ICMS: ${formatarValor(dadosMes.impostos.icms || 0)}\n`;
        prompt += `- PIS: ${formatarValor(dadosMes.impostos.pis || 0)}\n`;
        prompt += `- COFINS: ${formatarValor(dadosMes.impostos.cofins || 0)}\n`;
        if (dadosMes.impostos.ipi)
          prompt += `- IPI: ${formatarValor(dadosMes.impostos.ipi)}\n`;
        if (dadosMes.impostos.iss)
          prompt += `- ISS: ${formatarValor(dadosMes.impostos.iss)}\n`;
      }
    });

    prompt += `

INSTRUÇÕES PARA ANÁLISE:

Por favor, forneça uma análise tributária completa incluindo:

1. RESUMO EXECUTIVO
   - Visão geral da situação tributária
   - Principais indicadores
   - Tendências observadas

2. ANÁLISE COMPARATIVA MENSAL
   - Evolução do faturamento por atividade
   - Variação dos impostos
   - Comparativo entre meses

3. CÁLCULO DE PERCENTUAIS TRIBUTÁRIOS
   - Carga tributária efetiva
   - Comparativo com média do setor
   - Análise por tipo de atividade

4. OPORTUNIDADES DE ECONOMIA TRIBUTÁRIA
   - Sugestões específicas para o regime ${formatarRegimeTributario(empresa.regimeTributacao)}
   - Possíveis créditos fiscais
   - Estratégias de planejamento tributário

5. PONTOS DE ATENÇÃO
   - Possíveis irregularidades
   - Riscos fiscais identificados
   - Obrigações acessórias pendentes

6. RECOMENDAÇÕES ESPECÍFICAS
   - Ações imediatas
   - Estratégias de longo prazo
   - Sugestões para cada atividade

7. PRÓXIMOS PASSOS
   - Cronograma de implementação
   - Documentação necessária
   - Prazos importantes

Use tabelas para comparar valores mensais quando apropriado.
Seja específico com referências à legislação tributária brasileira.
Destaque oportunidades de economia com base nas atividades exercidas.
`;

    return prompt;
  };

  const carregarAnaliseDoHistorico = (analiseSalva: string) => {
    setAnalise(analiseSalva);
    setMostrarHistorico(false);
    toast.success("Análise carregada do histórico");
  };
  // Meses para os inputs
  const meses = [
    { value: "agosto", label: "Agosto/2023" },
    { value: "setembro", label: "Setembro/2023" },
    { value: "outubro", label: "Outubro/2023" },
  ];

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
  }, [status, empresasCarregadas, fetchEmpresas]);

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

    // Garantir que temos um objeto para este mês
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

  const calcularTotalVendas = (dados: DadosApuracao): number => {
    return Object.values(dados.faturamento || {}).reduce(
      (acc, curr) => acc + (curr || 0),
      0
    );
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
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeftRight className="h-5 w-5 rotate-90" />
          </Button>
          <h1 className="text-3xl font-bold dark:text-emerald-100">
            Análise Tributária Inteligente
          </h1>
        </div>

        {historicoAnalises.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setMostrarHistorico(!mostrarHistorico)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {mostrarHistorico ? "Ocultar Histórico" : "Ver Histórico"}
          </Button>
        )}
      </div>

      {mostrarHistorico && (
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-emerald-800 dark:text-emerald-100">
              <FileText className="h-5 w-5 inline mr-2" />
              Análises Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicoAnalises.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg border-emerald-100 dark:border-emerald-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.empresa}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.data}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => carregarAnaliseDoHistorico(item.analise)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Painel de entrada de dados */}
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100">
              <Building className="h-5 w-5 text-emerald-500" />
              Dados para Análise
            </CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-300">
              Selecione a empresa e informe os dados dos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-64 w-full bg-gray-200 dark:bg-gray-800" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Selecione a Empresa
                  </label>
                  <Select
                    value={empresaSelecionada}
                    onValueChange={(value) => {
                      setEmpresaSelecionada(value);
                      setAtividadesSelecionadas([]);
                      setDadosApuracao([]);
                    }}
                  >
                    <SelectTrigger className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 focus:ring-emerald-500">
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
                    <div className="grid grid-cols-2 gap-3">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                        {formatarRegimeTributario(empresa.regimeTributacao)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        {empresa.uf}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <User className="h-4 w-4" />
                      Responsável: {empresa.responsavel}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
                        Tipos de Atividade
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="comercio"
                            checked={atividadesSelecionadas.includes(
                              "comercio"
                            )}
                            onCheckedChange={() =>
                              handleAtividadeChange("comercio")
                            }
                          />
                          <Label
                            htmlFor="comercio"
                            className="flex items-center gap-1"
                          >
                            <Store className="h-4 w-4" />
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
                          />
                          <Label
                            htmlFor="industria"
                            className="flex items-center gap-1"
                          >
                            <Factory className="h-4 w-4" />
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
                          />
                          <Label
                            htmlFor="servicos"
                            className="flex items-center gap-1"
                          >
                            <Wrench className="h-4 w-4" />
                            Serviços
                          </Label>
                        </div>
                      </div>
                    </div>

                    {atividadesSelecionadas.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Dados por Mês
                        </h3>

                        {meses.map((mes, index) => (
                          <div
                            key={mes.value}
                            className="p-4 border border-emerald-100 dark:border-emerald-800 rounded-lg space-y-3"
                          >
                            <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
                              {mes.label}
                            </h4>

                            <div className="space-y-3">
                              <h5 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Faturamento por Atividade
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {atividadesSelecionadas.includes(
                                  "comercio"
                                ) && (
                                  <div className="space-y-2">
                                    <label className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <Store className="h-3 w-3" />
                                      Comércio
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0,00"
                                      className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                  <div className="space-y-2">
                                    <label className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <Factory className="h-3 w-3" />
                                      Indústria
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0,00"
                                      className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                  <div className="space-y-2">
                                    <label className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <Wrench className="h-3 w-3" />
                                      Serviços
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0,00"
                                      className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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

                            <div className="space-y-2">
                              <label className="text-sm text-emerald-600 dark:text-emerald-400">
                                Total de Compras
                              </label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
                                onChange={(e) =>
                                  handleInputChange(
                                    index,
                                    "totalCompras",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm text-emerald-600 dark:text-emerald-400">
                                {getTipoRegime(empresa.regimeTributacao) ===
                                "simples"
                                  ? "Valor do Simples Nacional"
                                  : "Impostos (opcional)"}
                              </label>

                              {getTipoRegime(empresa.regimeTributacao) ===
                              "simples" ? (
                                <Input
                                  type="number"
                                  placeholder="0,00"
                                  className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
                                  onChange={(e) =>
                                    handleInputChange(
                                      index,
                                      "simples",
                                      e.target.value
                                    )
                                  }
                                />
                              ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    type="number"
                                    placeholder="ICMS"
                                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
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
                                    className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 col-span-2"
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
                carregandoAnalise
              }
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md"
            >
              {carregandoAnalise ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Gerando análise...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Gerar Análise Tributária
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Painel de resultado melhorado */}
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Análise Inteligente
              <Badge
                variant="outline"
                className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                ChatGPT
              </Badge>
            </CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-300">
              {empresa
                ? `Análise especializada para ${empresa.razaoSocial}`
                : "Selecione uma empresa para gerar a análise"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregandoAnalise ? (
              <div className="space-y-4 py-8">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-emerald-500 animate-pulse" />
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Gerando análise inteligente...
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                    Isso pode levar alguns segundos
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              </div>
            ) : analise ? (
              <div className="bg-emerald-50 dark:bg-gray-800 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="prose prose-emerald max-w-none dark:prose-invert">
                  <div
                    className="analise-tributaria-content"
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
              <div className="text-center py-12 text-emerald-600 dark:text-emerald-400">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Sparkles className="h-12 w-12 text-emerald-500" />
                    <TrendingUp className="h-6 w-6 text-blue-500 absolute -right-2 -bottom-1" />
                  </div>
                </div>
                <h3 className="font-medium text-lg mb-2">
                  Análise Tributária Inteligente
                </h3>
                <p className="max-w-md mx-auto">
                  Preencha os dados à esquerda e clique em "Gerar Análise" para
                  obter uma análise completa com recomendações personalizadas da
                  nossa IA especializada.
                </p>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Dica:</strong> Quanto mais dados você fornecer,
                      mais precisa será a análise da nossa IA especializada em
                      tributação brasileira.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              onClick={copiarParaAreaTransferencia}
              disabled={!analise}
              variant="outline"
              className="w-full border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Análise
            </Button>
            {analise && (
              <Button
                onClick={() => {
                  const blob = new Blob([analise], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `analise-tributaria-${empresa?.razaoSocial || "empresa"}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <FileText className="mr-2 h-4 w-4" />
                Exportar como TXT
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
