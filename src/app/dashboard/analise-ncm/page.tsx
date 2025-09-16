// app/dashboard/analise-ncm/page.tsx
"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ResultadoAnalise {
  ncm: string;
  descricao: string;
  status: "correto" | "incorreto" | "nao_encontrado";
  ncmSugerido?: string;
  descricaoSugerida?: string;
  confianca?: number;
}

export default function AnaliseNcmPage() {
  const [resultados, setResultados] = useState<ResultadoAnalise[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
    }
  };

  const analisarNcm = async (dados: { ncm: string; descricao: string }[]) => {
    setCarregando(true);

    try {
      // Simulação de análise - você precisará integrar com uma API real de NCM
      const resultadosSimulados: ResultadoAnalise[] = dados.map((item) => {
        // Lógica de análise simulada
        const ncmLimpo = item.ncm.replace(/\D/g, "").substring(0, 8);
        const descricaoLower = item.descricao.toLowerCase();

        // Exemplos de regras básicas (você precisará de uma base de dados real)
        if (ncmLimpo.startsWith("2201") && descricaoLower.includes("água")) {
          return { ...item, status: "correto" as const, confianca: 0.95 };
        } else if (
          ncmLimpo.startsWith("2203") &&
          descricaoLower.includes("cerveja")
        ) {
          return { ...item, status: "correto" as const, confianca: 0.92 };
        } else if (
          ncmLimpo.startsWith("2201") &&
          descricaoLower.includes("cerveja")
        ) {
          return {
            ...item,
            status: "incorreto" as const,
            ncmSugerido: "22030000",
            descricaoSugerida: "Cervejas de malte",
            confianca: 0.88,
          };
        } else {
          return { ...item, status: "nao_encontrado" as const, confianca: 0.5 };
        }
      });

      setResultados(resultadosSimulados);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao processar a análise");
    } finally {
      setCarregando(false);
    }
  };

  const processarPlanilha = () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo primeiro");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Obter todas as células para detectar automaticamente as colunas
        const range = XLSX.utils.decode_range(firstSheet["!ref"] || "A1:Z1");
        const headers = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const cell = firstSheet[cellAddress];
          headers.push(cell ? cell.v : "");
        }

        console.log("Cabeçalhos encontrados:", headers); // Debug

        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        console.log("Dados brutos:", jsonData); // Debug

        // Detectar automaticamente colunas de NCM e Descrição
        let ncmColumn = "";
        let descColumn = "";

        headers.forEach((header) => {
          const headerLower = header?.toString().toLowerCase() || "";
          if (
            headerLower.includes("ncm") ||
            headerLower.includes("codigo") ||
            headerLower.includes("código")
          ) {
            ncmColumn = header;
          }
          if (
            headerLower.includes("descricao") ||
            headerLower.includes("descrição") ||
            headerLower.includes("produto")
          ) {
            descColumn = header;
          }
        });

        // Se não detectou automaticamente, tenta os padrões
        if (!ncmColumn) ncmColumn = "NCM";
        if (!descColumn) descColumn = "Descricao";

        console.log(
          "Colunas detectadas - NCM:",
          ncmColumn,
          "Descrição:",
          descColumn
        );

        const dados = jsonData
          .map((row: any) => ({
            ncm: row[ncmColumn]?.toString().trim() || "",
            descricao: row[descColumn]?.toString().trim() || "",
          }))
          .filter((item) => item.ncm && item.descricao);

        console.log("Dados processados:", dados);

        if (dados.length === 0) {
          toast.error(
            <div>
              <p>Nenhum dado válido encontrado.</p>
              <p>Certifique-se de que a planilha tem colunas com:</p>
              <ul className="list-disc list-inside mt-1">
                <li>NCM (ou Código, Código NCM)</li>
                <li>Descrição (ou Descrição do Produto, Produto)</li>
              </ul>
            </div>
          );
          return;
        }

        toast.success(`Encontrados ${dados.length} produtos para análise`);
        analisarNcm(dados);
      } catch (error) {
        console.error("Erro ao processar planilha:", error);
        toast.error(
          "Erro ao processar o arquivo. Verifique se é um Excel/CSV válido."
        );
      }
    };
    reader.readAsArrayBuffer(arquivo);
  };

  const baixarTemplate = () => {
    const templateData = [
      { NCM: "22011000", Descricao: "Água mineral natural" },
      { NCM: "22030000", Descricao: "Cerveja de malte" },
      { NCM: "21069090", Descricao: "Outros alimentos" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "template-analise-ncm.xlsx");
  };

  const baixarResultados = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      resultados.map((resultado) => ({
        NCM: resultado.ncm,
        Descrição: resultado.descricao,
        Status:
          resultado.status === "correto"
            ? "CORRETO"
            : resultado.status === "incorreto"
              ? "INCORRETO"
              : "NÃO ENCONTRADO",
        "NCM Sugerido": resultado.ncmSugerido || "",
        "Descrição Sugerida": resultado.descricaoSugerida || "",
        Confiança: resultado.confianca || 0,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
    XLSX.writeFile(workbook, "resultados-analise-ncm.xlsx");
  };

  const totalCorretos = resultados.filter((r) => r.status === "correto").length;
  const totalIncorretos = resultados.filter(
    (r) => r.status === "incorreto"
  ).length;
  const totalNaoEncontrados = resultados.filter(
    (r) => r.status === "nao_encontrado"
  ).length;

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Análise de NCM</h1>
        <Button
          onClick={baixarTemplate}
          variant="outline"
          size="sm" 
          className="h-8 px-3" 
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Template
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload da Planilha</CardTitle>
          <CardDescription>
            Faça upload de uma planilha com duas colunas: NCM e Descrição do
            produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="planilha" className="text-sm font-medium">
                Planilha Excel/CSV
              </Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatos aceitos: XLSX, XLS, CSV
              </p>
            </div>

            {arquivo && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-500">{arquivo.name}</span>
                <span className="text-xs text-gray-500">
                  ({(arquivo.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            <Button
              onClick={processarPlanilha}
              disabled={!arquivo || carregando}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {carregando ? "Analisando..." : "Iniciar Análise"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <>
          {/* Estatísticas */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resultados da Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {totalCorretos}
                  </div>
                  <div className="text-sm text-green-600">Corretos</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {totalIncorretos}
                  </div>
                  <div className="text-sm text-red-600">Incorretos</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {totalNaoEncontrados}
                  </div>
                  <div className="text-sm text-yellow-600">Não Encontrados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Resultados */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detalhes da Análise</CardTitle>
                <Button onClick={baixarResultados} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resultados
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NCM</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>NCM Sugerido</TableHead>
                      <TableHead>Descrição Sugerida</TableHead>
                      <TableHead>Confiança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultados.map((resultado, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {resultado.ncm}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {resultado.descricao}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              resultado.status === "correto"
                                ? "bg-green-100 text-green-800"
                                : resultado.status === "incorreto"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {resultado.status === "correto"
                              ? "CORRETO"
                              : resultado.status === "incorreto"
                                ? "INCORRETO"
                                : "NÃO ENCONTRADO"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {resultado.ncmSugerido || "-"}
                        </TableCell>
                        <TableCell>
                          {resultado.descricaoSugerida || "-"}
                        </TableCell>
                        <TableCell>
                          {resultado.confianca ? (
                            <span className="text-sm text-gray-600">
                              {(resultado.confianca * 100).toFixed(0)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
