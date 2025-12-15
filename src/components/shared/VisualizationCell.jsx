// components/notebook/VisualizationCell.jsx
'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export function VisualizationCell({ code, chartData }) {
  const [showChart, setShowChart] = useState(false)

  return (
    <div className="border rounded-lg mb-4">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
        <span className="font-mono text-sm">In [3]</span>
        <button
          onClick={() => setShowChart(!showChart)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
        </button>
      </div>
      
      <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm">
        <pre>{code}</pre>
      </div>
      
      {showChart && (
        <div className="p-4 border-t">
          <div className="text-sm text-gray-500 mb-2">Out [3]</div>
          <div className="h-80">
            <LineChart width={700} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#8884d8" />
              <Line type="monotone" dataKey="area" stroke="#82ca9d" />
            </LineChart>
          </div>
        </div>
      )}
    </div>
  )
}