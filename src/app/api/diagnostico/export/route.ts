import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

export async function POST(req: Request) {
  const { formData } = await req.json();

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Diagnóstico Fiscal", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            children: [new TextRun(`Empresa: ${formData.empresa?.nome}`)],
          }),
          new Paragraph({
            children: [new TextRun(`CNPJ: ${formData.empresa?.cnpj}`)],
          }),
          new Paragraph({
            children: [new TextRun(`Situação: ${formData.empresa?.situacao}`)],
          }),

          new Paragraph({ text: " " }),
          new Paragraph({ text: "Atividade Principal:" }),
          new Paragraph({
            children: [
              new TextRun(
                `${formData.empresa?.atividade_principal?.[0]?.code} - ${formData.empresa?.atividade_principal?.[0]?.text}`
              ),
            ],
          }),

          new Paragraph({ text: " " }),
          new Paragraph({ text: "Notas Fiscais:" }),
          ...(formData.notasFiscais || []).map(
            (nf: any) =>
              new Paragraph({
                children: [
                  new TextRun(
                    `${nf.descricao} | R$ ${nf.valor} | ${nf.aliquota}%`
                  ),
                ],
              })
          ),

          new Paragraph({ text: " " }),
          new Paragraph({ text: "Itens Comerciais:" }),
          ...(formData.itensComerciais || []).map(
            (item: any) =>
              new Paragraph({
                children: [
                  new TextRun(
                    `${item.descricao} | NCM: ${item.ncm} | R$ ${item.valor}`
                  ),
                ],
              })
          ),

          new Paragraph({ text: " " }),
          new Paragraph({ text: "Obrigações Acessórias:" }),
          ...(formData.obrigacoesAcessorias || []).map(
            (o: any) =>
              new Paragraph({
                children: [
                  new TextRun(
                    `${o.descricao} | Status: ${o.status} | Venc: ${o.vencimento}`
                  ),
                ],
              })
          ),

          new Paragraph({ text: " " }),
          new Paragraph({ text: "Parcelamentos:" }),
          ...(formData.parcelamentos || []).map(
            (p: any) =>
              new Paragraph({
                children: [
                  new TextRun(
                    `${p.descricao} | R$ ${p.valor} | ${p.parcelas} parcelas`
                  ),
                ],
              })
          ),
        ],
      },
    ],
  });

  // 🔧 use toBlob -> ArrayBuffer (compatível com NextResponse)
  const blob = await Packer.toBlob(doc);
  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=diagnostico-${formData.empresa?.cnpj}.docx`,
    },
  });
}
