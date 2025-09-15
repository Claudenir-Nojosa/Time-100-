// app/api/gerar-pdf-profissional/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import puppeteer from "puppeteer";

export async function POST(request: NextRequest) {
  let browser: any = null;

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

    // Usar o texto da análise já existente (analiseTexto)
    const htmlContent = generateFixedTemplate(analise, analise.analiseTexto);

    // Usar Puppeteer para gerar PDF profissional
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Configurar o conteúdo HTML
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${analise.empresa.razaoSocial}-${analise.mesReferencia}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    if (browser) await browser.close();
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}

function generateFixedTemplate(analise: any, analysisText: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #1f2937;
      line-height: 1.6;
      background: white;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      background: #1e293b;
      color: white;
      padding: 50px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 15px;
      letter-spacing: 1px;
      color: white;
    }
    
    .subtitle {
      font-size: 18px;
      font-weight: 300;
      opacity: 0.9;
      color: #e2e8f0;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    .empresa-info {
      background: #f8fafc;
      padding: 35px;
      border-radius: 12px;
      border-left: 4px solid #1e293b;
      margin-bottom: 45px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 25px;
      margin-bottom: 45px;
    }
    
    .info-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    
    .info-card h3 {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 15px;
    }
    
    .info-value {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .section {
      margin-bottom: 45px;
    }
    
    .section-title {
      color: #1e293b;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: #1e293b;
    }
    
    .analysis-content {
      background: white;
      padding: 35px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .footer {
      background: #1e293b;
      color: white;
      padding: 40px;
      text-align: center;
      margin-top: 60px;
    }
    
    .footer p {
      margin: 8px 0;
      opacity: 0.9;
      font-size: 14px;
    }
    
    /* Estilos específicos para o conteúdo da análise */
    .analysis-content-inner {
      line-height: 1.8;
      color: #374151;
      font-size: 14px;
    }
    
    .analysis-content-inner h3 {
      color: #1e293b;
      font-size: 20px;
      font-weight: 700;
      margin: 35px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .analysis-content-inner h4 {
      color: #2563eb;
      font-size: 17px;
      font-weight: 600;
      margin: 28px 0 16px 0;
      padding-left: 10px;
      border-left: 3px solid #2563eb;
    }
    
    .analysis-content-inner ul {
      margin: 18px 0;
      padding-left: 25px;
      color: #475569;
    }
    
    .analysis-content-inner li {
      margin: 12px 0;
      line-height: 1.6;
    }
    
    .analysis-content-inner strong {
      color: #1e293b;
      font-weight: 600;
    }
    
    .analysis-content-inner em {
      font-style: italic;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FINANCE</div>
      <h1 style="margin: 10px 0; font-size: 28px;">Relatório de Análise Tributária</h1>
      <p class="subtitle">Análise profissional e recomendações estratégicas</p>
    </div>

    <div class="content">
      <div class="empresa-info">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">📋 Dados da Empresa</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
          <div>
            <strong style="color: #64748b;">Razão Social:</strong><br>
            <span style="color: #1e293b; font-weight: 500;">${analise.empresa.razaoSocial}</span>
          </div>
          <div>
            <strong style="color: #64748b;">CNPJ:</strong><br>
            <span style="color: #1e293b; font-weight: 500;">${analise.empresa.cnpj}</span>
          </div>
          <div>
            <strong style="color: #64748b;">Período Analisado:</strong><br>
            <span style="color: #1e293b; font-weight: 500;">${getPeriodoAnalisado(analise)}</span>
          </div>
          <div>
            <strong style="color: #64748b;">Data de Emissão:</strong><br>
            <span style="color: #1e293b; font-weight: 500;">${new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h3>Faturamento Total</h3>
          <div class="info-value">${formatCurrency(analise.indicadores.consolidado.financeiros.faturamentoTotal)}</div>
        </div>
        <div class="info-card">
          <h3>Carga Tributária</h3>
          <div class="info-value">${analise.indicadores.consolidado.tributarios.cargaTributaria.toFixed(2)}%</div>
        </div>
        <div class="info-card">
          <h3>Margem Bruta</h3>
          <div class="info-value">${analise.indicadores.consolidado.financeiros.margemBruta.toFixed(2)}%</div>
        </div>
        <div class="info-card">
          <h3>Eficiência Tributária</h3>
          <div class="info-value">${analise.indicadores.consolidado.tributarios.eficienciaTributaria.toFixed(2)}%</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📊 Análise Completa</h2>
        <div class="analysis-content">
          <div class="analysis-content-inner">
            ${formatAnalysisText(analysisText)}
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Relatório gerado automaticamente pelo <strong>Finance</strong> - Sistema de Análise Tributária</p>
      <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
  `;
}

function formatAnalysisText(text: string): string {
  // Formatação básica para manter a estrutura do texto da Claude
  let formattedText = text
    // Manter quebras de linha
    .replace(/\n/g, "<br>")
    // Formatar negrito
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Formatar itálico
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Limpar caracteres especiais
    .replace(/---+/g, "")
    .replace(/##+/g, "");

  // Adicionar estilização para títulos
  formattedText = formattedText
    .replace(/(\d+\.\s+[A-ZÀ-Ü\s]+)<br>/g, "<h3>$1</h3>")
    .replace(/(\d+\.\d+\s+[A-ZÀ-Ü\s]+)<br>/g, "<h4>$1</h4>")
    // Formatar listas
    .replace(/([a-z]\)\s+)/g, "<li>$1")
    .replace(/<li>(.*?)<br>/g, "<li>$1</li>");

  return formattedText;
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
