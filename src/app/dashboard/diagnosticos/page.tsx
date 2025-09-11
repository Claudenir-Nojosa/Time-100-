"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Edit,
  Trash2,
  FileUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";

interface DiagnosticoCompleto extends Diagnostico {
  formData: FormData;
}

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
// Interface para os dados do formulário
interface FormData {
  cnpj: string;
  empresa: Empresa | null;
  isPrestadorServico: boolean | null;
  isComercializacao: boolean | null;
  notasFiscais: Array<{
    id: number;
    descricao: string;
    cnae: string;
    codigoServico: string;
    valor: number;
    aliquota: number;
    municipio: string;
    retencoes: {
      irrf: boolean;
      csrf: boolean;
      inss: boolean;
      iss: boolean;
    };
  }>;
  itensTributacao: Array<{
    id: string;
    ncm: string;
    icms: number;
    baseLegalIcms: string;
    pisCofins: number;
    baseLegalPisCofins: string;
    ipi: number;
  }>;
  obrigacoesAcessorias: Array<{
    id: string;
    descricao: string;
    status: string;
    vencimento: string;
    competencia?: string;
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
  const [selectedDiagnostico, setSelectedDiagnostico] =
    useState<DiagnosticoCompleto | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "view" | "edit">("list");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    cnpj: "",
    empresa: null,
    isPrestadorServico: null,
    isComercializacao: null,
    notasFiscais: [],
    itensTributacao: [
      {
        id: "1",
        ncm: "",
        icms: 0,
        baseLegalIcms: "",
        pisCofins: 0,
        baseLegalPisCofins: "",
        ipi: 0,
      },
      {
        id: "2",
        ncm: "",
        icms: 0,
        baseLegalIcms: "",
        pisCofins: 0,
        baseLegalPisCofins: "",
        ipi: 0,
      },
      {
        id: "3",
        ncm: "",
        icms: 0,
        baseLegalIcms: "",
        pisCofins: 0,
        baseLegalPisCofins: "",
        ipi: 0,
      },
    ],
    obrigacoesAcessorias: [],
    parcelamentos: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [letterheadHTML, setLetterheadHTML] = useState<string>("");
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [notaFiscalDescricao, setNotaFiscalDescricao] = useState("");
  const [notaFiscalAliquota, setNotaFiscalAliquota] = useState("");
  const [obrigacaoDescricao, setObrigacaoDescricao] = useState("");
  const [obrigacaoStatus, setObrigacaoStatus] = useState("em-dia");
  const [obrigacaoVencimento, setObrigacaoVencimento] = useState("");
  const [obrigacaoCompetencia, setObrigacaoCompetencia] = useState("");
  const [obrigacaoDescricaoPersonalizada, setObrigacaoDescricaoPersonalizada] =
    useState("");
  const [parcelamentoDescricao, setParcelamentoDescricao] = useState("");
  const [parcelamentoValor, setParcelamentoValor] = useState("");
  const [parcelamentoParcelas, setParcelamentoParcelas] = useState("");
  const [notaFiscalCnae, setNotaFiscalCnae] = useState("");
  const [notaFiscalCodigoServico, setNotaFiscalCodigoServico] = useState("");
  const [retencoes, setRetencoes] = useState({
    irrf: false,
    irrfBaseLegal: "",
    csrf: false,
    csrfBaseLegal: "",
    inss: false,
    inssBaseLegal: "",
    iss: false,
    issBaseLegal: "",
  });
  const { data: session, status } = useSession();
  const exportarDocumento = async () => {
    const res = await fetch("/api/diagnostico/export", {
      method: "POST",
      body: JSON.stringify({ formData }),
      headers: { "Content-Type": "application/json" },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostico-${formData.cnpj}.docx`;
    a.click();
  };

  // Carregar diagnósticos salvos do localStorage
  useEffect(() => {
    const savedDiagnosticos = localStorage.getItem("diagnosticosFiscais");
    if (savedDiagnosticos) {
      setDiagnosticos(JSON.parse(savedDiagnosticos));
    }

    // Carregar papel timbrado salvo
    const savedLetterhead = localStorage.getItem("empresaLetterheadHTML");
    if (savedLetterhead) {
      setLetterheadHTML(savedLetterhead);
    }
  }, []);

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

  // Substitua a função buscarCNPJ por esta versão:
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
      // Opção 1: Usar API alternativa (BrasilAPI)
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumeros}`
      );

      if (!response.ok) {
        // Se a BrasilAPI falhar, tentar a ReceitaWS com proxy
        throw new Error("Não foi possível consultar o CNPJ");
      }

      const data = await response.json();

      // Mapear os dados da BrasilAPI para nossa interface
      const empresa: Empresa = {
        nome: data.razao_social,
        fantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        tipo: data.descricao_matriz_filial,
        porte: data.descricao_porte,
        situacao: data.descricao_situacao_cadastral,
        data_situacao: data.data_situacao_cadastral,
        motivo_situacao: data.motivo_situacao_cadastral,
        abertura: data.data_inicio_atividade,
        natureza_juridica: data.natureza_juridica,
        capital_social: data.capital_social?.toString() || "0",
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        telefone: data.ddd_telefone_1,
        email: data.email,
        atividade_principal: data.cnae_fiscal
          ? [
              {
                code: data.cnae_fiscal.toString(),
                text: data.cnae_fiscal_descricao,
              },
            ]
          : [],
        atividades_secundarias:
          data.cnaes_secundarios?.map((cnae: any) => ({
            code: cnae.codigo.toString(),
            text: cnae.descricao,
          })) || [],
        qsa:
          data.qsa?.map((socio: any) => ({
            nome: socio.nome_socio,
            qual: socio.descricao_qualificacao,
          })) || [],
        simples: {
          optante: data.opcao_pelo_simples || false,
        },
        ultima_atualizacao: new Date().toISOString(),
      };

      setFormData({ ...formData, empresa: empresa });
      setCurrentStep(2);
      toast.success("Dados carregados com sucesso", {
        description: `CNPJ: ${formData.cnpj}`,
      });
    } catch (err: any) {
      console.error("Erro ao buscar CNPJ:", err);

      // Oferecer opção de preenchimento manual
      setError(
        "Não foi possível consultar o CNPJ automaticamente. Preencha os dados manualmente."
      );

      toast.error("Erro na consulta", {
        description:
          "Não foi possível consultar o CNPJ. Preencha os dados manualmente.",
        action: {
          label: "Preencher Manualmente",
          onClick: () => {
            const empresaManual: Empresa = {
              nome: "",
              fantasia: "",
              cnpj: formData.cnpj,
              tipo: "",
              porte: "",
              situacao: "",
              data_situacao: "",
              motivo_situacao: "",
              abertura: "",
              natureza_juridica: "",
              capital_social: "0",
              logradouro: "",
              numero: "",
              complemento: "",
              bairro: "",
              municipio: "",
              uf: "",
              cep: "",
              telefone: "",
              email: "",
              atividade_principal: [],
              atividades_secundarias: [],
              qsa: [],
              simples: { optante: false },
              ultima_atualizacao: new Date().toISOString(),
            };
            setFormData({ ...formData, empresa: empresaManual });
            setCurrentStep(2);
          },
        },
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
      salvarDiagnostico();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função para carregar diagnóstico completo
  const carregarDiagnostico = async (id: string) => {
    try {
      const response = await fetch(`/api/diagnosticos/${id}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar diagnóstico");
      }

      const diagnostico = await response.json();
      setSelectedDiagnostico(diagnostico);
      setViewMode("view");
    } catch (error) {
      console.error("Erro ao carregar diagnóstico:", error);
      // Fallback para localStorage
      const savedDiagnosticos = localStorage.getItem("diagnosticosCompletos");
      if (savedDiagnosticos) {
        const diagnosticosCompletos = JSON.parse(savedDiagnosticos);
        const diagnostico = diagnosticosCompletos.find((d: any) => d.id === id);
        if (diagnostico) {
          setSelectedDiagnostico(diagnostico);
          setViewMode("view");
        }
      }
    }
  };

  // Função para editar diagnóstico
  const editarDiagnostico = (id: string) => {
    const savedDiagnosticos = localStorage.getItem("diagnosticosCompletos");
    if (savedDiagnosticos) {
      const diagnosticosCompletos: DiagnosticoCompleto[] =
        JSON.parse(savedDiagnosticos);
      const diagnostico = diagnosticosCompletos.find((d) => d.id === id);
      if (diagnostico) {
        setFormData(diagnostico.formData);
        setCurrentStep(1);
        setViewMode("list");
        setActiveTab("new");
      }
    }
  };

  // Função para excluir diagnóstico
  const excluirDiagnostico = async (id: string) => {
    try {
      const response = await fetch(`/api/diagnosticos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir diagnóstico");
      }

      // Atualizar lista local
      setDiagnosticos(diagnosticos.filter((d) => d.id !== id));

      // Remover do localStorage também
      const savedDiagnosticos = localStorage.getItem("diagnosticosCompletos");
      if (savedDiagnosticos) {
        const diagnosticosCompletos = JSON.parse(savedDiagnosticos);
        const updatedDiagnosticos = diagnosticosCompletos.filter(
          (d: any) => d.id !== id
        );
        localStorage.setItem(
          "diagnosticosCompletos",
          JSON.stringify(updatedDiagnosticos)
        );
      }

      toast.success("Diagnóstico excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir diagnóstico:", error);
      toast.error("Erro ao excluir diagnóstico");
    }
  };
  const handleAnswer = (answer: boolean, field: keyof FormData) => {
    setFormData({ ...formData, [field]: answer });

    // Lógica específica para a pergunta de prestador de serviço
    if (field === "isPrestadorServico" && currentStep === 3) {
      if (!answer) {
        // Se a resposta for não, pular para o próximo passo após 500ms
        setTimeout(() => setCurrentStep(4), 500);
      }
      // Se a resposta for sim, não faz nada (não avança)
      return;
    }
    // Lógica específica para a pergunta de comercialização
    else if (field === "isComercializacao" && currentStep === 4) {
      if (!answer) {
        // Se a resposta for não, pular para o próximo passo após 500ms
        setTimeout(() => setCurrentStep(5), 500);
      }
      // Se a resposta for sim, não faz nada (não avança)
      return;
    }
    // Para todas as outras perguntas, avança normalmente
    else {
      setTimeout(handleNextStep, 500);
    }
  };

  // Função para processar o upload do documento Word
  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLetterheadFile(file);
    setIsProcessingDoc(true);

    try {
      // Simulação de processamento (em um caso real, usaria a biblioteca mammoth)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // HTML simulado do papel timbrado
      const simulatedHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: #f9f9f9; border: 1px solid #ddd;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; font-size: 28px;">Tech Verde Solutions</h1>
            <p style="color: #555;">Sua parceira em soluções fiscais</p>
          </div>
          <div style="border-top: 2px solid #1e40af; padding-top: 20px;">
            {{CONTEUDO_DIAGNOSTICO}}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
            <p>Tech Verde Solutions - CNPJ: 12.345.678/0001-90</p>
            <p>Rua das Inovações, 123 - Jardim Paulista, São Paulo - SP</p>
            <p>Telefone: (11) 3456-7890 - Email: contato@techverde.com.br</p>
          </div>
        </div>
      `;

      // Salvar o HTML convertido
      setLetterheadHTML(simulatedHTML);
      localStorage.setItem("empresaLetterheadHTML", simulatedHTML);

      toast.success("Documento carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar documento:", error);
      toast.error("Erro ao processar documento", {
        description: "Não foi possível processar o arquivo Word.",
      });
    } finally {
      setIsProcessingDoc(false);
    }
  };

  // Função para adicionar novo item de tributação
  const adicionarItemTributacao = () => {
    const novoItem = {
      id: Date.now().toString(),
      ncm: "",
      icms: 0,
      baseLegalIcms: "",
      pisCofins: 0,
      baseLegalPisCofins: "",
      ipi: 0,
    };

    setFormData({
      ...formData,
      itensTributacao: [...formData.itensTributacao, novoItem],
    });
  };

  // Função para atualizar item de tributação
  const atualizarItemTributacao = (id: any, campo: any, valor: any) => {
    setFormData({
      ...formData,
      itensTributacao: formData.itensTributacao.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      ),
    });
  };

  // Função para remover item de tributação
  const removerItemTributacao = (id: any) => {
    setFormData({
      ...formData,
      itensTributacao: formData.itensTributacao.filter(
        (item) => item.id !== id
      ),
    });
  };

  // Função para adicionar obrigação acessória
  const adicionarObrigacaoAcessoria = () => {
    if (!obrigacaoDescricao || !obrigacaoVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Se for status pendente, verificar se tem competência
    if (obrigacaoStatus === "pendente" && !obrigacaoCompetencia) {
      toast.error("Para obrigações pendentes, informe a competência");
      return;
    }

    // Se selecionou "Outra", usar a descrição personalizada
    const descricaoFinal =
      obrigacaoDescricao === "Outra"
        ? obrigacaoDescricaoPersonalizada
        : obrigacaoDescricao;

    if (obrigacaoDescricao === "Outra" && !obrigacaoDescricaoPersonalizada) {
      toast.error("Digite a descrição da obrigação");
      return;
    }

    const novaObrigacao = {
      id: Date.now().toString(),
      descricao: descricaoFinal,
      status: obrigacaoStatus,
      vencimento: obrigacaoVencimento,
      competencia:
        obrigacaoStatus === "pendente" ? obrigacaoCompetencia : undefined,
    };

    setFormData({
      ...formData,
      obrigacoesAcessorias: [...formData.obrigacoesAcessorias, novaObrigacao],
    });

    // Reset dos campos
    setObrigacaoDescricao("");
    setObrigacaoStatus("em-dia");
    setObrigacaoVencimento("");
    setObrigacaoCompetencia("");
    setObrigacaoDescricaoPersonalizada("");

    toast.success("Obrigação acessória adicionada com sucesso!");
  };

  // Função para remover obrigação acessória
  const removerObrigacaoAcessoria = (id: string) => {
    setFormData({
      ...formData,
      obrigacoesAcessorias: formData.obrigacoesAcessorias.filter(
        (obrigacao) => obrigacao.id !== id
      ),
    });
  };

  // Função para adicionar parcelamento
  const adicionarParcelamento = () => {
    if (!parcelamentoDescricao || !parcelamentoValor || !parcelamentoParcelas) {
      toast.error("Preencha todos os campos do parcelamento");
      return;
    }

    const novoParcelamento = {
      id: Date.now().toString(),
      descricao: parcelamentoDescricao,
      valor: parseFloat(parcelamentoValor),
      parcelas: parseInt(parcelamentoParcelas),
    };

    setFormData({
      ...formData,
      parcelamentos: [...formData.parcelamentos, novoParcelamento],
    });

    setParcelamentoDescricao("");
    setParcelamentoValor("");
    setParcelamentoParcelas("");

    toast.success("Parcelamento adicionado com sucesso!");
  };

  // Função para remover parcelamento
  const removerParcelamento = (id: string) => {
    setFormData({
      ...formData,
      parcelamentos: formData.parcelamentos.filter(
        (parcelamento) => parcelamento.id !== id
      ),
    });
  };

  // Função para gerar o documento final preenchido
  const generateDocument = () => {
    if (!letterheadHTML) {
      toast.error("Papel timbrado não carregado");
      return null;
    }

    // Conteúdo do diagnóstico
    // Conteúdo do diagnóstico
    const diagnosticoContent = `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #1e40af; text-align: center; margin-bottom: 20px;">DIAGNÓSTICO FISCAL</h2>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">1. Dados Cadastrais</h3>
      <p><strong>Razão Social:</strong> ${formData.empresa?.nome || "Não informado"}</p>
      <p><strong>Nome Fantasia:</strong> ${formData.empresa?.fantasia || "Não informado"}</p>
      <p><strong>CNPJ:</strong> ${formData.empresa?.cnpj || "Não informado"}</p>
      <p><strong>Data de Abertura:</strong> ${
        formData.empresa?.abertura
          ? new Date(formData.empresa.abertura).toLocaleDateString("pt-BR")
          : "Não informado"
      }</p>
      <p><strong>Situação:</strong> ${formData.empresa?.situacao || "Não informado"}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">2. Análise de CNAE e Tributação</h3>
      <p><strong>Atividade Principal:</strong> ${formData.empresa?.atividade_principal[0]?.code || ""} - 
      ${formData.empresa?.atividade_principal[0]?.text || ""}</p>
      <p><strong>Regime Tributário:</strong> ${
        formData.empresa?.simples?.optante
          ? "Simples Nacional"
          : "Lucro Presumido"
      }</p>
    </div>
    
    ${
      formData.isPrestadorServico
        ? `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">3. Análise de Notas Fiscais de Serviço</h3>
      ${
        formData.notasFiscais.length > 0
          ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Valor (R$)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Alíquota (%)</th>
            </tr>
          </thead>
          <tbody>
            ${formData.notasFiscais
              .map(
                (nota) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${nota.descricao}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${nota.valor.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${nota.aliquota}%</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>Nenhuma nota fiscal cadastrada.</p>"
      }
    </div>
    `
        : ""
    }
    
    ${
      formData.isComercializacao
        ? `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">4. Análise de Tributação de Itens</h3>
      ${
        formData.itensTributacao.length > 0
          ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">NCM</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ICMS (%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Base Legal ICMS</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">PIS/COFINS (%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Base Legal PIS/COFINS</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">IPI (%)</th>
            </tr>
          </thead>
          <tbody>
            ${formData.itensTributacao
              .map(
                (item) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.ncm || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.icms || "0"}%</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.baseLegalIcms || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.pisCofins || "0"}%</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.baseLegalPisCofins || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.ipi || "0"}%</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>Nenhum item de tributação cadastrado.</p>"
      }
    </div>
    `
        : ""
    }
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">5. Situação das Obrigações Acessórias</h3>
      ${
        formData.obrigacoesAcessorias.length > 0
          ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${formData.obrigacoesAcessorias
              .map(
                (obrigacao) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${obrigacao.descricao}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${obrigacao.status}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(obrigacao.vencimento).toLocaleDateString("pt-BR")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>Nenhuma obrigação acessória cadastrada.</p>"
      }
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">6. Parcelamentos</h3>
      ${
        formData.parcelamentos.length > 0
          ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Valor (R$)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Parcelas</th>
            </tr>
          </thead>
          <tbody>
            ${formData.parcelamentos
              .map(
                (parcelamento) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${parcelamento.descricao}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${parcelamento.valor.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${parcelamento.parcelas}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>Nenhum parcelamento cadastrado.</p>"
      }
    </div>
    
    <div>
      <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Conclusão</h3>
      <p>O diagnóstico identificou pontos críticos que necessitam de atenção imediata, 
      especialmente com relação às obrigações acessórias em atraso. 
      Recomenda-se a regularização das pendências e a adoção de processos para evitar novos descumprimentos.</p>
    </div>
  </div>
`;

    // Inserir o conteúdo do diagnóstico no documento
    const finalHTML = letterheadHTML.replace(
      "{{CONTEUDO_DIAGNOSTICO}}",
      diagnosticoContent
    );

    return finalHTML;
  };

  // Função para visualizar o documento
  const previewDocument = () => {
    const content = generateDocument();
    if (!content) return;

    setPreviewVisible(true);
  };

  // Função para fechar a visualização
  const closePreview = () => {
    setPreviewVisible(false);
  };

  // Função para salvar o diagnóstico
  const salvarDiagnostico = async () => {
    if (!formData.empresa) {
      toast.error("Dados incompletos", {
        description: "Complete as informações da empresa antes de salvar.",
      });
      return;
    }

    if (!session?.user.id) {
      toast.error("Usuário não autenticado", {
        description: "Faça login para salvar o diagnóstico.",
      });
      return;
    }

    try {
      const novoDiagnostico = {
        data: new Date().toISOString().split("T")[0],
        cnpj: formData.cnpj,
        nomeEmpresa: formData.empresa.nome,
        status: "Concluído",
        formData: { ...formData },
        usuarioId: session.user.id,
      };

      const response = await fetch("/api/diagnosticos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoDiagnostico),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar diagnóstico");
      }

      const diagnosticoSalvo = await response.json();

      // Também salvar no localStorage para referência local
      const savedDiagnosticos = localStorage.getItem("diagnosticosCompletos");
      const diagnosticosCompletos = savedDiagnosticos
        ? JSON.parse(savedDiagnosticos)
        : [];
      const updatedDiagnosticos = [
        ...diagnosticosCompletos,
        { ...novoDiagnostico, id: diagnosticoSalvo.id },
      ];

      localStorage.setItem(
        "diagnosticosCompletos",
        JSON.stringify(updatedDiagnosticos)
      );
      setDiagnosticos(updatedDiagnosticos.map(({ formData, ...diag }) => diag));

      toast.success("Diagnóstico concluído e salvo com sucesso!");
      setActiveTab("list");
      setViewMode("list");
    } catch (error) {
      console.error("Erro ao salvar diagnóstico:", error);
      toast.error("Erro ao salvar diagnóstico", {
        description: "Não foi possível salvar no banco de dados.",
      });
    }
  };

  // Função para carregar diagnósticos do banco
  const carregarDiagnosticosDoBanco = async () => {
    if (!session?.user.id) return;

    try {
      const response = await fetch(
        `/api/diagnosticos?usuarioId=${session?.user.id}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar diagnósticos");
      }

      const diagnosticosDoBanco = await response.json();

      // Converter para o formato esperado pelo componente
      const diagnosticosFormatados = diagnosticosDoBanco.map((diag: any) => ({
        id: diag.id,
        data: diag.data,
        cnpj: diag.cnpj,
        nomeEmpresa: diag.nomeEmpresa,
        status: diag.status,
      }));

      setDiagnosticos(diagnosticosFormatados);

      // Também salvar no localStorage para acesso offline
      localStorage.setItem(
        "diagnosticosFiscais",
        JSON.stringify(diagnosticosFormatados)
      );
    } catch (error) {
      console.error("Erro ao carregar diagnósticos:", error);
      // Fallback para o localStorage se o banco falhar
      const savedDiagnosticos = localStorage.getItem("diagnosticosFiscais");
      if (savedDiagnosticos) {
        setDiagnosticos(JSON.parse(savedDiagnosticos));
      }
    }
  };

  // Chamar a função quando o usuário for carregado
  useEffect(() => {
    if (session?.user.id) {
      carregarDiagnosticosDoBanco();
    }
  }, [session?.user.id]);

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

            {/* Verificação se formData.empresa existe */}
            {formData.empresa ? (
              <>
                <div className="p-4 border rounded-md bg-muted">
                  <h4 className="font-medium mb-2">Dados da Empresa:</h4>
                  <p>
                    <strong>Razão Social:</strong> {formData.empresa.nome}
                  </p>
                  <p>
                    <strong>Nome Fantasia:</strong>{" "}
                    {formData.empresa.fantasia || "Não informado"}
                  </p>
                  <p>
                    <strong>CNPJ:</strong> {formData.empresa.cnpj}
                  </p>
                  <p>
                    <strong>Situação:</strong> {formData.empresa.situacao}
                  </p>

                  <h4 className="font-medium mt-4 mb-2">Regime Tributário:</h4>
                  <p>
                    {formData.empresa.simples.optante
                      ? "Simples Nacional"
                      : "Lucro Presumido"}
                  </p>
                </div>

                {/* Análise das CNAEs */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Atividades Econômicas:</h4>

                  {/* Atividade Principal */}
                  {formData.empresa.atividade_principal.map(
                    (atividade, index) => (
                      <div
                        key={`principal-${index}`}
                        className="mb-6 border rounded-lg p-4 bg-card"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                              ATIVIDADE PRINCIPAL
                            </span>
                            <h5 className="font-semibold mt-1">
                              {atividade.code} - {atividade.text}
                            </h5>
                          </div>
                        </div>

                        <Tabs defaultValue="simples" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="simples">
                              Simples Nacional
                            </TabsTrigger>
                            <TabsTrigger value="normal">
                              Regime Normal
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="simples" className="pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Pode ser optante:
                                </p>
                                <p className="font-medium">Sim</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Anexo:</p>
                                <p className="font-medium">III</p>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="normal" className="pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Presunção IRPJ:
                                </p>
                                <p className="font-medium">32%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Alíquota IRPJ:
                                </p>
                                <p className="font-medium">15%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Presunção CSLL:
                                </p>
                                <p className="font-medium">32%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Alíquota CSLL:
                                </p>
                                <p className="font-medium">9%</p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )
                  )}

                  {/* Atividades Secundárias */}
                  {formData.empresa.atividades_secundarias &&
                    formData.empresa.atividades_secundarias.map(
                      (atividade, index) => (
                        <div
                          key={`secundaria-${index}`}
                          className="mb-6 border rounded-lg p-4 bg-card"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                ATIVIDADE SECUNDÁRIA
                              </span>
                              <h5 className="font-semibold mt-1">
                                {atividade.code} - {atividade.text}
                              </h5>
                            </div>
                          </div>

                          <Tabs defaultValue="simples" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="simples">
                                Simples Nacional
                              </TabsTrigger>
                              <TabsTrigger value="normal">
                                Regime Normal
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="simples" className="pt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Pode ser optante:
                                  </p>
                                  <p className="font-medium">Não</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Anexo:
                                  </p>
                                  <p className="font-medium">-</p>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="normal" className="pt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Presunção IRPJ:
                                  </p>
                                  <p className="font-medium">16%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Alíquota IRPJ:
                                  </p>
                                  <p className="font-medium">15%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Presunção CSLL:
                                  </p>
                                  <p className="font-medium">12%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Alíquota CSLL:
                                  </p>
                                  <p className="font-medium">9%</p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )
                    )}
                </div>
              </>
            ) : (
              <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800">
                <AlertCircle className="h-5 w-5 inline mr-2" />
                Nenhuma empresa carregada. Volte ao passo 1 para consultar o
                CNPJ.
              </div>
            )}
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
            <div className="flex gap-4 mb-6">
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
                <h4 className="font-medium mb-2">
                  Adicionar Nota Fiscal de Serviço:
                </h4>

                {/* Formulário expandido para nota fiscal de serviço */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="descricao">Descrição do Serviço *</Label>
                    <Input
                      id="descricao"
                      value={notaFiscalDescricao}
                      onChange={(e) => setNotaFiscalDescricao(e.target.value)}
                      placeholder="Descrição detalhada do serviço prestado"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cnae">Código CNAE *</Label>
                    <Input
                      id="cnae"
                      value={notaFiscalCnae}
                      onChange={(e) => setNotaFiscalCnae(e.target.value)}
                      placeholder="Ex: 62.01-5-00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigoServico">
                      Código Serviço (LC 116/03) *
                    </Label>
                    <Input
                      id="codigoServico"
                      value={notaFiscalCodigoServico}
                      onChange={(e) =>
                        setNotaFiscalCodigoServico(e.target.value)
                      }
                      placeholder="Ex: 1.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="aliquota">Alíquota ISS (%) *</Label>
                    <Input
                      id="aliquota"
                      type="number"
                      step="0.01"
                      value={notaFiscalAliquota}
                      onChange={(e) => setNotaFiscalAliquota(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {/* Seção de Retenções */}
                <div className="border rounded-md p-4 mb-4">
                  <h5 className="font-medium mb-3">
                    Aplicabilidade de Retenções:
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* IRRF */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={retencoes.irrf}
                          onChange={(e) =>
                            setRetencoes({
                              ...retencoes,
                              irrf: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        IRRF (1.5%)
                      </Label>
                      {retencoes.irrf && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="irrfBaseLegal">Base legal:</Label>
                            <Input
                              id="irrfBaseLegal"
                              value={retencoes.irrfBaseLegal || ""}
                              onChange={(e) =>
                                setRetencoes({
                                  ...retencoes,
                                  irrfBaseLegal: e.target.value,
                                })
                              }
                              placeholder="Ex: Art. 30 da IN RFB 1.234/2012"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CSRF (PIS/COFINS/CSLL) */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={retencoes.csrf}
                          onChange={(e) =>
                            setRetencoes({
                              ...retencoes,
                              csrf: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        CSRF (4.65%)
                      </Label>
                      {retencoes.csrf && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="csrfBaseLegal">Base legal:</Label>
                            <Input
                              id="csrfBaseLegal"
                              value={retencoes.csrfBaseLegal || ""}
                              onChange={(e) =>
                                setRetencoes({
                                  ...retencoes,
                                  csrfBaseLegal: e.target.value,
                                })
                              }
                              placeholder="Ex: Art. 30 da IN RFB 1.234/2012"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* INSS */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={retencoes.inss}
                          onChange={(e) =>
                            setRetencoes({
                              ...retencoes,
                              inss: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        INSS (11%)
                      </Label>
                      {retencoes.inss && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="inssBaseLegal">Base legal:</Label>
                            <Input
                              id="inssBaseLegal"
                              value={retencoes.inssBaseLegal || ""}
                              onChange={(e) =>
                                setRetencoes({
                                  ...retencoes,
                                  inssBaseLegal: e.target.value,
                                })
                              }
                              placeholder="Ex: Art. 31 da IN RFB 1.234/2012"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ISS */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={retencoes.iss}
                          onChange={(e) =>
                            setRetencoes({
                              ...retencoes,
                              iss: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        ISS Retido na Fonte
                      </Label>
                      {retencoes.iss && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="issBaseLegal">Base legal:</Label>
                            <Input
                              id="issBaseLegal"
                              value={retencoes.issBaseLegal || ""}
                              onChange={(e) =>
                                setRetencoes({
                                  ...retencoes,
                                  issBaseLegal: e.target.value,
                                })
                              }
                              placeholder="Ex: Lei Complementar 116/2003"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
            <p>A empresa possui atividade de comércio ou indústria?</p>
            <div className="flex gap-4 mb-6">
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
                <h4 className="font-medium mb-4">Tributação dos Itens</h4>

                {/* Tabela de tributação dos itens */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold">
                          NCM
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Tributação ICMS (%)
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Base Legal ICMS
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Tributação PIS/COFINS (%)
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Base Legal PIS/COFINS
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Tributação IPI (%)
                        </th>
                        <th className="p-3 text-left text-sm font-semibold">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.itensTributacao.map((item, index) => (
                        <tr key={item.id} className="border-b even:bg-muted/20">
                          <td className="p-3">
                            <Input
                              value={item.ncm}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "ncm",
                                  e.target.value
                                )
                              }
                              className="w-24 text-sm"
                              placeholder="Ex: 8471.30.19"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.icms || ""}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "icms",
                                  e.target.value
                                )
                              }
                              placeholder="%"
                              className="w-16 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={item.baseLegalIcms || ""}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "baseLegalIcms",
                                  e.target.value
                                )
                              }
                              className="text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.pisCofins || ""}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "pisCofins",
                                  e.target.value
                                )
                              }
                              placeholder="%"
                              className="w-16 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={item.baseLegalPisCofins || ""}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "baseLegalPisCofins",
                                  e.target.value
                                )
                              }
                              className="text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.ipi || ""}
                              onChange={(e) =>
                                atualizarItemTributacao(
                                  item.id,
                                  "ipi",
                                  e.target.value
                                )
                              }
                              placeholder="%"
                              className="w-16 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItemTributacao(item.id)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Botão para adicionar nova linha */}
                <div className="mt-4">
                  <Button
                    onClick={adicionarItemTributacao}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Adicionar Item
                  </Button>
                </div>
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

            <div className="mt-4">
              <h4 className="font-medium mb-2">
                Adicionar Obrigação Acessória:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <Label htmlFor="obrigacaoDescricao">Descrição *</Label>
                  <select
                    id="obrigacaoDescricao"
                    value={obrigacaoDescricao}
                    onChange={(e) => setObrigacaoDescricao(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione a obrigação</option>
                    <option value="EFD ICMS IPI">EFD ICMS IPI</option>
                    <option value="DCTF - Declaração de Débitos Tributários Federais">
                      DCTF - Declaração de Débitos Tributários Federais
                    </option>
                    <option value="SPED Contribuições">
                      SPED Contribuições
                    </option>
                    <option value="DEFIS - Declaração de Informações Socioeconômicas e Fiscais">
                      DEFIS - Declaração de Informações Socioeconômicas e
                      Fiscais
                    </option>
                    <option value="DAPI - Declaração de Apuração de Incentivos Fiscais">
                      DAPI - Declaração de Apuração de Incentivos Fiscais
                    </option>
                    <option value="DIRF - Declaração do Imposto de Renda Retido na Fonte">
                      DIRF - Declaração do Imposto de Renda Retido na Fonte
                    </option>
                    <option value="DIMOB - Declaração de Informações sobre Atividades Imobiliárias">
                      DIMOB - Declaração de Informações sobre Atividades
                      Imobiliárias
                    </option>
                    <option value="Outra">Outra obrigação</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="obrigacaoStatus">Status *</Label>
                  <select
                    id="obrigacaoStatus"
                    value={obrigacaoStatus}
                    onChange={(e) => setObrigacaoStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="em-dia">Em dia</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                {/* Campo de competência apenas para status "pendente" */}
                {obrigacaoStatus === "pendente" && (
                  <div>
                    <Label htmlFor="obrigacaoCompetencia">Competência *</Label>
                    <Input
                      id="obrigacaoCompetencia"
                      type="month"
                      value={obrigacaoCompetencia}
                      onChange={(e) => setObrigacaoCompetencia(e.target.value)}
                    />
                  </div>
                )}
                {/* Campo de vencimento apenas para status "pendente" */}
                {obrigacaoStatus === "pendente" && (
                  <div>
                    <Label htmlFor="obrigacaoVencimento">Vencimento *</Label>
                    <Input
                      id="obrigacaoVencimento"
                      type="date"
                      value={obrigacaoVencimento}
                      onChange={(e) => setObrigacaoVencimento(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Campo para descrição personalizada se selecionar "Outra" */}
              {obrigacaoDescricao === "Outra" && (
                <div className="mb-4">
                  <Label htmlFor="obrigacaoDescricaoPersonalizada">
                    Descrição Personalizada *
                  </Label>
                  <Input
                    id="obrigacaoDescricaoPersonalizada"
                    value={obrigacaoDescricaoPersonalizada}
                    onChange={(e) =>
                      setObrigacaoDescricaoPersonalizada(e.target.value)
                    }
                    placeholder="Digite o nome da obrigação"
                  />
                </div>
              )}

              <Button onClick={adicionarObrigacaoAcessoria} className="mb-4">
                Adicionar Obrigação
              </Button>

              {formData.obrigacoesAcessorias.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    Obrigações Acessórias Cadastradas:
                  </h4>
                  <div className="border rounded-md">
                    {formData.obrigacoesAcessorias.map((obrigacao) => (
                      <div key={obrigacao.id} className="p-3 border-b">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{obrigacao.descricao}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mt-1">
                              <div>
                                <span className="font-semibold">Status:</span>{" "}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                    obrigacao.status === "em-dia"
                                      ? "bg-green-100 text-green-800"
                                      : obrigacao.status === "pendente"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {obrigacao.status === "em-dia"
                                    ? "Em dia"
                                    : obrigacao.status === "pendente"
                                      ? "Pendente"
                                      : "Atrasada"}
                                </span>
                              </div>
                              {obrigacao.status === "pendente" && (
                                <>
                                  <div>
                                    <span className="font-semibold">
                                      Competência:
                                    </span>{" "}
                                    {obrigacao.competencia}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      Vencimento:
                                    </span>{" "}
                                    {new Date(
                                      obrigacao.vencimento
                                    ).toLocaleDateString("pt-BR")}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removerObrigacaoAcessoria(obrigacao.id)
                            }
                            className="ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo das obrigações pendentes */}
                  {formData.obrigacoesAcessorias.some(
                    (obrigacao) => obrigacao.status === "pendente"
                  ) && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Obrigações Pendentes
                      </h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {formData.obrigacoesAcessorias
                          .filter(
                            (obrigacao) => obrigacao.status === "pendente"
                          )
                          .map((obrigacao, index) => (
                            <li key={index}>
                              • {obrigacao.descricao} - Competência:{" "}
                              {obrigacao.competencia}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Passo 6: Parcelamentos</h3>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Adicionar Parcelamento:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label htmlFor="parcelamentoDescricao">Descrição</Label>
                  <Input
                    id="parcelamentoDescricao"
                    value={parcelamentoDescricao}
                    onChange={(e) => setParcelamentoDescricao(e.target.value)}
                    placeholder="Ex: REFIS, PERT"
                  />
                </div>
                <div>
                  <Label htmlFor="parcelamentoValor">Valor Total (R$)</Label>
                  <Input
                    id="parcelamentoValor"
                    type="number"
                    value={parcelamentoValor}
                    onChange={(e) => setParcelamentoValor(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="parcelamentoParcelas">Nº de Parcelas</Label>
                  <Input
                    id="parcelamentoParcelas"
                    type="number"
                    value={parcelamentoParcelas}
                    onChange={(e) => setParcelamentoParcelas(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button onClick={adicionarParcelamento} className="mb-4">
                Adicionar Parcelamento
              </Button>

              {formData.parcelamentos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    Parcelamentos Cadastrados:
                  </h4>
                  <div className="border rounded-md">
                    {formData.parcelamentos.map((parcelamento) => (
                      <div
                        key={parcelamento.id}
                        className="flex justify-between items-center p-3 border-b"
                      >
                        <div>
                          <p className="font-medium">
                            {parcelamento.descricao}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            R$ {parcelamento.valor.toFixed(2)} -{" "}
                            {parcelamento.parcelas} parcelas
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerParcelamento(parcelamento.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
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
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab("list")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Ver Diagnósticos
              </Button>
              <Button
                onClick={previewDocument}
                disabled={!letterheadHTML || currentStep < 6}
                className="flex items-center gap-2"
                variant="outline"
              >
                <FileText className="h-4 w-4" />
                Visualizar
              </Button>
            </div>
          )}
        </div>

        {activeTab === "list" && viewMode === "list" ? (
          <Card className="bg-transparent">
            <CardHeader>
              <CardTitle>Diagnósticos Realizados</CardTitle>
              <CardDescription>
                Lista de diagnósticos fiscais já realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticos.length > 0 ? (
                  diagnosticos.map((diagnostico) => (
                    <div
                      key={diagnostico.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent dark:hover:bg-accent/20 cursor-pointer"
                      onClick={() => carregarDiagnostico(diagnostico.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <FileTextIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {diagnostico.nomeEmpresa}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {diagnostico.cnpj}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            editarDiagnostico(diagnostico.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirDiagnostico(diagnostico.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive hover:bg-transparent" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 border-2 border-dashed rounded-md">
                    <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum diagnóstico realizado
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Realizar Novo Diagnóstico" para começar
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "view" && selectedDiagnostico ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Visualizando Diagnóstico</CardTitle>
                  <CardDescription>
                    {selectedDiagnostico.nomeEmpresa} -{" "}
                    {selectedDiagnostico.cnpj}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                  Voltar para lista
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Aqui você pode exibir os detalhes completos do diagnóstico */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Dados da Empresa</h3>
                  <p>{selectedDiagnostico.formData.empresa?.nome}</p>
                  <p>CNPJ: {selectedDiagnostico.formData.cnpj}</p>
                </div>
                {/* Adicione mais detalhes do diagnóstico aqui */}
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
                  {/* Upload do papel timbrado */}
                  <div className="p-3 rounded-lg bg-muted">
                    <Label
                      htmlFor="wordTemplate"
                      className="font-medium mb-2 block"
                    >
                      Papel Timbrado
                    </Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="wordTemplate"
                        type="file"
                        accept=".docx"
                        onChange={handleWordUpload}
                        className="flex-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Faça upload do papel timbrado da empresa em formato Word
                      </p>
                      {isProcessingDoc && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando documento...
                        </div>
                      )}
                    </div>
                  </div>

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
                  <CardTitle>Documento Final</CardTitle>
                  <CardDescription>
                    {letterheadHTML
                      ? "Pronto para visualizar o documento com o papel timbrado"
                      : "Faça upload do papel timbrado para visualizar o documento"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {letterheadHTML ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={exportarDocumento}
                        disabled={currentStep < 6}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Baixar Documento
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed rounded-md">
                      <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Nenhum papel timbrado carregado
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Faça upload de um documento Word com papel timbrado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modal de visualização do documento */}
        {previewVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">
                  Visualização do Documento
                </h3>
                <Button variant="outline" onClick={closePreview}>
                  Fechar
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div
                  dangerouslySetInnerHTML={{ __html: generateDocument() || "" }}
                />
              </div>
              <div className="p-4 border-t flex justify-end">
                <Button onClick={closePreview}>Fechar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoFiscal;
