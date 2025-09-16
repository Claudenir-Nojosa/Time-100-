// app/api/gerar-word-profissional/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { Packer } from "docx";

export async function POST(request: NextRequest) {
  try {
    const { analiseId } = await request.json();

    if (!analiseId) {
      return NextResponse.json(
        { error: "ID da análise é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar análise
    const analise = await db.analiseTributaria.findUnique({
      where: { id: analiseId },
      include: { empresa: true },
    });

    if (!analise) {
      return NextResponse.json(
        { error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    // Criar documento Word
    const doc = createWordDocument(analise, analise.analiseTexto);

    // Gerar buffer do documento
    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc);

    // Converter para ArrayBuffer de forma segura
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    // Usar Response diretamente com ArrayBuffer
    return new Response(arrayBuffer, {
      status: 200,
      headers: new Headers({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="relatorio-${analise.empresa.razaoSocial}-${analise.mesReferencia}.docx"`,
      }),
    });
  } catch (error) {
    console.error("Erro ao gerar Word:", error);
    return NextResponse.json(
      { error: "Erro ao gerar documento Word" },
      { status: 500 }
    );
  }
}

function createWordDocument(analise: any, analysisText: string) {
  const sections = [
    // Cabeçalho
    new Paragraph({
      text: "FINANCE",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Relatório de Análise Tributária",
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: "Análise profissional e recomendações estratégicas",
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Informações da Empresa
    new Paragraph({
      text: "📋 Dados da Empresa",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }),

    // Tabela com dados da empresa
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            createTableCell("Razão Social:", true),
            createTableCell(analise.empresa.razaoSocial, false),
            createTableCell("CNPJ:", true),
            createTableCell(analise.empresa.cnpj, false),
          ],
        }),
        new TableRow({
          children: [
            createTableCell("Período Analisado:", true),
            createTableCell(getPeriodoAnalisado(analise), false),
            createTableCell("Data de Emissão:", true),
            createTableCell(new Date().toLocaleDateString("pt-BR"), false),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),

    // KPIs em tabela
    new Paragraph({
      text: "📊 Indicadores Principais",
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "E2E8F0",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      rows: [
        new TableRow({
          children: [
            createKpiCell(
              "Faturamento Total",
              formatCurrency(
                analise.indicadores.consolidado.financeiros.faturamentoTotal
              ),
              "#10B981"
            ),
            createKpiCell(
              "Carga Tributária",
              `${analise.indicadores.consolidado.tributarios.cargaTributaria.toFixed(2)}%`,
              "#3B82F6"
            ),
          ],
        }),
        new TableRow({
          children: [
            createKpiCell(
              "Margem Bruta",
              `${analise.indicadores.consolidado.financeiros.margemBruta.toFixed(2)}%`,
              "#8B5CF6"
            ),
            createKpiCell(
              "Eficiência Tributária",
              `${analise.indicadores.consolidado.tributarios.eficienciaTributaria.toFixed(2)}%`,
              "#F59E0B"
            ),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),

    // Análise Completa
    new Paragraph({
      text: "📊 Análise Completa",
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),

    // Texto da análise formatado
    ...formatAnalysisContent(analysisText),

    // Rodapé
    new Paragraph({
      text: "",
      spacing: { before: 800 },
    }),
    new Paragraph({
      text: "Relatório gerado automaticamente pelo Finance - Sistema de Análise Tributária",
      alignment: AlignmentType.CENTER,
      style: "footer",
    }),
    new Paragraph({
      text: `© ${new Date().getFullYear()} - Todos os direitos reservados`,
      alignment: AlignmentType.CENTER,
      style: "footer",
    }),
  ];

  return new Document({
    styles: {
      paragraphStyles: [
        {
          id: "footer",
          name: "Footer",
          basedOn: "Normal",
          next: "Normal",
          run: {
            color: "666666",
            size: 20,
          },
          paragraph: {
            spacing: { before: 100, after: 100 },
          },
        },
        {
          id: "kpiTitle",
          name: "KPI Title",
          basedOn: "Normal",
          next: "Normal",
          run: {
            color: "64748B",
            size: 20,
            bold: true,
          },
        },
        {
          id: "kpiValue",
          name: "KPI Value",
          basedOn: "Normal",
          next: "Normal",
          run: {
            color: "1E293B",
            size: 28,
            bold: true,
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
}

function createTableCell(text: string, isHeader: boolean): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isHeader,
            color: isHeader ? "64748B" : "1E293B",
            size: isHeader ? 20 : 24,
          }),
        ],
      }),
    ],
    shading: isHeader ? { fill: "F8FAFC" } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
}

function createKpiCell(title: string, value: string, color: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: title,
            bold: true,
            color: "64748B",
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: value,
            bold: true,
            color: color,
            size: 28,
          }),
        ],
      }),
    ],
    shading: { fill: "FFFFFF" },
    margins: { top: 200, bottom: 200, left: 100, right: 100 },
    verticalAlign: "center",
  });
}

function formatAnalysisContent(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    let paragraph: Paragraph;

    // Detectar títulos
    if (line.match(/^\d+\.\s+[A-Z]/)) {
      paragraph = new Paragraph({
        text: line.replace(/\*\*/g, ""),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 100 },
      });
    }
    // Detectar subtítulos
    else if (line.match(/^\d+\.\d+\s+[A-Z]/)) {
      paragraph = new Paragraph({
        text: line.replace(/\*\*/g, ""),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 200, after: 100 },
      });
    }
    // Detectar listas
    else if (line.match(/^[•\-*]\s/) || line.match(/^[a-z]\)\s/)) {
      paragraph = new Paragraph({
        text: line.replace(/^[•\-*]\s/, "○ ").replace(/^[a-z]\)\s/, "○ "),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 },
      });
    }
    // Texto normal
    else {
      // Processar negrito e formatação
      const children: TextRun[] = [];
      let currentText = line;

      while (currentText.includes("**")) {
        const parts = currentText.split("**");
        if (parts[0]) {
          children.push(new TextRun(parts[0]));
        }
        if (parts[1]) {
          children.push(
            new TextRun({
              text: parts[1],
              bold: true,
            })
          );
        }
        currentText = parts.slice(2).join("**");
      }
      if (currentText) {
        children.push(new TextRun(currentText));
      }

      paragraph = new Paragraph({
        children,
        spacing: { before: 100, after: 100 },
      });
    }

    paragraphs.push(paragraph);
  }

  return paragraphs;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getPeriodoAnalisado(analise: any): string {
  if (analise.indicadores?.metadados?.periodo) {
    const { inicio, fim } = analise.indicadores.metadados.periodo;
    return `${inicio} a ${fim}`;
  }
  return analise.mesReferencia || "Período não especificado";
}
