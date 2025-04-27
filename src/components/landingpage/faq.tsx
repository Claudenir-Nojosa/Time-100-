"use client";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Plus, X, Check, HelpCircle } from "lucide-react"; // Ícones para expandir e fechar
import { useState } from "react"; // Para controlar o estado do ícone

const faqs = [
  {
    question: "O que é o SPED Fiscal?",
    answer: "O SPED Fiscal é um sistema de escrituração digital que substitui a escrituração em papel dos livros fiscais."
  },
  {
    question: "Como converter um arquivo SPED para Excel?",
    answer: "Nosso sistema permite o upload do arquivo SPED e gera um Excel formatado automaticamente."
  },
  {
    question: "Quais são os benefícios do SPED Fiscal?",
    answer: "O SPED Fiscal facilita a fiscalização, reduz custos com papelaria e agiliza processos contábeis."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null); // Controla qual item está aberto

  // Função para determinar o ícone com base na pergunta selecionada
  const getIconForQuestion = (index: number) => {
    switch (index) {
      case 0:
        return <X className="w-12 h-12 text-red-500" />; // Ícone X para a primeira pergunta
      case 1:
        return <Check className="w-12 h-12 text-green-500" />; // Ícone Check para a segunda pergunta
      case 2:
        return <HelpCircle className="w-12 h-12 text-blue-500" />; // Ícone HelpCircle para a terceira pergunta
      default:
        return <Plus className="w-12 h-12 text-gray-700" />; // Ícone padrão
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
      <div className="flex gap-8">
        {/* Lado Esquerdo: Perguntas */}
        <div className="flex-1 space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-4" >
              <Collapsible
                open={openIndex === index}
                onOpenChange={(isOpen) => setOpenIndex(isOpen ? index : null)} 
              >
                {/* Linha da Pergunta */}
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center cursor-pointer hover:text-primary-purple-100">
                    <div className="font-medium text-lg">
                      {faq.question}
                    </div>
                    <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      {openIndex === index ? (
                        <X className="w-5 h-5 text-gray-700" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-700" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Resposta (também recolhe ao clicar) */}
                <CollapsibleContent
                  className="mt-4 text-gray-600 cursor-pointer"
                  onClick={() => setOpenIndex(null)} // Recolhe ao clicar na resposta
                >
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Lado Direito: Ícone Grande */}
        <div className="w-1/3 flex items-center justify-center">
          <Card className="p-8 flex items-center justify-center">
            {openIndex !== null ? (
              getIconForQuestion(openIndex) // Exibe o ícone correspondente à pergunta expandida
            ) : (
              <Plus className="w-12 h-12 text-gray-700" /> // Ícone padrão quando nenhuma pergunta está expandida
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}