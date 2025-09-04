// app/dashboard/emails/page.tsx
"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

type Empresa = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  uf: string;
  regimeTributacao: string;
  responsavel: string;
};

type DadosApuracao = {
  mes: string;
  totalCompras: number;
  totalVendas: number;
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
  const { data: session } = useSession();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [dadosApuracao, setDadosApuracao] = useState<DadosApuracao[]>([]);
  const [analise, setAnalise] = useState<string>("");
  const [carregandoAnalise, setCarregandoAnalise] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Meses para os inputs
  const meses = [
    { value: "agosto", label: "Agosto/2023" },
    { value: "setembro", label: "Setembro/2023" },
    { value: "outubro", label: "Outubro/2023" },
  ];

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/empresas?responsavel=CLAUDENIR");
        if (!response.ok) {
          throw new Error("Erro ao buscar empresas");
        }
        const empresasData = await response.json();
        setEmpresas(empresasData);
      } catch (error) {
        console.error("Erro ao buscar empresas:", error);
        toast.error("Erro ao carregar empresas");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchEmpresas();
    }
  }, [session]);

  const handleInputChange = (
    mesIndex: number,
    campo: keyof DadosApuracao | keyof DadosApuracao["impostos"],
    valor: string
  ) => {
    const novosDados = [...dadosApuracao];

    // Garantir que temos um objeto para este mês
    if (!novosDados[mesIndex]) {
      novosDados[mesIndex] = {
        mes: meses[mesIndex].value,
        totalCompras: 0,
        totalVendas: 0,
        impostos: {},
      };
    }

    const numValor = parseFloat(valor) || 0;

    if (campo === "totalCompras" || campo === "totalVendas") {
      novosDados[mesIndex][campo] = numValor;
    } else {
      // É um campo de imposto
      novosDados[mesIndex].impostos = {
        ...novosDados[mesIndex].impostos,
        [campo]: numValor,
      };
    }

    setDadosApuracao(novosDados);
  };

  const getTipoRegime = (regime: string): "simples" | "presumido" | "real" => {
    if (regime.toLowerCase().includes("simples")) return "simples";
    if (regime.toLowerCase().includes("presumido")) return "presumido";
    if (regime.toLowerCase().includes("real")) return "real";
    return "simples"; // default
  };

  const gerarAnaliseTributaria = async () => {
    if (!empresaSelecionada) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    if (
      dadosApuracao.length === 0 ||
      dadosApuracao.some((d) => !d.totalCompras && !d.totalVendas)
    ) {
      toast.error("Preencha os dados de pelo menos um mês");
      return;
    }

    try {
      setCarregandoAnalise(true);

      // Encontrar a empresa selecionada
      const empresa = empresas.find((e) => e.id === empresaSelecionada);
      if (!empresa) return;

      // Construir o prompt para o ChatGPT
      const prompt = `
        Gere uma análise tributária detalhada para a empresa ${empresa.razaoSocial} (CNPJ: ${empresa.cnpj}), 
        localizada em ${empresa.uf}, sob o regime de ${empresa.regimeTributacao}.
        
        Dados dos últimos 3 meses:
        ${dadosApuracao
          .map(
            (dados) => `
          ${dados.mes.charAt(0).toUpperCase() + dados.mes.slice(1)}/2023:
          - Faturamento: R$ ${dados.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          - Compras: R$ ${dados.totalCompras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          ${
            getTipoRegime(empresa.regimeTributacao) === "simples"
              ? `- Simples Nacional: R$ ${(dados.impostos.simples || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : `
            - ICMS: R$ ${(dados.impostos.icms || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            - PIS: R$ ${(dados.impostos.pis || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            - COFINS: R$ ${(dados.impostos.cofins || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            ${dados.impostos.ipi ? `- IPI: R$ ${dados.impostos.ipi.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
            ${dados.impostos.iss ? `- ISS: R$ ${dados.impostos.iss.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
          `
          }
        `
          )
          .join("\n")}

        Forneça uma análise completa incluindo:
        1. Resumo executivo
        2. Análise comparativa por mês
        3. Percentuais de carga tributária
        4. Recomendações específicas para o regime ${empresa.regimeTributacao}
        5. Possíveis oportunidades de economia tributária
        6. Próximos passos recomendados

        Formate a resposta em markdown com títulos e subtítulos.
      `;

      // Chamar a API para gerar a análise com ChatGPT
      const response = await fetch("/api/gerar-analise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar análise");
      }

      const data = await response.json();
      setAnalise(data.analise);
      toast.success("Análise gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar análise:", error);

      // Fallback: análise simulada caso a API falhe
      const empresa = empresas.find((e) => e.id === empresaSelecionada);
      if (empresa) {
        const analiseSimulada = gerarAnaliseSimulada(empresa);
        setAnalise(analiseSimulada);
        toast.success("Análise gerada com dados simulados");
      } else {
        toast.error("Erro ao gerar análise tributária");
      }
    } finally {
      setCarregandoAnalise(false);
    }
  };

  const gerarAnaliseSimulada = (empresa: Empresa): string => {
    return `
# Análise Tributária - ${empresa.razaoSocial}

## Período: Agosto a Outubro de 2023

### Resumo Executivo
Com base nos dados fornecidos, observamos que a empresa teve uma movimentação financeira significativa no trimestre analisado, com total de vendas acumulado de R$ ${dadosApuracao.reduce((acc, curr) => acc + curr.totalVendas, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e compras no valor de R$ ${dadosApuracao.reduce((acc, curr) => acc + curr.totalCompras, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.

### Análise por Período
${dadosApuracao
  .map(
    (dados) => `
**${dados.mes.charAt(0).toUpperCase() + dados.mes.slice(1)}/2023:**
- Faturamento: R$ ${dados.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Compras: R$ ${dados.totalCompras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- ${
      getTipoRegime(empresa.regimeTributacao) === "simples"
        ? `Imposto Simples: R$ ${(dados.impostos.simples || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : `ICMS: R$ ${(dados.impostos.icms || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, PIS: R$ ${(dados.impostos.pis || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, COFINS: R$ ${(dados.impostos.cofins || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    }
`
  )
  .join("\n")}

### Recomendações
1. Considerando o regime tributário (${empresa.regimeTributacao}), avalie a possibilidade de aproveitar créditos fiscais.
2. O percentual de impostos sobre o faturamento está em ${((dadosApuracao.reduce((acc, curr) => acc + (curr.impostos.simples || curr.impostos.icms || 0), 0) / dadosApuracao.reduce((acc, curr) => acc + curr.totalVendas, 0)) * 100).toFixed(2)}%, o que está dentro da média para o segmento.
3. Recomendamos uma revisão dos lançamentos fiscais para garantir que todos os créditos estão sendo devidamente aproveitados.

### Próximos Passos
Sugerimos agendar uma reunião para discutir oportunidades de otimização tributária e planejamento para o próximo trimestre.

*Atenciosamente,*  
*Equipe de Consultoria Tributária*
    `.trim();
  };

  const copiarParaAreaTransferencia = () => {
    navigator.clipboard.writeText(analise);
    toast.success("Análise copiada para a área de transferência!");
  };

  const empresa = empresas.find((e) => e.id === empresaSelecionada);

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ArrowLeftRight className="h-5 w-5 rotate-90" />
        </Button>
        <h1 className="text-3xl font-bold dark:text-emerald-100">
          Análise Tributária
        </h1>
      </div>

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
                    onValueChange={setEmpresaSelecionada}
                  >
                    <SelectTrigger className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.razaoSocial} - {empresa.regimeTributacao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {empresaSelecionada && empresa && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                        {empresa.regimeTributacao}
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

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm text-emerald-600 dark:text-emerald-400">
                                Total de Vendas
                              </label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800"
                                onChange={(e) =>
                                  handleInputChange(
                                    index,
                                    "totalVendas",
                                    e.target.value
                                  )
                                }
                              />
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
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={gerarAnaliseTributaria}
              disabled={!empresaSelecionada || carregandoAnalise}
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

        {/* Painel de resultado */}
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Análise Gerada
            </CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-300">
              {empresa
                ? `Análise para ${empresa.razaoSocial}`
                : "Selecione uma empresa para gerar a análise"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregandoAnalise ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800" />
              </div>
            ) : analise ? (
              <div className="bg-emerald-50 dark:bg-gray-800 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Textarea
                  readOnly
                  value={analise}
                  className="min-h-[400px] border-none bg-transparent text-emerald-800 dark:text-emerald-200 font-mono text-sm"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  A análise aparecerá aqui após preencher os dados e clicar em
                  "Gerar Análise Tributária"
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={copiarParaAreaTransferencia}
              disabled={!analise}
              variant="outline"
              className="w-full border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Análise
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
