// app/jupyter-demo/page.jsx
import { JupyterNotebook } from "../../../components/shared/page"

export default function JupyterDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">J</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Jupyter Notebook no Browser
            </h1>
          </div>
          <p className="text-gray-600">
            Interface idêntica ao Jupyter Notebook com execução interativa
          </p>
        </header>

        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">📝 Como usar:</h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>
              Clique no botão{" "}
              <span className="font-mono bg-gray-100 px-1">▶</span> para
              executar uma célula
            </li>
            <li>Clique em "Executar Tudo" para rodar todo o notebook</li>
            <li>Adicione novas células com os botões abaixo</li>
            <li>Edite células de markdown clicando no botão "Editar"</li>
          </ul>
        </div>

        {/* Notebook principal */}
        <JupyterNotebook />

        {/* Informações técnicas */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">
            🔧 Tecnologias usadas:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium">Next.js 14</div>
              <div className="text-xs text-gray-500">Frontend React</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium">Pyodide</div>
              <div className="text-xs text-gray-500">Python no browser</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium">Tailwind CSS</div>
              <div className="text-xs text-gray-500">Estilização</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium">React Markdown</div>
              <div className="text-xs text-gray-500">Renderização MD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
