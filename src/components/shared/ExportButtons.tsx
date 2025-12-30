"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileSpreadsheet,
  Table,
  LayoutGrid,
  BarChart,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ExportButtonsProps {
  currentDate: Date;
  atividades: Array<{
    id: string;
    nome: string;
    horario?: string;
    responsavel: string;
    data: Date;
    concluida: boolean;
    categoria: string;
    tempoEstimado?: number;
    tempoReal?: number;
  }>;
  monthNames: string[];
}

export function ExportButtons({
  currentDate,
  atividades,
  monthNames,
}: ExportButtonsProps) {
  // Configuração das categorias (mesma do calendário)
  const CATEGORIAS = {
    apuracao: {
      label: "Apuração",
      corExcel: "DBEAFE", // Azul claro
      emoji: "📊",
    },
    reuniao: {
      label: "Reunião",
      corExcel: "E0F2FE", // Ciano claro
      emoji: "👥",
    },
    diagnostico: {
      label: "Diagnóstico",
      corExcel: "FEF3C7", // Amarelo claro
      emoji: "🔍",
    },
    outros: {
      label: "Outros",
      corExcel: "F3F4F6", // Cinza claro
      emoji: "📝",
    },
    script: {
      label: "Script",
      corExcel: "D1FAE5", // Verde claro
      emoji: "💻",
    },
  } as const;

  type CategoriaKey = keyof typeof CATEGORIAS;

  // Função para exportar dados tabulares (formato tradicional)
  const exportToExcelTabular = () => {
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      // Filtrar atividades do mês atual
      const atividadesDoMes = atividades.filter((atividade) => {
        const atividadeDate = new Date(atividade.data);
        return (
          atividadeDate.getMonth() === month &&
          atividadeDate.getFullYear() === year
        );
      });

      if (atividadesDoMes.length === 0) {
        toast.warning("Nenhuma atividade para exportar este mês");
        return;
      }

      // Preparar dados para Excel
      const data = atividadesDoMes
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .map((atividade) => {
          const categoriaInfo = CATEGORIAS[atividade.categoria as CategoriaKey];
          return {
            Data: new Date(atividade.data).toLocaleDateString("pt-BR"),
            "Dia da Semana": new Date(atividade.data).toLocaleDateString(
              "pt-BR",
              { weekday: "long" }
            ),
            Horário: atividade.horario || "",
            Atividade: atividade.nome,
            Responsável: atividade.responsavel,
            Categoria: categoriaInfo?.label || atividade.categoria,
            Status: atividade.concluida ? "✅ Concluída" : "⏳ Pendente",
            "Tempo Estimado (min)": atividade.tempoEstimado || "",
            "Tempo Real (min)": atividade.tempoReal || "",
            Progresso:
              atividade.tempoEstimado && atividade.tempoReal
                ? `${Math.round((atividade.tempoReal / atividade.tempoEstimado) * 100)}%`
                : "",
          };
        });

      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajustar larguras das colunas
      const wscols = [
        { wch: 12 }, // Data
        { wch: 15 }, // Dia da Semana
        { wch: 10 }, // Horário
        { wch: 40 }, // Atividade
        { wch: 20 }, // Responsável
        { wch: 15 }, // Categoria
        { wch: 15 }, // Status
        { wch: 18 }, // Tempo Estimado
        { wch: 15 }, // Tempo Real
        { wch: 12 }, // Progresso
      ];
      ws["!cols"] = wscols;

      // Adicionar cores baseadas no status
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:Z100");

      for (let R = 1; R <= range.e.r; ++R) {
        const statusCell = XLSX.utils.encode_cell({ c: 5, r: R }); // Coluna F (Status)
        if (ws[statusCell]?.v?.includes("✅")) {
          // Colorir linha inteira para atividades concluídas
          for (let C = 0; C <= 9; ++C) {
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (ws[cellRef]) {
              ws[cellRef].s = {
                fill: { fgColor: { rgb: "DCFCE7" } }, // Verde claro
                font: { color: { rgb: "166534" } },
              };
            }
          }
        }
      }

      // Criar workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Atividades");

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `atividades-${monthNames[month].toLowerCase()}-${year}.xlsx`
      );
      toast.success("Dados exportados para Excel com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast.error("Erro ao exportar para Excel");
    }
  };

  // Função para exportar como calendário visual
  const exportToExcelCalendario = () => {
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const atividadesDoMes = atividades.filter((atividade) => {
        const atividadeDate = new Date(atividade.data);
        return (
          atividadeDate.getMonth() === month &&
          atividadeDate.getFullYear() === year
        );
      });

      if (atividadesDoMes.length === 0) {
        toast.warning("Nenhuma atividade para exportar este mês");
        return;
      }

      const wb = XLSX.utils.book_new();
      const excelData = [];

      // 1. CABEÇALHO
      excelData.push([
        `📅 CALENDÁRIO DE ATIVIDADES - ${monthNames[month].toUpperCase()} ${year}`,
      ]);
      excelData.push([
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      ]);
      excelData.push([]);

      // 2. LEGENDA DE CORES
      excelData.push(["🎨 LEGENDA DE CATEGORIAS:"]);
      Object.entries(CATEGORIAS).forEach(([key, categoria]) => {
        excelData.push([`  ${categoria.emoji} ${categoria.label}`]);
      });
      excelData.push([]);

      // 3. CALENDÁRIO EM FORMATO DE GRADE
      const primeiroDia = new Date(year, month, 1);
      const ultimoDia = new Date(year, month + 1, 0);
      const diasNoMes = ultimoDia.getDate();
      const diaInicial = primeiroDia.getDay();

      // Cabeçalho dos dias da semana
      const diasSemana = [
        "DOMINGO",
        "SEGUNDA",
        "TERÇA",
        "QUARTA",
        "QUINTA",
        "SEXTA",
        "SÁBADO",
      ];
      excelData.push(diasSemana);

      // Inicializar matriz do calendário
      const calendario = Array(6)
        .fill(null)
        .map(() => Array(7).fill({}));

      // Preencher calendário
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataAtual = new Date(year, month, dia);
        const diaSemana = dataAtual.getDay();
        const semana = Math.floor((dia + diaInicial - 1) / 7);

        const atividadesDia = atividadesDoMes.filter((atividade) => {
          const atividadeDate = new Date(atividade.data);
          return atividadeDate.getDate() === dia;
        });

        if (atividadesDia.length === 0) {
          calendario[semana][diaSemana] = {
            dia: dia,
            conteudo: `📅 ${dia}`,
          };
          continue;
        }

        // Agrupar por categoria
        const porCategoria = atividadesDia.reduce(
          (acc, atividade) => {
            const cat = atividade.categoria;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(atividade);
            return acc;
          },
          {} as Record<string, typeof atividadesDia>
        );

        // Construir conteúdo
        let conteudo = `📅 ${dia}\n`;
        conteudo += "─".repeat(15) + "\n";

        Object.entries(porCategoria).forEach(([categoria, atividadesCat]) => {
          const catInfo = CATEGORIAS[categoria as CategoriaKey];
          const label = catInfo?.label || categoria;
          const emoji = catInfo?.emoji || "•";

          const concluidas = atividadesCat.filter((a) => a.concluida).length;
          const status =
            concluidas === atividadesCat.length
              ? "✅"
              : concluidas > 0
                ? `✅${concluidas}/${atividadesCat.length}`
                : "⏳";

          conteudo += `\n${emoji} ${label}: ${status}\n`;

          atividadesCat.forEach((atividade) => {
            const horario = atividade.horario ? `[${atividade.horario}] ` : "";
            const nome =
              atividade.nome.length > 25
                ? atividade.nome.substring(0, 22) + "..."
                : atividade.nome;

            const atividadeStatus = atividade.concluida ? "✓" : "•";
            conteudo += `  ${atividadeStatus} ${horario}${nome}\n`;
          });
        });

        calendario[semana][diaSemana] = {
          dia: dia,
          conteudo: conteudo.trim(),
          atividades: atividadesDia.length,
          concluidas: atividadesDia.filter((a) => a.concluida).length,
        };
      }

      // Adicionar calendário ao Excel
      for (let semana = 0; semana < 6; semana++) {
        const linha = [];

        for (let dia = 0; dia < 7; dia++) {
          const celula = calendario[semana][dia];
          linha.push(celula?.conteudo || "");
        }

        excelData.push(linha);

        // Adicionar linha em branco entre semanas
        if (semana < 5) {
          excelData.push(["", "", "", "", "", "", ""]);
        }
      }

      excelData.push([]);

      // 4. RESUMO ESTATÍSTICO
      const totalAtividades = atividadesDoMes.length;
      const concluidas = atividadesDoMes.filter((a) => a.concluida).length;
      const percentual =
        totalAtividades > 0
          ? Math.round((concluidas / totalAtividades) * 100)
          : 0;

      excelData.push(["📊 RESUMO DO MÊS"]);
      excelData.push([`Total de atividades: ${totalAtividades}`]);
      excelData.push([`Concluídas: ${concluidas} (${percentual}%)`]);
      excelData.push([`Pendentes: ${totalAtividades - concluidas}`]);
      excelData.push([]);

      // Estatísticas por categoria
      excelData.push(["📈 ATIVIDADES POR CATEGORIA"]);
      Object.entries(CATEGORIAS).forEach(([key, categoria]) => {
        const atividadesCat = atividadesDoMes.filter(
          (a) => a.categoria === key
        );
        if (atividadesCat.length > 0) {
          const concluidasCat = atividadesCat.filter((a) => a.concluida).length;
          excelData.push([
            `${categoria.emoji} ${categoria.label}: ${atividadesCat.length} atividades (${concluidasCat} concluídas)`,
          ]);
        }
      });

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Ajustar larguras
      const wscols = Array(7).fill({ wch: 30 });
      ws["!cols"] = wscols;

      // Aplicar estilos
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:G100");

      for (let R = 0; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);

          if (!ws[cell_ref]) continue;
          const cellValue = ws[cell_ref].v?.toString() || "";

          // Título
          if (R === 0) {
            ws[cell_ref].s = {
              font: { bold: true, size: 14, color: { rgb: "1E3A8A" } },
            };
            // Mesclar células do título
            if (!ws["!merges"]) ws["!merges"] = [];
            ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
          }

          // Cabeçalho dos dias
          if (R === Object.keys(CATEGORIAS).length + 4) {
            ws[cell_ref].s = {
              fill: { fgColor: { rgb: "1E40AF" } },
              font: { bold: true, color: { rgb: "FFFFFF" } },
              alignment: { horizontal: "center" },
            };
          }

          // Dias com atividades
          if (cellValue.includes("📅") && cellValue.includes("\n")) {
            // Determinar cor baseada no conteúdo
            let fillColor = "FFFFFF";

            if (cellValue.includes("Apuração")) fillColor = "DBEAFE";
            else if (cellValue.includes("Reunião")) fillColor = "E0F2FE";
            else if (cellValue.includes("Diagnóstico")) fillColor = "FEF3C7";
            else if (cellValue.includes("Outros")) fillColor = "F3F4F6";
            else if (cellValue.includes("Script")) fillColor = "D1FAE5";
            else if (cellValue.includes("✅")) fillColor = "DCFCE7"; // Verde para dias com tudo concluído

            ws[cell_ref].s = {
              fill: { fgColor: { rgb: fillColor } },
              font: { size: 10 },
              alignment: {
                vertical: "top",
                wrapText: true,
              },
              border: {
                top: { style: "thin", color: { rgb: "9CA3AF" } },
                bottom: { style: "thin", color: { rgb: "9CA3AF" } },
                left: { style: "thin", color: { rgb: "9CA3AF" } },
                right: { style: "thin", color: { rgb: "9CA3AF" } },
              },
            };
          }

          // Resumos
          if (
            cellValue.includes("RESUMO") ||
            cellValue.includes("ATIVIDADES POR")
          ) {
            ws[cell_ref].s = {
              font: { bold: true, color: { rgb: "7C3AED" } },
              fill: { fgColor: { rgb: "F5F3FF" } },
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Calendário Visual");

      // 5. ABA ADICIONAL COM DADOS DETALHADOS
      const dadosDetalhados = [
        [
          "DATA",
          "HORÁRIO",
          "ATIVIDADE",
          "RESPONSÁVEL",
          "CATEGORIA",
          "STATUS",
          "TEMPO (min)",
        ],
      ];

      atividadesDoMes
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .forEach((atividade) => {
          const catInfo = CATEGORIAS[atividade.categoria as CategoriaKey];
          dadosDetalhados.push([
            new Date(atividade.data).toLocaleDateString("pt-BR"),
            atividade.horario || "",
            atividade.nome,
            atividade.responsavel,
            catInfo?.label || atividade.categoria,
            atividade.concluida ? "✅ Concluída" : "⏳ Pendente",
            (atividade.tempoReal || atividade.tempoEstimado || "").toString(), // Convertendo para string
          ]);
        });

      const wsDetalhes = XLSX.utils.aoa_to_sheet(dadosDetalhados);
      const wscolsDetalhes = [
        { wch: 12 },
        { wch: 10 },
        { wch: 40 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
      ];
      wsDetalhes["!cols"] = wscolsDetalhes;

      XLSX.utils.book_append_sheet(wb, wsDetalhes, "Detalhes");

      // Gerar arquivo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `calendario-${monthNames[month].toLowerCase()}-${year}.xlsx`
      );

      toast.success("Calendário visual exportado para Excel com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar calendário:", error);
      toast.error("Erro ao exportar calendário");
    }
  };

  // Função para exportar relatório de produtividade
  const exportToExcelProdutividade = () => {
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const atividadesDoMes = atividades.filter((atividade) => {
        const atividadeDate = new Date(atividade.data);
        return (
          atividadeDate.getMonth() === month &&
          atividadeDate.getFullYear() === year
        );
      });

      if (atividadesDoMes.length === 0) {
        toast.warning("Nenhuma atividade para exportar este mês");
        return;
      }

      const wb = XLSX.utils.book_new();

      // 1. RESUMO GERAL - Agora usando arrays separados para valores numéricos
      const resumoData = [
        ["📈 RELATÓRIO DE PRODUTIVIDADE"],
        [`Período: ${monthNames[month]} ${year}`],
        [`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`],
        [], // Linha vazia
        ["MÉTRICAS GERAIS", "VALOR"],
        ["Total de Atividades", atividadesDoMes.length],
        [
          "Atividades Concluídas",
          atividadesDoMes.filter((a) => a.concluida).length,
        ],
        [
          "Taxa de Conclusão",
          `${Math.round((atividadesDoMes.filter((a) => a.concluida).length / atividadesDoMes.length) * 100)}%`,
        ],
        [
          "Tempo Total Estimado (min)",
          atividadesDoMes.reduce((sum, a) => sum + (a.tempoEstimado || 0), 0),
        ],
        [
          "Tempo Total Real (min)",
          atividadesDoMes.reduce((sum, a) => sum + (a.tempoReal || 0), 0),
        ],
        [], // Linha vazia
        ["🏆 TOP 5 RESPONSÁVEIS", "ATIVIDADES", "CONCLUÍDAS"],
      ];

      // Agrupar por responsável
      const porResponsavel = atividadesDoMes.reduce(
        (acc, atividade) => {
          if (!acc[atividade.responsavel]) {
            acc[atividade.responsavel] = { total: 0, concluidas: 0 };
          }
          acc[atividade.responsavel].total++;
          if (atividade.concluida) acc[atividade.responsavel].concluidas++;
          return acc;
        },
        {} as Record<string, { total: number; concluidas: number }>
      );

      // Ordenar e pegar top 5
      Object.entries(porResponsavel)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5)
        .forEach(([responsavel, dados]) => {
          resumoData.push([responsavel, dados.total, dados.concluidas]);
        });

      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);

      // Ajustar tipos das colunas numéricas
      const resumoRange = XLSX.utils.decode_range(
        wsResumo["!ref"] || "A1:C100"
      );

      for (let R = 5; R <= resumoRange.e.r; ++R) {
        for (let C = 1; C <= 2; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          if (wsResumo[cell_ref] && typeof wsResumo[cell_ref].v === "number") {
            wsResumo[cell_ref].t = "n"; // Tipo numérico
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      // 2. DADOS POR DIA - Corrigindo o tipo
      const dadosPorDia = [
        ["📅 PRODUTIVIDADE POR DIA"],
        [
          "Data",
          "Atividades",
          "Concluídas",
          "% Conclusão",
          "Tempo Total (min)",
        ],
      ];

      for (let dia = 1; dia <= new Date(year, month + 1, 0).getDate(); dia++) {
        const dataAtual = new Date(year, month, dia);
        const atividadesDia = atividadesDoMes.filter((atividade) => {
          const atividadeDate = new Date(atividade.data);
          return atividadeDate.getDate() === dia;
        });

        if (atividadesDia.length > 0) {
          const concluidas = atividadesDia.filter((a) => a.concluida).length;
          const percentual = Math.round(
            (concluidas / atividadesDia.length) * 100
          );
          const tempoTotal = atividadesDia.reduce(
            (sum, a) => sum + (a.tempoReal || 0),
            0
          );

          dadosPorDia.push([
            dataAtual.toLocaleDateString("pt-BR"), // String
            atividadesDia.length.toString(), // Number -> String
            concluidas.toString(), // Number -> String
            `${percentual}%`, // String
            tempoTotal > 0 ? tempoTotal.toString() : "", // Number -> String ou vazio
          ]);
        }
      }

      const wsDias = XLSX.utils.aoa_to_sheet(dadosPorDia);

      // Definir tipos apropriados para as colunas
      const diasRange = XLSX.utils.decode_range(wsDias["!ref"] || "A1:E100");

      for (let R = 2; R <= diasRange.e.r; ++R) {
        // Coluna B (Atividades) - número
        const cellB = XLSX.utils.encode_cell({ c: 1, r: R });
        if (wsDias[cellB] && typeof wsDias[cellB].v === "number") {
          wsDias[cellB].t = "n";
        }

        // Coluna C (Concluídas) - número
        const cellC = XLSX.utils.encode_cell({ c: 2, r: R });
        if (wsDias[cellC] && typeof wsDias[cellC].v === "number") {
          wsDias[cellC].t = "n";
        }

        // Coluna D (% Conclusão) - string
        const cellD = XLSX.utils.encode_cell({ c: 3, r: R });
        if (wsDias[cellD] && typeof wsDias[cellD].v === "string") {
          wsDias[cellD].t = "s";
        }

        // Coluna E (Tempo Total) - número ou string vazia
        const cellE = XLSX.utils.encode_cell({ c: 4, r: R });
        if (wsDias[cellE]) {
          if (typeof wsDias[cellE].v === "number") {
            wsDias[cellE].t = "n";
          } else if (wsDias[cellE].v === "") {
            wsDias[cellE].t = "s";
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsDias, "Produtividade por Dia");

      // 3. DETALHAMENTO COMPLETO (nova aba)
      const detalhesCompletos = [
        ["📋 DETALHAMENTO COMPLETO DE ATIVIDADES"],
        [
          "Data",
          "Horário",
          "Atividade",
          "Responsável",
          "Categoria",
          "Status",
          "Tempo Estimado",
          "Tempo Real",
          "Progresso",
        ],
      ];

      atividadesDoMes
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .forEach((atividade) => {
          const catInfo = CATEGORIAS[atividade.categoria as CategoriaKey];
          const tempoEstimado = atividade.tempoEstimado || "";
          const tempoReal = atividade.tempoReal || "";
          const progresso =
            atividade.tempoEstimado && atividade.tempoReal
              ? `${Math.round((atividade.tempoReal / atividade.tempoEstimado) * 100)}%`
              : "";

          detalhesCompletos.push([
            new Date(atividade.data).toLocaleDateString("pt-BR"),
            atividade.horario || "",
            atividade.nome,
            atividade.responsavel,
            catInfo?.label || atividade.categoria,
            atividade.concluida ? "✅ Concluída" : "⏳ Pendente",
            tempoEstimado.toString(), // Convertendo para string
            tempoReal.toString(), // Convertendo para string
            progresso,
          ]);
        });

      const wsDetalhes = XLSX.utils.aoa_to_sheet(detalhesCompletos);

      // Ajustar larguras das colunas
      const wscolsDetalhes = [
        { wch: 12 }, // Data
        { wch: 10 }, // Horário
        { wch: 40 }, // Atividade
        { wch: 20 }, // Responsável
        { wch: 15 }, // Categoria
        { wch: 15 }, // Status
        { wch: 15 }, // Tempo Estimado
        { wch: 12 }, // Tempo Real
        { wch: 12 }, // Progresso
      ];
      wsDetalhes["!cols"] = wscolsDetalhes;

      XLSX.utils.book_append_sheet(wb, wsDetalhes, "Detalhes Completos");

      // Gerar arquivo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `produtividade-${monthNames[month].toLowerCase()}-${year}.xlsx`
      );

      toast.success("Relatório de produtividade exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="dark:bg-gray-950 dark:border-emerald-900/30 w-64"
      >
        <DropdownMenuItem
          onClick={exportToExcelCalendario}
          className="dark:hover:bg-emerald-900/30 cursor-pointer"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Calendário Visual</div>
            <div className="text-xs text-gray-500">
              Layout de grade com cores
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={exportToExcelTabular}
          className="dark:hover:bg-emerald-900/30 cursor-pointer"
        >
          <Table className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Dados Tabulares</div>
            <div className="text-xs text-gray-500">
              Formato tradicional para análise
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-emerald-900/30" />

        <DropdownMenuItem
          onClick={exportToExcelProdutividade}
          className="dark:hover:bg-emerald-900/30 cursor-pointer"
        >
          <BarChart className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Relatório de Produtividade</div>
            <div className="text-xs text-gray-500">Métricas e estatísticas</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
