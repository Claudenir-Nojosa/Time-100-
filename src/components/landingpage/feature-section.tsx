import React from "react";
import { Lock, Wifi, Code } from "lucide-react"; // Importando ícones do Lucide
import { Button } from "../ui/button";

const FeaturesSection = () => {
  const features = [
    {
      icon: <Lock className="w-8 h-8 " />,
      title: "Fully Secure",
      description:
        "Every component in pixkit is meticulously crafted for user interaction.",
    },
    {
      icon: <Wifi className="w-8 h-8 " />,
      title: "Stay Connected",
      description: "Begin our journey to build supremely outstanding websites.",
    },
    {
      icon: <Code className="w-8 h-8 " />,
      title: "Pixel-Perfect",
      description:
        "Commence our journey to develop intricately perfect websites.",
    },
  ];

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        {/* Layout em Duas Colunas */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Coluna Esquerda: Título e Botão */}
          <div className="md:w-1/2 flex flex-col justify-center">
            <div className="text-left mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Embrace the modern design transition
              </h2>
              <p className="text-gray-300">
                Join our quest to create impeccably detailed web pages.
              </p>
            </div>

            {/* Botão com Ícone */}
            <div className="flex justify-start">
              <Button variant={"btn-primary"}>
                <span className="mr-2">View Features</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d="M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM40,76H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24ZM216,180H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Z"></path>
                </svg>
              </Button>
            </div>
          </div>

          {/* Coluna Direita: Carrossel Vertical */}
          <div className="md:w-1/2 relative h-96 overflow-hidden carrossel-container">
            <div className="flex flex-col animate-slide-vertical">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="flex flex-col">
                  {features.map((feature, i) => (
                    <div
                      key={i}
                      className="p-6 border border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow w-full mb-4 bg-gray-900"
                    >
                      <div className="flex items-center mb-4">
                        {feature.icon}
                        <h3 className="text-xl font-semibold text-white ml-3">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-gray-300">{feature.description}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;