// components/notebook/InteractiveNotebook.jsx
"use client";

import { useState } from "react";
import { NotebookCell } from "./NotebookCell";
import { cellsData } from "./notebookData";

export function InteractiveNotebook() {
  const [cells, setCells] = useState(cellsData);

  const executeCell = (cellId) => {
    setCells((prev) =>
      prev.map((cell) =>
        cell.id === cellId
          ? {
              ...cell,
              isExecuted: true,
              executionCount: cell.executionCount + 1,
            }
          : cell
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          📓 Notebook Interativo de Análise
        </h1>
        <p className="text-gray-600 mt-2">
          Execute as células como no Jupyter Notebook
        </p>
      </div>

      {cells.map((cell) => (
        <div key={cell.id} className="relative group">
          <NotebookCell
            type={cell.type}
            initialContent={cell.content}
            output={cell.output}
            isExecuted={cell.isExecuted}
            executionCount={cell.executionCount}
            onExecute={() => executeCell(cell.id)}
          />

          {/* Menu de ações para cada célula */}
          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 bg-white border rounded shadow">⋮</button>
          </div>
        </div>
      ))}
    </div>
  );
}
