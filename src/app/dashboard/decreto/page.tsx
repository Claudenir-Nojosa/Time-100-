"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { parseString } from "xml2js";

// Tipos TypeScript
type XMLAnalysis = {
  numeroNota: string;
  dataEmissao: string;
  valorTotal: string;
  emitente: string;
  cnpjEmitente: string;
  infAdFisco?: string;
  infCpl?: string;
  items: ItemAnalysis[];
  resumo: ResumoAnalysis;
  error?: string;
};

type ItemAnalysis = {
  item: number;
  descricao: string;
  ncm: string;
  cfop: string;
  cst: string;
  valorICMSST: number;
  icmsType: string;
  foiRecolhido: RecolhimentoStatus;
};

type RecolhimentoStatus = {
  status: "SIM" | "NÃO" | "INDETERMINADO";
  motivo: string;
};

type ResumoAnalysis = {
  totalItens: number;
  comRecolhimento: number;
  semRecolhimento: number;
  indeterminados: number;
};

// Interface para o objeto parsed do xml2js
interface ICMSType {
  CST?: string[];
  vICMSST?: string[];
}

interface ICMS {
  ICMS00?: ICMSType[];
  ICMS10?: ICMSType[];
  ICMS20?: ICMSType[];
  ICMS30?: ICMSType[];
  ICMS40?: ICMSType[];
  ICMS41?: ICMSType[];
  ICMS50?: ICMSType[];
  ICMS51?: ICMSType[];
  ICMS60?: ICMSType[];
  ICMS70?: ICMSType[];
  ICMS90?: ICMSType[];
}

interface NFeProc {
  nfeProc?: {
    NFe?: Array<{
      infNFe?: Array<{
        ide?: Array<{
          nNF?: string[];
          dhEmi?: string[];
        }>;
        emit?: Array<{
          xNome?: string[];
          CNPJ?: string[];
        }>;
        total?: Array<{
          ICMSTot?: Array<{
            vNF?: string[];
          }>;
        }>;
        infAdic?: Array<{
          infAdFisco?: string[];
          infCpl?: string[];
        }>;
        det?: Array<{
          prod?: Array<{
            xProd?: string[];
            NCM?: string[];
            CFOP?: string[];
          }>;
          imposto?: Array<{
            ICMS?: ICMS[];
          }>;
        }>;
      }>;
    }>;
  };
}

// Type guard para verificar se uma chave é válida no objeto ICMS
function isICMSType(key: string, icms: ICMS): key is keyof ICMS {
  return key in icms;
}

export default function XMLAnalyzerPage() {
  const [analyzedNotes, setAnalyzedNotes] = useState<XMLAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função para analisar o XML com xml2js
  const analyzeXML = (xmlText: string): Promise<XMLAnalysis> => {
    return new Promise((resolve, reject) => {
      parseString(xmlText, (err, result: NFeProc) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const nfe = result.nfeProc?.NFe?.[0]?.infNFe?.[0];
          if (!nfe) {
            reject(new Error("Estrutura XML inválida - NFe não encontrada"));
            return;
          }

          const ide = nfe.ide?.[0];
          const emit = nfe.emit?.[0];
          const total = nfe.total?.[0]?.ICMSTot?.[0];
          const infAdic = nfe.infAdic?.[0];

          // Informações básicas da nota
          const noteInfo = {
            numeroNota: ide?.nNF?.[0] || "N/A",
            dataEmissao: ide?.dhEmi?.[0] || "N/A",
            valorTotal: total?.vNF?.[0] || "0",
            emitente: emit?.xNome?.[0] || "N/A",
            cnpjEmitente: emit?.CNPJ?.[0] || "N/A",
            infAdFisco: infAdic?.infAdFisco?.[0] || "",
            infCpl: infAdic?.infCpl?.[0] || "",
          };

          // Analisar cada item da nota
          const det = nfe.det || [];
          const itemsAnalysis: ItemAnalysis[] = det.map((detItem, index) => {
            const item = detItem?.prod?.[0] || {};
            const imposto = detItem?.imposto?.[0] || {};
            const icms = imposto?.ICMS?.[0] || {};

            // Encontrar o tipo de ICMS e seus dados
            let icmsType = "";
            let icmsData: ICMSType = {};
            let cst = "";
            let vICMSST = "0";

            const icmsTypes: (keyof ICMS)[] = [
              "ICMS00",
              "ICMS10",
              "ICMS20",
              "ICMS30",
              "ICMS40",
              "ICMS41",
              "ICMS50",
              "ICMS51",
              "ICMS60",
              "ICMS70",
              "ICMS90",
            ];

            for (const type of icmsTypes) {
              if (icms[type]?.[0]) {
                icmsType = type;
                icmsData = icms[type]?.[0] || {};
                cst = icmsData?.CST?.[0] || "";
                vICMSST = icmsData?.vICMSST?.[0] || "0";
                break;
              }
            }

            const cfop = item?.CFOP?.[0] || "";
            const ncm = item?.NCM?.[0] || "";

            return {
              item: index + 1,
              descricao: item?.xProd?.[0] || "Produto não identificado",
              ncm: ncm,
              cfop: cfop,
              cst: cst,
              valorICMSST: parseFloat(vICMSST) || 0,
              icmsType: icmsType,
              foiRecolhido: analisarRecolhimento(cfop, cst, vICMSST),
            };
          });

          resolve({
            ...noteInfo,
            items: itemsAnalysis,
            resumo: gerarResumo(itemsAnalysis),
          });
        } catch (error) {
          reject(
            new Error(
              `Erro ao processar XML: ${error instanceof Error ? error.message : "Erro desconhecido"}`
            )
          );
        }
      });
    });
  };

  // Função principal de análise baseada nas regras tributárias
  const analisarRecolhimento = (
    cfop: string,
    cst: string,
    vICMSST: string
  ): RecolhimentoStatus => {
    const valorST = parseFloat(vICMSST) || 0;

    // CST 60 - ICMS cobrado anteriormente por substituição tributária
    if (cst === "60") {
      return {
        status: "SIM",
        motivo:
          "CST 60 - ICMS recolhido anteriormente por substituição tributária",
      };
    }

    // CST 10 - Tributada com cobrança do ICMS por ST na própria operação
    if (cst === "10" && valorST > 0) {
      return {
        status: "SIM",
        motivo: "CST 10 - ICMS-ST recolhido na operação atual",
      };
    }

    // CFOP 5.403 - Entrada de mercadoria sujeita a ST
    if (cfop === "5403" || cfop === "5405") {
      if (valorST > 0) {
        return {
          status: "SIM",
          motivo: `CFOP ${cfop} com valor de ICMS-ST recolhido: R$ ${valorST.toFixed(2)}`,
        };
      } else {
        return {
          status: "NÃO",
          motivo: `CFOP ${cfop} mas SEM valor de ICMS-ST destacado`,
        };
      }
    }

    // CST 90 - Outras operações
    if (cst === "90") {
      if (valorST > 0) {
        return { status: "SIM", motivo: "CST 90 com ICMS-ST recolhido" };
      } else {
        return { status: "NÃO", motivo: "CST 90 sem ICMS-ST" };
      }
    }

    // CFOPs de entrada interna sem ST
    if (["5101", "5102", "5103", "5401", "5402"].includes(cfop)) {
      return {
        status: "NÃO",
        motivo: `CFOP ${cfop} - Operação interna sem substituição tributária`,
      };
    }

    return {
      status: "INDETERMINADO",
      motivo: `Necessita análise manual - CFOP: ${cfop}, CST: ${cst}`,
    };
  };

  // Gerar resumo da análise
  const gerarResumo = (items: ItemAnalysis[]): ResumoAnalysis => {
    const totalItens = items.length;
    const comRecolhimento = items.filter(
      (item) => item.foiRecolhido.status === "SIM"
    ).length;
    const semRecolhimento = items.filter(
      (item) => item.foiRecolhido.status === "NÃO"
    ).length;
    const indeterminados = items.filter(
      (item) => item.foiRecolhido.status === "INDETERMINADO"
    ).length;

    return { totalItens, comRecolhimento, semRecolhimento, indeterminados };
  };

  // Manipular upload de arquivos
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    setIsLoading(true);
    const results: XMLAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await readFileAsText(file);
        const analysis = await analyzeXML(text);
        results.push(analysis);
      } catch (error) {
        console.error(`Erro ao processar ${file.name}:`, error);
        results.push({
          numeroNota: "ERRO",
          dataEmissao: "N/A",
          valorTotal: "0",
          emitente: `Erro no arquivo: ${file.name}`,
          cnpjEmitente: "N/A",
          items: [],
          resumo: {
            totalItens: 0,
            comRecolhimento: 0,
            semRecolhimento: 0,
            indeterminados: 0,
          },
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    setAnalyzedNotes(results);
    setIsLoading(false);
    toast.success(`${results.length} XML(s) processado(s) com sucesso!`);
  };

  // Ler arquivo como texto
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // Exportar para Excel
  const exportToExcel = () => {
    if (analyzedNotes.length === 0) {
      toast.warning("Nenhum dado para exportar");
      return;
    }

    // Criar dados para exportação
    const excelData = analyzedNotes.flatMap((note) =>
      note.items.map((item) => ({
        "Número NF": note.numeroNota,
        "Data Emissão": new Date(note.dataEmissao).toLocaleDateString("pt-BR"),
        Emitente: note.emitente,
        "CNPJ Emitente": note.cnpjEmitente,
        "Valor Total": `R$ ${parseFloat(note.valorTotal).toFixed(2)}`,
        "Inf. Ad. Fisco": note.infAdFisco || "",
        "Inf. Complementar": note.infCpl || "",
        Item: item.item,
        Descrição: item.descricao,
        NCM: item.ncm,
        CFOP: item.cfop,
        CST: item.cst,
        "Valor ICMS-ST": `R$ ${item.valorICMSST.toFixed(2)}`,
        "Status Recolhimento": item.foiRecolhido.status,
        Motivo: item.foiRecolhido.motivo,
      }))
    );

    // Criar CSV
    const headers = Object.keys(excelData[0]).join(";");
    const csvData = excelData
      .map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const csvContent = `${headers}\n${csvData}`;

    // Criar e baixar arquivo
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `analise-icms-st-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Dados exportados com sucesso!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SIM":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "NÃO":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SIM":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "NÃO":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-emerald-100">
            Analisador de XMLs - ICMS-ST
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Analise notas fiscais e verifique se o ICMS-ST foi recolhido
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
          >
            {analyzedNotes.length} XML(s) carregado(s)
          </Badge>
          {analyzedNotes.length > 0 && (
        <Button
  onClick={exportToExcel}
  variant="ghost"
  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/20 transition-colors"
>
  <Download className="h-4 w-4 mr-2" />
  Exportar
</Button>
          )}
        </div>
      </div>

      {/* Card de Upload */}
      <Card className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900 mb-8">
        <CardHeader>
          <CardTitle className="text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de XMLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Selecione um ou mais arquivos XML para análise
              </p>
              <input
                type="file"
                accept=".xml"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="xml-upload"
              />
              <Button
                onClick={() => document.getElementById("xml-upload")?.click()}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Selecionar XMLs"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Análise */}
      {isLoading && (
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Processando XMLs...</div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {analyzedNotes.map((note, index) => (
          <Card
            key={index}
            className="border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-900"
          >
            <CardContent className="p-0">
              {note.error ? (
                <div className="p-6 text-red-500">
                  <h3 className="text-lg font-semibold mb-2">
                    Erro na análise
                  </h3>
                  <p>{note.emitente}</p>
                  <p className="text-sm mt-2">{note.error}</p>
                </div>
              ) : (
                <>
                  {/* Cabeçalho da Nota */}
                  <div className="p-6 border-b border-emerald-200 dark:border-emerald-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-100">
                          Nota Fiscal: {note.numeroNota}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {note.emitente} • CNPJ: {note.cnpjEmitente}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        R$ {parseFloat(note.valorTotal).toFixed(2)}
                      </Badge>
                    </div>

                    {/* Informações Adicionais */}
                    {(note.infAdFisco || note.infCpl) && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Informações Adicionais:
                        </h4>
                        {note.infAdFisco && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Fisco:</strong> {note.infAdFisco}
                          </p>
                        )}
                        {note.infCpl && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Complementar:</strong> {note.infCpl}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Data:
                        </span>
                        <p>
                          {new Date(note.dataEmissao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Itens:
                        </span>
                        <p>{note.resumo.totalItens}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Com Recolhimento:
                        </span>
                        <p className="text-green-600">
                          {note.resumo.comRecolhimento}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Sem Recolhimento:
                        </span>
                        <p className="text-red-600">
                          {note.resumo.semRecolhimento}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Itens */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-800">
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Item
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Descrição
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            NCM
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            CFOP
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            CST
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            ICMS-ST
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Status
                          </th>
                          <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Motivo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {note.items.map((item, itemIndex) => (
                          <tr
                            key={itemIndex}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="p-4 text-sm">{item.item}</td>
                            <td
                              className="p-4 text-sm max-w-xs truncate"
                              title={item.descricao}
                            >
                              {item.descricao}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              {item.ncm}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              {item.cfop}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              {item.cst}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              R$ {item.valorICMSST.toFixed(2)}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`${getStatusColor(item.foiRecolhido.status)} flex items-center gap-1 w-fit`}
                              >
                                {getStatusIcon(item.foiRecolhido.status)}
                                {item.foiRecolhido.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                              {item.foiRecolhido.motivo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {analyzedNotes.length === 0 && !isLoading && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800">
          <CardContent className="py-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <FileText className="h-12 w-12 mx-auto text-emerald-500 opacity-50" />
              <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-200">
                Nenhum XML carregado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Faça o upload de arquivos XML para iniciar a análise
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
