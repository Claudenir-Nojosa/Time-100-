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

const CNPJConsulta = () => {
  const [cnpj, setCnpj] = useState("");
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setCnpj(formatted);
  };

  // Função para tentar diferentes APIs/proxies
  const fetchCNPJData = async (cnpjNumeros: string) => {
    const APIs = [
      // Tentativa 1: API direta da ReceitaWS
      `https://receitaws.com.br/v1/cnpj/${cnpjNumeros}`,

      // Tentativa 2: Proxy CORS para contornar restrições
      `https://corsproxy.io/?https://receitaws.com.br/v1/cnpj/${cnpjNumeros}`,

      // Tentativa 3: Outro proxy alternativo
      `https://api.allorigins.win/raw?url=https://receitaws.com.br/v1/cnpj/${cnpjNumeros}`,
    ];

    for (const apiUrl of APIs) {
      try {
        console.log(`Tentando API: ${apiUrl}`);
        const response = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
          },
          // Timeout de 10 segundos
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          console.log(`API ${apiUrl} retornou status: ${response.status}`);
          continue; // Tenta a próxima API
        }

        const data = await response.json();

        if (data.status === "ERROR") {
          throw new Error(data.message || "CNPJ não encontrado ou inválido");
        }

        return data;
      } catch (err) {
        console.log(`Falha na API ${apiUrl}:`, err);
        // Continua para a próxima tentativa
      }
    }

    throw new Error("Todas as tentativas de API falharam");
  };

  const buscarCNPJ = async () => {
    const cnpjNumeros = cnpj.replace(/\D/g, "");

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
      // Primeiro tentamos as APIs reais
      let data;
      try {
        data = await fetchCNPJData(cnpjNumeros);
      } catch (apiError) {
        console.log("APIs reais falharam, usando dados de demonstração");
        // Se todas as APIs falharem, usamos dados mockados
        await new Promise((resolve) => setTimeout(resolve, 1000));

        data = {
          nome: "Empresa Tech Verde LTDA",
          fantasia: "Tech Verde Solutions",
          cnpj: cnpj,
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

        toast.info("Modo de demonstração", {
          description:
            "Usando dados de exemplo. Em produção, conecte-se a uma API real.",
        });
      }

      // Formatar os dados para o nosso modelo
      const empresaData: Empresa = {
        nome: data.nome || "",
        fantasia: data.fantasia || "",
        cnpj: data.cnpj || cnpj,
        tipo: data.tipo || "",
        porte: data.porte || "",
        situacao: data.situacao || "",
        data_situacao: data.data_situacao || "",
        motivo_situacao: data.motivo_situacao || "",
        abertura: data.abertura || "",
        natureza_juridica: data.natureza_juridica || "",
        capital_social: data.capital_social || "0",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        cep: data.cep || "",
        telefone: data.telefone || "",
        email: data.email || "",
        atividade_principal: data.atividade_principal || [],
        atividades_secundarias: data.atividades_secundarias || [],
        qsa: data.qsa || [],
        simples: data.simples || { optante: false },
        ultima_atualizacao: data.ultima_atualizacao || "",
      };

      setEmpresa(empresaData);
      toast.success("Dados carregados com sucesso", {
        description: `CNPJ: ${cnpj}`,
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

  // Função para formatar data no padrão brasileiro
  const formatarData = (dataString: string) => {
    if (!dataString) return "Não informada";

    try {
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch {
      return dataString;
    }
  };

  // Função para formatar capital social
  const formatarCapitalSocial = (capital: string) => {
    if (!capital) return "R$ 0,00";

    try {
      const valor = parseFloat(capital);
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    } catch {
      return capital;
    }
  };

  return (
    <div className="min-h-screen dark:from-gray-950 dark:to-emerald-950/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-emerald-200 dark:border-emerald-900/30 shadow-lg dark:bg-gray-950">
          <CardHeader className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100 border-b border-emerald-200 dark:border-emerald-900/30 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-6 w-6" />
              Consulta de CNPJ
            </CardTitle>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Busque dados de empresas da Receita Federal
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="cnpj"
                  className="text-emerald-800 dark:text-emerald-100 font-medium"
                >
                  Digite o CNPJ da empresa
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    className="flex-1 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                    disabled={loading}
                  />
                  <Button
                    onClick={buscarCNPJ}
                    disabled={loading || cnpj.replace(/\D/g, "").length !== 14}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
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
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Digite apenas números, a formatação será aplicada
                  automaticamente
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              {empresa && !loading && (
                <div className="mt-6 space-y-6">
                  {/* ... (o restante do código de exibição permanece igual) ... */}
                  <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Dados da Empresa
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Razão Social
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.nome}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Nome Fantasia
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.fantasia || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          CNPJ
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.cnpj}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Tipo/Porte
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.tipo} / {empresa.porte}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Situação Cadastral
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${empresa.situacao === "ATIVA" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
                          >
                            {empresa.situacao}
                          </span>
                          {empresa.motivo_situacao &&
                            ` - ${empresa.motivo_situacao}`}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Desde: {formatarData(empresa.data_situacao)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Data de Abertura
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {formatarData(empresa.abertura)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Natureza Jurídica
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.natureza_juridica || "Não informada"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Capital Social
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {formatarCapitalSocial(empresa.capital_social)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Simples Nacional
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${empresa.simples.optante ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
                          >
                            {empresa.simples.optante
                              ? "Optante"
                              : "Não optante"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Endereço
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Logradouro
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.logradouro || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Número
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.numero || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Complemento
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.complemento || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Bairro
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.bairro || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Município/UF
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.municipio || "Não informado"} -{" "}
                          {empresa.uf || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          CEP
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.cep || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contato
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Telefone
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.telefone || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          E-mail
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.email || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Atividade Principal
                    </h3>
                    {empresa.atividade_principal.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Código: {empresa.atividade_principal[0].code}
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                          {empresa.atividade_principal[0].text}
                        </p>
                      </div>
                    ) : (
                      <p className="text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md">
                        Não informado
                      </p>
                    )}
                  </div>

                  {empresa.qsa && empresa.qsa.length > 0 && (
                    <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-6">
                      <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Quadro Societário
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {empresa.qsa.map((socio, index) => (
                          <div
                            key={index}
                            className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md"
                          >
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              Nome
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100">
                              {socio.nome}
                            </p>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              Qualificação
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100">
                              {socio.qual}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-emerald-200 dark:border-emerald-900/30 pt-4">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Última atualização:{" "}
                      {formatarData(empresa.ultima_atualizacao)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CNPJConsulta;
