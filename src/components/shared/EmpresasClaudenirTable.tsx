"use client";

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
import Link from "next/link";
import { useEffect, useState } from "react";

interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
  uf: string;
  regimeTributacao: string;
  responsavel: string;
}

const columns: ColumnDef<Empresa>[] = [
  {
    accessorKey: "razaoSocial",
    header: "Razão Social",
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
    cell: ({ row }) => {
      const cnpj = row.getValue("cnpj");
      return cnpj ? formatCNPJ(cnpj as string) : "-";
    },
  },
  {
    accessorKey: "uf",
    header: "UF",
  },
  {
    accessorKey: "regimeTributacao",
    header: "Regime",
    cell: ({ row }) => {
      const regime = row.getValue("regimeTributacao");
      return formatRegime(regime as string);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/empresas/${row.original.id}`}
          className="text-primary hover:underline"
        >
          Ver detalhes
        </Link>
      );
    },
  },
];

function formatCNPJ(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatRegime(regime: string) {
  const regimes: Record<string, string> = {
    SIMPLES_NACIONAL: "Simples Nacional",
    LUCRO_PRESUMIDO: "Lucro Presumido",
    LUCRO_REAL: "Lucro Real",
  };
  return regimes[regime] || regime;
}

export function EmpresasClaudenirTable() {
  const [data, setData] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmpresasClaudenir() {
      try {
        const response = await fetch("/api/empresas?responsavel=CLAUDENIR");
        const empresas = await response.json();
        setData(empresas);
      } catch (error) {
        console.error("Erro ao buscar empresas do Claudenir:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmpresasClaudenir();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <div className="text-center py-8">Carregando empresas do Claudenir...</div>;
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 bg-primary text-white">
        <h2 className="text-xl font-bold">Empresas do Claudenir</h2>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhuma empresa cadastrada para o Claudenir
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}