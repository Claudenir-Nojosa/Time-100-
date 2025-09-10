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
  Upload,
  Download,
  FileUp,
  X,
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
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [letterheadHTML, setLetterheadHTML] = useState<string>("");
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [notaFiscalDescricao, setNotaFiscalDescricao] = useState("");
  const [notaFiscalValor, setNotaFiscalValor] = useState("");
  const [notaFiscalAliquota, setNotaFiscalAliquota] = useState("");
  const [itemComercialDescricao, setItemComercialDescricao] = useState("");
  const [itemComercialNCM, setItemComercialNCM] = useState("");
  const [itemComercialValor, setItemComercialValor] = useState("");
  const [obrigacaoDescricao, setObrigacaoDescricao] = useState("");
  const [obrigacaoStatus, setObrigacaoStatus] = useState("pendente");
  const [obrigacaoVencimento, setObrigacaoVencimento] = useState("");
  const [parcelamentoDescricao, setParcelamentoDescricao] = useState("");
  const [parcelamentoValor, setParcelamentoValor] = useState("");
  const [parcelamentoParcelas, setParcelamentoParcelas] = useState("");
  
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

  // Função para adicionar nota fiscal
  const adicionarNotaFiscal = () => {
    if (!notaFiscalDescricao || !notaFiscalValor || !notaFiscalAliquota) {
      toast.error("Preencha todos os campos da nota fiscal");
      return;
    }

    const novaNota = {
      id: Date.now(),
      descricao: notaFiscalDescricao,
      valor: parseFloat(notaFiscalValor),
      aliquota: parseFloat(notaFiscalAliquota),
    };

    setFormData({
      ...formData,
      notasFiscais: [...formData.notasFiscais, novaNota],
    });

    setNotaFiscalDescricao("");
    setNotaFiscalValor("");
    setNotaFiscalAliquota("");

    toast.success("Nota fiscal adicionada com sucesso!");
  };

  // Função para remover nota fiscal
  const removerNotaFiscal = (id: number) => {
    setFormData({
      ...formData,
      notasFiscais: formData.notasFiscais.filter((nota) => nota.id !== id),
    });
  };

  // Função para adicionar item comercial
  const adicionarItemComercial = () => {
    if (!itemComercialDescricao || !itemComercialNCM || !itemComercialValor) {
      toast.error("Preencha todos os campos do item comercial");
      return;
    }

    const novoItem = {
      id: Date.now(),
      descricao: itemComercialDescricao,
      ncm: itemComercialNCM,
      valor: parseFloat(itemComercialValor),
    };

    setFormData({
      ...formData,
      itensComerciais: [...formData.itensComerciais, novoItem],
    });

    setItemComercialDescricao("");
    setItemComercialNCM("");
    setItemComercialValor("");

    toast.success("Item comercial adicionado com sucesso!");
  };

  // Função para remover item comercial
  const removerItemComercial = (id: number) => {
    setFormData({
      ...formData,
      itensComerciais: formData.itensComerciais.filter(
        (item) => item.id !== id
      ),
    });
  };

  // Função para adicionar obrigação acessória
  const adicionarObrigacaoAcessoria = () => {
    if (!obrigacaoDescricao || !obrigacaoVencimento) {
      toast.error("Preencha todos os campos da obrigação acessória");
      return;
    }

    const novaObrigacao = {
      id: Date.now().toString(),
      descricao: obrigacaoDescricao,
      status: obrigacaoStatus,
      vencimento: obrigacaoVencimento,
    };

    setFormData({
      ...formData,
      obrigacoesAcessorias: [...formData.obrigacoesAcessorias, novaObrigacao],
    });

    setObrigacaoDescricao("");
    setObrigacaoVencimento("");

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
          <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">4. Análise de Itens Comercializados</h3>
          ${
            formData.itensComerciais.length > 0
              ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">NCM</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${formData.itensComerciais
                  .map(
                    (item) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.descricao}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.ncm}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.valor.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : "<p>Nenhum item comercial cadastrado.</p>"
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
  const salvarDiagnostico = () => {
    if (!formData.empresa) {
      toast.error("Dados incompletos", {
        description: "Complete as informações da empresa antes de salvar.",
      });
      return;
    }

    const novoDiagnostico: Diagnostico = {
      id: Date.now().toString(),
      data: new Date().toISOString().split("T")[0],
      cnpj: formData.cnpj,
      nomeEmpresa: formData.empresa.nome,
      status: "Concluído",
    };

    const updatedDiagnosticos = [...diagnosticos, novoDiagnostico];
    setDiagnosticos(updatedDiagnosticos);
    localStorage.setItem(
      "diagnosticosFiscais",
      JSON.stringify(updatedDiagnosticos)
    );

    toast.success("Diagnóstico concluído e salvo com sucesso!");
    setActiveTab("list");
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
            {formData.empresa && (
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

                <h4 className="font-medium mt-4 mb-2">Atividade Principal:</h4>
                <p>
                  {formData.empresa.atividade_principal[0]?.code} -{" "}
                  {formData.empresa.atividade_principal[0]?.text}
                </p>

                <h4 className="font-medium mt-4 mb-2">Regime Tributário:</h4>
                <p>
                  {formData.empresa.simples.optante
                    ? "Simples Nacional"
                    : "Lucro Presumido"}
                </p>
              </div>
            )}
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
                <h4 className="font-medium mb-2">Adicionar Nota Fiscal:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={notaFiscalDescricao}
                      onChange={(e) => setNotaFiscalDescricao(e.target.value)}
                      placeholder="Descrição do serviço"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={notaFiscalValor}
                      onChange={(e) => setNotaFiscalValor(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aliquota">Alíquota (%)</Label>
                    <Input
                      id="aliquota"
                      type="number"
                      value={notaFiscalAliquota}
                      onChange={(e) => setNotaFiscalAliquota(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <Button onClick={adicionarNotaFiscal} className="mb-4">
                  Adicionar Nota Fiscal
                </Button>

                {formData.notasFiscais.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">
                      Notas Fiscais Cadastradas:
                    </h4>
                    <div className="border rounded-md">
                      {formData.notasFiscais.map((nota) => (
                        <div
                          key={nota.id}
                          className="flex justify-between items-center p-3 border-b"
                        >
                          <div>
                            <p className="font-medium">{nota.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              R$ {nota.valor.toFixed(2)} - {nota.aliquota}%
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerNotaFiscal(nota.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.isPrestadorServico !== null && (
              <Button onClick={handleNextStep} className="mt-4">
                Próximo
              </Button>
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
                <h4 className="font-medium mb-2">Adicionar Item Comercial:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label htmlFor="itemDescricao">Descrição</Label>
                    <Input
                      id="itemDescricao"
                      value={itemComercialDescricao}
                      onChange={(e) =>
                        setItemComercialDescricao(e.target.value)
                      }
                      placeholder="Descrição do item"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ncm">NCM</Label>
                    <Input
                      id="ncm"
                      value={itemComercialNCM}
                      onChange={(e) => setItemComercialNCM(e.target.value)}
                      placeholder="Código NCM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemValor">Valor (R$)</Label>
                    <Input
                      id="itemValor"
                      type="number"
                      value={itemComercialValor}
                      onChange={(e) => setItemComercialValor(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <Button onClick={adicionarItemComercial} className="mb-4">
                  Adicionar Item
                </Button>

                {formData.itensComerciais.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">
                      Itens Comerciais Cadastrados:
                    </h4>
                    <div className="border rounded-md">
                      {formData.itensComerciais.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border-b"
                        >
                          <div>
                            <p className="font-medium">{item.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              NCM: {item.ncm} - R$ {item.valor.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerItemComercial(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.isComercializacao !== null && (
              <Button onClick={handleNextStep} className="mt-4">
                Próximo
              </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label htmlFor="obrigacaoDescricao">Descrição</Label>
                  <Input
                    id="obrigacaoDescricao"
                    value={obrigacaoDescricao}
                    onChange={(e) => setObrigacaoDescricao(e.target.value)}
                    placeholder="Ex: ECD, ECF, DCTF"
                  />
                </div>
                <div>
                  <Label htmlFor="obrigacaoStatus">Status</Label>
                  <select
                    id="obrigacaoStatus"
                    value={obrigacaoStatus}
                    onChange={(e) => setObrigacaoStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em-dia">Em dia</option>
                    <option value="atrasada">Atrasada</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="obrigacaoVencimento">Vencimento</Label>
                  <Input
                    id="obrigacaoVencimento"
                    type="date"
                    value={obrigacaoVencimento}
                    onChange={(e) => setObrigacaoVencimento(e.target.value)}
                  />
                </div>
              </div>
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
                      <div
                        key={obrigacao.id}
                        className="flex justify-between items-center p-3 border-b"
                      >
                        <div>
                          <p className="font-medium">{obrigacao.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {obrigacao.status} - Vencimento:{" "}
                            {new Date(obrigacao.vencimento).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removerObrigacaoAcessoria(obrigacao.id)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleNextStep} className="mt-4">
              Próximo
            </Button>
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

            <Button onClick={handleNextStep} className="mt-4">
              Concluir Diagnóstico
            </Button>
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
                {diagnosticos.length > 0 ? (
                  diagnosticos.map((diagnostico) => (
                    <div
                      key={diagnostico.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
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
