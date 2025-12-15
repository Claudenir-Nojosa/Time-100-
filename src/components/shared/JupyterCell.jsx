// src/components/notebook/JupyterCell.jsx
"use client";

import { useState } from "react";
import { Play, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { runPythonCode } from "@/lib/pythonRuntime";

export function JupyterCell({
  cellNumber = 1,
  initialCode = "",
  initialOutput = "",
  showRunButton = true,
  isExecutedInitially = false,
  language = "python",
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState(initialOutput);
  const [isExecuted, setIsExecuted] = useState(isExecutedInitially);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!showRunButton) return;

    setIsRunning(true);
    try {
      const result = await runPythonCode(code);
      setOutput(result);
      setIsExecuted(true);
      setShowOutput(true);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setIsExecuted(true);
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex font-mono text-sm">
      {/* Coluna da esquerda - Números das células (como Jupyter) */}
      <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-200 text-right pr-3 pt-4 select-none">
        <div className="text-gray-500 text-xs">In [{cellNumber}]:</div>
      </div>

      {/* Coluna do meio - Conteúdo principal */}
      <div className="flex-1 min-w-0">
        {/* Área do código */}
        <div className="relative group">
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {showRunButton && (
              <button
                onClick={handleExecute}
                disabled={isRunning}
                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                title="Executar célula"
              >
                <Play size={14} />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1.5 bg-gray-200 rounded hover:bg-gray-300"
              title="Copiar código"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`w-full p-4 font-mono bg-white border ${
              language === "python" ? "text-blue-700" : "text-gray-800"
            } focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none`}
            spellCheck="false"
            rows={Math.max(4, code.split("\n").length)}
            readOnly={!showRunButton}
          />
        </div>

        {/* Área do output (se executado) */}
        {isExecuted && output && (
          <div className="flex">
            <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-200 text-right pr-3 pt-3 select-none">
              <div className="text-gray-500 text-xs">Out [{cellNumber}]:</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="border-t border-gray-200">
                {/* Header do output */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                  <div className="text-xs text-gray-500">Output</div>
                  <button
                    onClick={() => setShowOutput(!showOutput)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {showOutput ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>

                {/* Conteúdo do output */}
                {showOutput && (
                  <div className="p-4 bg-white">
                    <pre className="whitespace-pre-wrap text-gray-800">
                      {output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status de execução */}
        {isRunning && (
          <div className="flex items-center gap-2 p-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Executando célula...
          </div>
        )}
      </div>
    </div>
  );
}
