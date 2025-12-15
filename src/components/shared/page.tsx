// src/components/notebook/JupyterNotebook.jsx
"use client";

import { JupyterCell } from "./JupyterCell";
import { MarkdownCell } from "./MarkDown";
import { useState } from "react";
import { Plus, PlayCircle, Save } from "lucide-react";

// Dados de exemplo do notebook
const initialCells = [
  {
    type: "markdown",
    content:
      "# Análise de Preços de Imóveis\n## Dataset do Kaggle\n\nEste notebook analisa os preços de imóveis em São Paulo.",
    cellNumber: 1,
  },
  {
    type: "code",
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

print("📊 Carregando dataset...")
df = pd.read_csv('data/imoveis_sp.csv')
print(f"Dataset carregado: {df.shape[0]} linhas, {df.shape[1]} colunas")
print("\\nPrimeiras 5 linhas:")
print(df.head())`,
    output: `📊 Carregando dataset...
Dataset carregado: 10000 linhas, 15 colunas

Primeiras 5 linhas:
   price  area  bedrooms  bathrooms  neighborhood
0  750000   120         3          2      Pinheiros
1  620000   100         2          1        Moema
2  890000   150         4          3    Jardins
3  540000    80         2          1      Tatuapé
4  950000   180         4          4     Vila Madalena`,
    cellNumber: 2,
    isExecuted: true,
  },
  {
    type: "code",
    code: `# Estatísticas descritivas
print("📈 Estatísticas descritivas:")
print(df[['price', 'area', 'bedrooms']].describe())

print("\\n🔍 Valores nulos por coluna:")
print(df.isnull().sum())

print("\\n🏙️ Distribuição por bairro:")
print(df['neighborhood'].value_counts().head())`,
    output: `📈 Estatísticas descritivas:
              price          area     bedrooms
count  10000.000000  10000.000000  10000.00000
mean   645231.500000    125.500000      3.00000
std    144337.654283     28.867513      1.00000
min    350000.000000     50.000000      1.00000
25%    522500.000000    106.250000      2.00000
50%    645000.000000    125.500000      3.00000
75%    767500.000000    144.750000      4.00000
max    940000.000000    200.000000      5.00000

🔍 Valores nulos por coluna:
price            0
area             5
bedrooms         0
bathrooms        2
neighborhood     1

🏙️ Distribuição por bairro:
neighborhood
Pinheiros        1250
Moema            1200
Jardins          1150
Tatuapé          1100
Vila Madalena    1050
Name: count, dtype: int64`,
    cellNumber: 3,
    isExecuted: true,
  },
];

export function JupyterNotebook() {
  const [cells, setCells] = useState(initialCells);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runAllCells = async () => {
    setIsRunningAll(true);
    // Simular execução de todas as células
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRunningAll(false);
  };

  const addCodeCell = () => {
    const newCellNumber = cells.filter((c) => c.type === "code").length + 1;
    setCells([
      ...cells,
      {
        type: "code",
        code: '# Nova célula de código\nprint("Hello, Data Science!")',
        output: "",
        cellNumber: newCellNumber,
        isExecuted: false,
      },
    ]);
  };

  const addMarkdownCell = () => {
    setCells([
      ...cells,
      {
        type: "markdown",
        content: "# Nova célula de markdown\nDescreva sua análise aqui...",
        cellNumber: cells.length + 1,
      },
    ]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Toolbar estilo Jupyter */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">📓 Jupyter Notebook</span>
          <span className="text-xs text-gray-300">| Python 3</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runAllCells}
            disabled={isRunningAll}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <PlayCircle size={14} />
            {isRunningAll ? "Executando..." : "Executar Tudo"}
          </button>
          <button className="flex items-center gap-1 px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">
            <Save size={14} />
            Salvar
          </button>
        </div>
      </div>

      {/* Notebook content */}
      <div className="p-4">
        {cells.map((cell, index) => (
          <div key={index} className="mb-6">
            {cell.type === "markdown" ? (
              <MarkdownCell
                cellNumber={cell.cellNumber}
                initialContent={cell.content}
                isEditable={true}
              />
            ) : (
              <JupyterCell
                cellNumber={cell.cellNumber}
                initialCode={cell.code}
                initialOutput={cell.output}
                isExecutedInitially={cell.isExecuted}
              />
            )}
          </div>
        ))}

        {/* Botões para adicionar células */}
        <div className="flex gap-3 mt-8 pt-4 border-t">
          <button
            onClick={addCodeCell}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus size={16} />
            Adicionar Célula de Código
          </button>
          <button
            onClick={addMarkdownCell}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Plus size={16} />
            Adicionar Célula de Texto
          </button>
        </div>
      </div>
    </div>
  );
}
