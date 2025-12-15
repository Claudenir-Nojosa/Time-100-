// components/notebook/NotebookCell.jsx
'use client'

import { useState } from 'react'
import { Play, Code, BarChart } from 'lucide-react'

export function NotebookCell({ type = 'code', initialContent, output }) {
  const [isExecuted, setIsExecuted] = useState(false)
  const [executionCount, setExecutionCount] = useState(1)

  return (
    <div className="border rounded-lg mb-4 overflow-hidden font-mono">
      {/* Header da célula */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {type === 'code' && <Code size={16} />}
          {type === 'markdown' && <span className="text-sm">Markdown</span>}
          <span className="text-xs text-gray-500">
            In [{executionCount}]
          </span>
        </div>
        
        {type === 'code' && (
          <button
            onClick={() => {
              setIsExecuted(true)
              setExecutionCount(prev => prev + 1)
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Play size={14} />
            Executar
          </button>
        )}
      </div>

      {/* Conteúdo da célula */}
      <div className="p-4 bg-white">
        <pre className="whitespace-pre-wrap text-sm">
          {initialContent}
        </pre>
      </div>

      {/* Output (aparece quando executado) */}
      {isExecuted && output && (
        <div className="border-t bg-gray-50">
          <div className="px-4 py-2 text-xs text-gray-500">
            Out [{executionCount - 1}]
          </div>
          <div className="p-4 bg-white">
            {typeof output === 'string' ? (
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            ) : (
              output // Pode ser um componente React (gráfico, tabela, etc.)
            )}
          </div>
        </div>
      )}
    </div>
  )
}