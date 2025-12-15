// components/notebook/PythonRuntimeNotebook.jsx
'use client'

import { useState } from 'react'
import { runPythonCode } from '@/lib/pythonRuntime'

export function PythonRuntimeNotebook() {
  const [code, setCode] = useState(`# Digite seu código Python aqui
import numpy as np

x = np.array([1, 2, 3, 4, 5])
y = x * 2
print(f"Array original: {x}")
print(f"Array dobrado: {y}")
print(f"Média: {np.mean(y)}")`)
  
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const executeCode = async () => {
    setIsRunning(true)
    try {
      // Integração com Pyodide ou backend Python
      const result = await runPythonCode(code)
      setOutput(result)
    } catch (error) {
      setOutput(`Erro: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={executeCode}
          disabled={isRunning}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {isRunning ? 'Executando...' : '▶ Executar Célula'}
        </button>
        <button
          onClick={() => setCode('')}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Limpar
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Editor de código */}
        <div className="border rounded">
          <div className="bg-gray-800 text-white px-4 py-2 text-sm">
            Código Python
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 font-mono text-sm p-4 bg-black text-green-400"
            spellCheck="false"
          />
        </div>
        
        {/* Output */}
        <div className="border rounded">
          <div className="bg-gray-100 px-4 py-2 text-sm flex justify-between">
            <span>Output</span>
            <span className="font-mono">In [1]</span>
          </div>
          <pre className="p-4 h-64 overflow-auto bg-white font-mono text-sm">
            {output || 'Execute o código para ver o output...'}
          </pre>
        </div>
      </div>
    </div>
  )
}