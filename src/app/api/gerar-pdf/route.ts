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

    // Gerar HTML com Claude
    const htmlContent = await generateHtmlWithClaude(analise);

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

async function generateHtmlWithClaude(analise: any) {
  // Primeiro, peça apenas a análise textual para a Claude
  const analysisPrompt = `
Gere uma análise tributária profissional completa para o relatório PDF.

DADOS:
${JSON.stringify(analise.indicadores, null, 2)}

Gere uma análise com:
1. Sumário Executivo
2. Análise de Performance Financeira detalhada
3. Análise Tributária
4. Tendências e Insights
5. Recomendações Estratégicas
6. Conclusão

Use linguagem técnica mas acessível. Seja completo e detalhado.
`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: analysisPrompt }],
    }),
  });

  const data = await response.json();
  const analysisText = data.content[0].text;

  // Agora use um template HTML fixo com a análise da Claude
  return generateFixedTemplate(analise, analysisText);
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
      transition: transform 0.2s ease;
    }
    
    .info-card:hover {
      transform: translateY(-2px);
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
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }
    
    .kpi-item {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #1e293b;
    }
    
    .kpi-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .kpi-value {
      color: #1e293b;
      font-size: 18px;
      font-weight: 700;
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
          ${formatAnalysisText(analysisText)}
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
  // Primeiro, vamos fazer uma limpeza mais agressiva
  let formattedText = text
    // Remover --- e # completamente
    .replace(/---+/g, "")
    .replace(/#/g, "")
    // Corrigir problemas específicos como "title">"
    .replace(/title">/g, "")
    // Remover quebras de linha múltiplas
    .replace(/\n\n+/g, "\n")
    // Formatar títulos principais (1., 2., 3., etc.)
    .replace(/(\d+\.\s+[A-ZÀ-Ü\s]+)\n/g, '<h3 class="main-title">$1</h3>')
    // Formatar subtítulos (1.1, 1.2, etc.)
    .replace(/(\d+\.\d+\s+[A-ZÀ-Ü\s]+)\n/g, '<h4 class="sub-title">$1</h4>')
    // Formatar negrito
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Formatar itálico
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Quebras de linha
    .replace(/\n/g, "<br>");

  // Correções específicas para os problemas que você mencionou
  formattedText = formattedText
    // Corrigir "title">" que sobrou
    .replace(/title">/g, "")
    // Corrigir listas com letras (a), b), c))
    .replace(/([a-z]\)\s+)/g, "<br>$1")
    // Corrigir bullet points mal formatados
    .replace(/(•|[-*])\s+/g, "<li>")
    // Garantir que listas sejam fechadas corretamente
    .replace(/<li>(.*?)<br>/g, "<li>$1</li>")
    // Formatar listas corretamente
    .replace(/<li>/g, '<ul class="custom-list"><li>')
    .replace(/<\/li>(?!<li>)/g, "</li></ul>")
    // Remover tags HTML quebradas
    .replace(/<[^>]*$/, "")
    // Corrigir múltiplas tags de fechamento
    .replace(/<\/ul><\/ul>/g, "</ul>");

  // Processar seções específicas como RECOMENDAÇÕES ESTRATÉGICAS
  formattedText = formattedText
    .replace(/(RECOMENDAÇÕES ESTRATÉGICAS)/g, '<h3 class="main-title">$1</h3>')
    .replace(
      /(\d+\.\d+\s+Otimização Tributária)/g,
      '<h4 class="sub-title">$1</h4>'
    )
    // Formatar subitens de recomendações
    .replace(/([a-z]\)\s+.*?)(?=<br>[a-z]\)|$)/g, "<li>$1</li>");

  return `
    <div class="analysis-content-inner">
      ${formattedText}
    </div>
    
    <style>
      .analysis-content-inner {
        line-height: 1.8;
        color: #374151;
        font-size: 14px;
      }
      
      .main-title {
        color: #1e293b;
        font-size: 20px;
        font-weight: 700;
        margin: 35px 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .sub-title {
        color: #2563eb;
        font-size: 17px;
        font-weight: 600;
        margin: 28px 0 16px 0;
        padding-left: 10px;
        border-left: 3px solid #2563eb;
      }
      
      .custom-list {
        margin: 18px 0;
        padding-left: 25px;
        color: #475569;
      }
      
      .custom-list li {
        margin: 12px 0;
        line-height: 1.6;
      }
    </style>
  `;
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

  // Fallback para mesReferencia se não tiver metadados
  return analise.mesReferencia || "Período não especificado";
}
