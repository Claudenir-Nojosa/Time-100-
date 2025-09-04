"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Definindo a interface para os dados da empresa
interface StatusEmpresa {
  id: string;
  empresaId: string;
  integracao: boolean;
  analiseNCM: boolean;
  estudoTributacaoGeral: boolean;
  levantamentoPendencias: boolean;
  analiseServicos: boolean;
  complianceObrigacoesAcessorias: boolean;
  diagnostico: boolean;
  repasse: boolean;
  competencia: string;
  empresa?: {
    id: string;
    razaoSocial: string;
    cnpj: string;
  };
}
export default function OrganogramaPage() {
  // ← Mude o nome para OrganogramaPage e use export default

  const [data, setData] = useState<StatusEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCells, setUpdatingCells] = useState<Record<string, string>>(
    {}
  );

  // Função para lidar com o clique nas células
  const handleCellClick = async (
    statusEmpresa: StatusEmpresa,
    campo: keyof Omit<
      StatusEmpresa,
      "id" | "empresaId" | "competencia" | "empresa"
    >
  ) => {
    const cellKey = `${statusEmpresa.id}-${campo}`;

    // Evitar múltiplos cliques enquanto está atualizando
    if (updatingCells[cellKey]) return;

    try {
      // Marcar esta célula específica como atualizando
      setUpdatingCells((prev) => ({ ...prev, [cellKey]: campo }));

      // Atualiza o estado local primeiro para feedback imediato
      const novoValor = !statusEmpresa[campo];

      // Atualização otimista do estado local
      setData((prevData) =>
        prevData.map((item) =>
          item.id === statusEmpresa.id ? { ...item, [campo]: novoValor } : item
        )
      );

      // Traduzindo os nomes dos campos para português
      const campoTraduzido = {
        integracao: "Integração",
        analiseNCM: "Análise NCM",
        estudoTributacaoGeral: "Estudo Tributação Geral",
        levantamentoPendencias: "Levantamento Pendências",
        analiseServicos: "Análise Serviços",
        complianceObrigacoesAcessorias: "Compliance de Obrigações Acessórias",
        diagnostico: "Diagnóstico",
        repasse: "Repasse",
      }[campo];

      // Envia para o backend
      const response = await fetch(`/api/status-empresas/${statusEmpresa.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [campo]: novoValor,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      toast.success(
        `Status atualizado - ${statusEmpresa.empresa?.razaoSocial}`,
        {
          description: `${campoTraduzido}: ${novoValor ? "Concluído" : "Pendente"}`,
        }
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Reverte a mudança em caso de erro
      setData((prevData) =>
        prevData.map((item) =>
          item.id === statusEmpresa.id
            ? { ...item, [campo]: statusEmpresa[campo] } // Volta ao valor original
            : item
        )
      );

      toast.error("Erro ao atualizar status");
    } finally {
      // Remove esta célula da lista de atualização
      setUpdatingCells((prev) => {
        const newState = { ...prev };
        delete newState[cellKey];
        return newState;
      });
    }
  };

  const columns: ColumnDef<StatusEmpresa>[] = [
    {
      accessorKey: "empresa.razaoSocial",
      header: "Nome da Empresa",
      cell: ({ row }) => (
        <span className="dark:text-purple-100 text-gray-800 font-medium">
          {row.original.empresa?.razaoSocial || "Empresa não encontrada"}
        </span>
      ),
    },
    {
      accessorKey: "integracao",
      header: "Integração",
      cell: ({ row }) => {
        const integracao = row.getValue("integracao");
        const cellKey = `${row.original.id}-integracao`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating && handleCellClick(row.original, "integracao")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : integracao ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "analiseNCM",
      header: "Análise NCM",
      cell: ({ row }) => {
        const analiseNCM = row.getValue("analiseNCM");
        const cellKey = `${row.original.id}-analiseNCM`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating && handleCellClick(row.original, "analiseNCM")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : analiseNCM ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "estudoTributacaoGeral",
      header: "Estudo Tributação Geral",
      cell: ({ row }) => {
        const estudoTributacaoGeral = row.getValue("estudoTributacaoGeral");
        const cellKey = `${row.original.id}-estudoTributacaoGeral`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating &&
              handleCellClick(row.original, "estudoTributacaoGeral")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : estudoTributacaoGeral ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "levantamentoPendencias",
      header: "Levantamento Pendências",
      cell: ({ row }) => {
        const levantamentoPendencias = row.getValue("levantamentoPendencias");
        const cellKey = `${row.original.id}-levantamentoPendencias`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating &&
              handleCellClick(row.original, "levantamentoPendencias")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : levantamentoPendencias ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "analiseServicos",
      header: "Análise Serviços",
      cell: ({ row }) => {
        const analiseServicos = row.getValue("analiseServicos");
        const cellKey = `${row.original.id}-analiseServicos`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating && handleCellClick(row.original, "analiseServicos")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : analiseServicos ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "complianceObrigacoesAcessorias",
      header: "Compliance de Obrigações Acessórias",
      cell: ({ row }) => {
        const complianceObrigacoesAcessorias = row.getValue(
          "complianceObrigacoesAcessorias"
        );
        const cellKey = `${row.original.id}-complianceObrigacoesAcessorias`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating &&
              handleCellClick(row.original, "complianceObrigacoesAcessorias")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : complianceObrigacoesAcessorias ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "diagnostico",
      header: "Diagnóstico",
      cell: ({ row }) => {
        const diagnostico = row.getValue("diagnostico");
        const cellKey = `${row.original.id}-diagnostico`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating && handleCellClick(row.original, "diagnostico")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : diagnostico ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "repasse",
      header: "Repasse",
      cell: ({ row }) => {
        const repasse = row.getValue("repasse");
        const cellKey = `${row.original.id}-repasse`;
        const isUpdating = updatingCells[cellKey];

        return (
          <div
            className="cursor-pointer flex justify-center"
            onClick={() =>
              !isUpdating && handleCellClick(row.original, "repasse")
            }
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : repasse ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "competencia",
      header: "Competência que Entrou",
      cell: ({ row }) => (
        <span className="dark:text-purple-200 text-gray-700">
          {row.getValue("competencia")}
        </span>
      ),
    },
  ];

  useEffect(() => {
    const fetchStatusEmpresas = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/status-empresas");

        if (!response.ok) {
          throw new Error("Erro ao carregar status das empresas");
        }

        const statusEmpresas = await response.json();
        setData(statusEmpresas);
      } catch (error) {
        console.error("Erro ao buscar status das empresas:", error);
        setError("Erro ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatusEmpresas();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden dark:border-purple-900/30 border-gray-200 shadow-sm mt-10">
        <div className="p-4 dark:bg-purple-700/20 bg-gray-100 border-b dark:border-purple-500/30 border-gray-200">
          <h2 className="text-xl font-bold items-center text-center">
            Status das Empresas
          </h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden dark:border-purple-900/30 border-gray-200 shadow-sm mt-10">
        <div className="p-4 dark:bg-purple-700/20 bg-gray-100 border-b dark:border-purple-500/30 border-gray-200">
          <h2 className="text-xl font-bold items-center text-center">
            Status das Empresas
          </h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden dark:border-purple-900/30 border-gray-200 shadow-sm mt-10">
      <div className="p-4 dark:bg-purple-700/20 bg-gray-100 border-b dark:border-purple-500/30 border-gray-200">
        <h2 className="text-xl font-bold items-center text-center">
          Status das Empresas
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table className="border-collapse min-w-max">
          <TableHeader className="dark:bg-purple-950/20 bg-purple-50/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="dark:border-purple-900/30 border-gray-200"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="dark:text-purple-300 text-purple-600 font-medium py-3 px-4 whitespace-nowrap text-center"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="dark:border-purple-900/30 border-gray-200 dark:hover:bg-purple-900/10 hover:bg-purple-50/30 transition-colors"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 dark:bg-gray-950 bg-white text-center"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center dark:text-purple-300 text-purple-600 dark:bg-gray-950 bg-white"
                >
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 dark:bg-purple-700/20 bg-gray-100 border-t dark:border-purple-500/30 border-gray-200">
        <div className="text-sm dark:text-purple-300 text-purple-600 text-center">
          Legenda:{" "}
          <CheckCircle className="h-4 w-4 inline text-green-500 mx-1" /> =
          Concluído,
          <XCircle className="h-4 w-4 inline text-red-500 mx-1" /> = Pendente
        </div>
      </div>
    </div>
  );
}
