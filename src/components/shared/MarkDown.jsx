// src/components/notebook/MarkdownCell.jsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Edit, Save, Eye, Code } from "lucide-react";

export function MarkdownCell({
  cellNumber,
  initialContent = "",
  isEditable = false,
}) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="flex font-mono text-sm mb-6">
      {/* Coluna da esquerda */}
      <div className="w-16 flex-shrink-0 text-right pr-3 pt-1 select-none">
        <div className="text-gray-400 text-xs">{cellNumber}</div>
      </div>

      {/* Coluna do conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Controles */}
        {isEditable && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                isEditing ? "bg-blue-100 text-blue-700" : "bg-gray-100"
              }`}
            >
              {isEditing ? <Save size={12} /> : <Edit size={12} />}
              {isEditing ? "Salvar" : "Editar"}
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded"
            >
              {isPreview ? <Code size={12} /> : <Eye size={12} />}
              {isPreview ? "Markdown" : "Preview"}
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="border rounded-lg overflow-hidden">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 font-mono text-sm min-h-[100px] focus:outline-none"
              rows={Math.max(3, content.split("\n").length)}
            />
          ) : isPreview ? (
            <div className="p-4 prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-gray-700">{content}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
