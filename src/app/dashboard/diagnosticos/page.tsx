"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  Users,
  FileText,
  CheckCircle2,
  Circle,
  FileTextIcon,
  Plus,
  List,
} from "lucide-react";
import { toast } from "sonner";

// Interface para os dados da empresa baseada na API da ReceitaWS
interface Empresa {
  nome: string;
  fantasia: string;
  cnpj: string;
  tipo: string;
  porte: string;
  situacao: string;
  data_situacao: string;
  motivo_situacao: string;
  abertura: string;
  natureza_juridica: string;
  capital_social: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  atividade_principal: { code: string; text: string }[];
  atividades_secundarias: { code: string; text: string }[];
  qsa: { nome: string; qual: string }[];
  simples: { optante: boolean };
  ultima_atualizacao: string;
}

// Interface para o diagnóstico
interface Diagnostico {
  id: string;
  data: string;
  cnpj: string;
  nomeEmpresa: string;
  status: string;
}

// Interface para os dados do formulário
interface FormData {
  cnpj: string;
  empresa: Empresa | null;
  isPrestadorServico: boolean | null;
  isComercializacao: boolean | null;
  notasFiscais: Array<{
    id: number;
    descricao: string;
    valor: number;
    aliquota: number;
  }>;
  itensComerciais: Array<{
    id: number;
    descricao: string;
    ncm: string;
    valor: number;
  }>;
  obrigacoesAcessorias: Array<{
    id: string;
    descricao: string;
    status: string;
    vencimento: string;
  }>;
  parcelamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    parcelas: number;
  }>;
}

const DiagnosticoFiscal = () => {
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    cnpj: "",
    empresa: null,
    isPrestadorServico: null,
    isComercializacao: null,
    notasFiscais: [],
    itensComerciais: [],
    obrigacoesAcessorias: [],
    parcelamentos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dados mockados para diagnósticos existentes
  const diagnosticos: Diagnostico[] = [
    {
      id: "1",
      data: "2023-10-15",
      cnpj: "12.345.678/0001-90",
      nomeEmpresa: "Empresa ABC Ltda",
      status: "Concluído",
    },
    {
      id: "2",
      data: "2023-11-20",
      cnpj: "98.765.432/0001-10",
      nomeEmpresa: "Comércio XYZ S/A",
      status: "Em andamento",
    },
    {
      id: "3",
      data: "2023-12-05",
      cnpj: "11.223.344/0001-55",
      nomeEmpresa: "Serviços 123 ME",
      status: "Concluído",
    },
  ];

  const formatarCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.slice(0, 14);

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 2)}.${limited.slice(2)}`;
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
    } else if (limited.length <= 12) {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
    } else {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value);
    setFormData({ ...formData, cnpj: formatted });
  };

  // Função para buscar dados do CNPJ (simplificada para exemplo)
  const buscarCNPJ = async () => {
    const cnpjNumeros = formData.cnpj.replace(/\D/g, "");

    if (cnpjNumeros.length !== 14) {
      setError("CNPJ deve ter 14 dígitos");
      toast.error("CNPJ inválido", {
        description: "O CNPJ deve conter exatamente 14 dígitos.",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulação de busca de dados
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const data: Empresa = {
        nome: "Empresa Tech Verde LTDA",
        fantasia: "Tech Verde Solutions",
        cnpj: formData.cnpj,
        tipo: "MATRIZ",
        porte: "MEDIA EMPRESA",
        situacao: "ATIVA",
        data_situacao: "2020-05-15",
        motivo_situacao: "",
        abertura: "2020-05-15",
        natureza_juridica: "206-2 - Sociedade Empresária Limitada",
        capital_social: "100000.00",
        logradouro: "Rua das Inovações",
        numero: "123",
        complemento: "Sala 501",
        bairro: "Jardim Paulista",
        municipio: "São Paulo",
        uf: "SP",
        cep: "01234-567",
        telefone: "(11) 3456-7890",
        email: "contato@techverde.com.br",
        atividade_principal: [
          {
            code: "62.01-5-00",
            text: "Desenvolvimento de software",
          },
        ],
        atividades_secundarias: [],
        qsa: [
          {
            nome: "João Silva",
            qual: "Sócio-Administrador",
          },
        ],
        simples: { optante: true },
        ultima_atualizacao: new Date().toISOString(),
      };

      setFormData({ ...formData, empresa: data });
      setCurrentStep(2);
      toast.success("Dados carregados com sucesso", {
        description: `CNPJ: ${formData.cnpj}`,
      });
    } catch (err: any) {
      console.error("Erro ao buscar CNPJ:", err);
      setError(err.message || "Erro ao buscar dados. Tente novamente.");
      toast.error("Erro na consulta", {
        description: err.message || "Não foi possível consultar o CNPJ.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar diagnóstico
      toast.success("Diagnóstico concluído com sucesso!");
      setActiveTab("list");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswer = (answer: boolean, field: keyof FormData) => {
    setFormData({ ...formData, [field]: answer });

    // Se a resposta for não, pular para o próximo passo
    if (!answer && field === "isPrestadorServico" && currentStep === 3) {
      setTimeout(() => setCurrentStep(4), 500);
    } else if (!answer && field === "isComercializacao" && currentStep === 4) {
      setTimeout(() => setCurrentStep(5), 500);
    } else {
      setTimeout(handleNextStep, 500);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Passo 1: Consulta CNPJ</h3>
            <div className="space-y-2">
              <Label htmlFor="cnpj">Digite o CNPJ da empresa</Label>
              <div className="flex gap-2">
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  onClick={buscarCNPJ}
                  disabled={
                    loading || formData.cnpj.replace(/\D/g, "").length !== 14
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    "Consultar"
                  )}
                </Button>
              </div>
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Passo 2: Análise das CNAE's
            </h3>
            <div className="p-4 border rounded-md bg-muted">
              <h4 className="font-medium mb-2">Atividade Principal:</h4>
              <p>
                {formData.empresa?.atividade_principal[0]?.code} -{" "}
                {formData.empresa?.atividade_principal[0]?.text}
              </p>

              <h4 className="font-medium mt-4 mb-2">
                Regras Gerais de Tributação:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Enquadramento no Simples Nacional:{" "}
                  {formData.empresa?.simples.optante ? "Sim" : "Não"}
                </li>
                <li>Alíquota presumida: 6% sobre o faturamento</li>
                <li>Obrigações acessórias mensais: DAS, DME</li>
              </ul>
            </div>
            <Button onClick={handleNextStep}>Próximo</Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Passo 3: Emissão de Nota Fiscal de Serviço
            </h3>
            <p>
              A empresa é prestadora de serviços e emite notas fiscais de
              serviço?
            </p>
            <div className="flex gap-4">
              <Button onClick={() => handleAnswer(true, "isPrestadorServico")}>
                Sim
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswer(false, "isPrestadorServico")}
              >
                Não
              </Button>
            </div>

            {formData.isPrestadorServico && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Tabela de Notas Fiscais:</h4>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 p-2">Descrição</th>
                      <th className="border border-gray-300 p-2">Valor (R$)</th>
                      <th className="border border-gray-300 p-2">
                        Alíquota (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        Consultoria em TI
                      </td>
                      <td className="border border-gray-300 p-2">5.000,00</td>
                      <td className="border border-gray-300 p-2">6,00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        Desenvolvimento de Software
                      </td>
                      <td className="border border-gray-300 p-2">12.000,00</td>
                      <td className="border border-gray-300 p-2">6,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Passo 4: Análise Amostral dos Itens
            </h3>
            <p>A empresa comercializa ou industrializa produtos?</p>
            <div className="flex gap-4">
              <Button onClick={() => handleAnswer(true, "isComercializacao")}>
                Sim
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswer(false, "isComercializacao")}
              >
                Não
              </Button>
            </div>

            {formData.isComercializacao && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">
                  Tabela de Itens Comercializados:
                </h4>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 p-2">Descrição</th>
                      <th className="border border-gray-300 p-2">NCM</th>
                      <th className="border border-gray-300 p-2">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        Notebook Dell i7
                      </td>
                      <td className="border border-gray-300 p-2">8471.30.19</td>
                      <td className="border border-gray-300 p-2">3.500,00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        Monitor LED 24"
                      </td>
                      <td className="border border-gray-300 p-2">8528.52.00</td>
                      <td className="border border-gray-300 p-2">899,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Passo 5: Compliance das Obrigações Acessórias
            </h3>
            <div className="p-4 border rounded-md bg-muted">
              <h4 className="font-medium mb-2">
                Situação das Obrigações Acessórias:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>EFD Contribuições - Em dia</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>ECD - Pendente desde 10/2023</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>DCTF - Em dia</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>DIRF - Atrasada (exercício 2022)</span>
                </li>
              </ul>
            </div>
            <Button onClick={handleNextStep}>Próximo</Button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Passo 6: Parcelamentos</h3>
            <div className="p-4 border rounded-md bg-muted">
              <h4 className="font-medium mb-2">Parcelamentos em Andamento:</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>REFIS Federal</span>
                  <span>12/24 parcelas</span>
                </li>
                <li className="flex justify-between">
                  <span>PERT</span>
                  <span>6/12 parcelas</span>
                </li>
              </ul>

              <h4 className="font-medium mt-4 mb-2">
                Sugestão de Novos Parcelamentos:
              </h4>
              <ul className="list-disc pl-5">
                <li>
                  Dívida ativa da União: R$ 15.642,33 - 60x c/ 50% de desconto
                </li>
                <li>ICMS estadual: R$ 8.321,90 - 24x c/ 30% de desconto</li>
              </ul>
            </div>
            <Button onClick={handleNextStep}>Concluir Diagnóstico</Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDocumentPreview = () => {
    return (
      <div className="h-full border rounded-md bg-white p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">DIAGNÓSTICO FISCAL</h2>
          <p className="text-sm">
            {formData.empresa?.nome || "Nome da Empresa"}
          </p>
          <p className="text-sm">
            CNPJ: {formData.cnpj || "00.000.000/0000-00"}
          </p>
          <p className="text-sm">
            Data: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold border-b pb-1">1. Dados Cadastrais</h3>
            <p>Razão Social: {formData.empresa?.nome || "Não informado"}</p>
            <p>
              Nome Fantasia: {formData.empresa?.fantasia || "Não informado"}
            </p>
            <p>CNPJ: {formData.empresa?.cnpj || "Não informado"}</p>
            <p>
              Data de Abertura:{" "}
              {formData.empresa?.abertura
                ? new Date(formData.empresa.abertura).toLocaleDateString(
                    "pt-BR"
                  )
                : "Não informado"}
            </p>
            <p>Situação: {formData.empresa?.situacao || "Não informado"}</p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1">
              2. Análise de CNAE e Tributação
            </h3>
            <p>
              Atividade Principal:{" "}
              {formData.empresa?.atividade_principal[0]?.code} -{" "}
              {formData.empresa?.atividade_principal[0]?.text}
            </p>
            <p>
              Regime Tributário:{" "}
              {formData.empresa?.simples.optante
                ? "Simples Nacional"
                : "Lucro Presumido"}
            </p>
          </div>

          {formData.isPrestadorServico && (
            <div>
              <h3 className="font-bold border-b pb-1">
                3. Análise de Notas Fiscais de Serviço
              </h3>
              <p>
                A empresa emite notas fiscais de serviço com as seguintes
                características:
              </p>
              <p>• Tributação pelo Simples Nacional</p>
              <p>• Alíquota média aplicável: 6%</p>
            </div>
          )}

          {formData.isComercializacao && (
            <div>
              <h3 className="font-bold border-b pb-1">
                4. Análise de Itens Comercializados
              </h3>
              <p>
                A empresa comercializa produtos com as seguintes
                características:
              </p>
              <p>• NCMs variados conforme tabela anexa</p>
              <p>• Tributação conforme regime escolhido</p>
            </div>
          )}

          <div>
            <h3 className="font-bold border-b pb-1">
              5. Situação das Obrigações Acessórias
            </h3>
            <p>• EFD Contribuições: Em dia</p>
            <p>• ECD: Pendente desde 10/2023</p>
            <p>• DCTF: Em dia</p>
            <p>• DIRF: Atrasada (exercício 2022)</p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1">6. Parcelamentos</h3>
            <p>Parcelamentos em andamento:</p>
            <p>• REFIS Federal: 12/24 parcelas</p>
            <p>• PERT: 6/12 parcelas</p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1">Conclusão</h3>
            <p>
              O diagnóstico identificou pontos críticos que necessitam de
              atenção imediata, especialmente com relação às obrigações
              acessórias em atraso. Recomenda-se a regularização das pendências
              e a adoção de processos para evitar novos descumprimentos.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Diagnóstico Fiscal
          </h1>

          {activeTab === "list" ? (
            <Button
              onClick={() => setActiveTab("new")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Realizar Novo Diagnóstico
            </Button>
          ) : (
            <Button
              onClick={() => setActiveTab("list")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Ver Diagnósticos
            </Button>
          )}
        </div>

        {activeTab === "list" ? (
          <Card className="bg-transparent">
            <CardHeader>
              <CardTitle>Diagnósticos Realizados</CardTitle>
              <CardDescription>
                Lista de diagnósticos fiscais já realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticos.map((diagnostico) => (
                  <div
                    key={diagnostico.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileTextIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{diagnostico.nomeEmpresa}</p>
                        <p className="text-sm text-muted-foreground">
                          {diagnostico.cnpj}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {diagnostico.data}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${diagnostico.status === "Concluído" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {diagnostico.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Passo a passo */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Passo a Passo</CardTitle>
                <CardDescription>
                  Siga as etapas para realizar o diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`flex items-start gap-3 p-3 rounded-lg ${currentStep === step ? "bg-primary/10 border border-primary/20" : ""}`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full mt-1 ${currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {currentStep > step ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-medium">{step}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {step === 1 && "CNPJ - Consultando o CNPJ"}
                          {step === 2 &&
                            "Análise das CNAE's - Regras de Tributação"}
                          {step === 3 &&
                            "Análise de emissão de nota fiscal de serviço"}
                          {step === 4 && "Análise Amostral dos itens"}
                          {step === 5 && "Compliance das obrigações acessórias"}
                          {step === 6 && "Parcelamentos"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step === 1 &&
                            "Consulta dos dados cadastrais da empresa"}
                          {step === 2 &&
                            "Estudo das regras gerais de tributação da atividade"}
                          {step === 3 &&
                            "Verificação se é prestador de serviços"}
                          {step === 4 &&
                            "Verificação se comercializa ou industrializa produtos"}
                          {step === 5 &&
                            "O que consta em aberto nas obrigações acessórias"}
                          {step === 6 &&
                            "Análise de parcelamentos em andamento"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Formulário e Preview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Etapa {currentStep} de 6</CardTitle>
                  <CardDescription>
                    {currentStep === 1 && "Consulta de CNPJ"}
                    {currentStep === 2 && "Análise das CNAE's"}
                    {currentStep === 3 && "Emissão de Nota Fiscal de Serviço"}
                    {currentStep === 4 && "Análise Amostral dos Itens"}
                    {currentStep === 5 &&
                      "Compliance das Obrigações Acessórias"}
                    {currentStep === 6 && "Parcelamentos"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderStep()}

                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1}
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={currentStep === 1 && formData.empresa === null}
                    >
                      {currentStep === 6 ? "Concluir" : "Próximo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview do Documento</CardTitle>
                  <CardDescription>
                    Visualização do diagnóstico em formato Word
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 overflow-auto">
                  {renderDocumentPreview()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoFiscal;
