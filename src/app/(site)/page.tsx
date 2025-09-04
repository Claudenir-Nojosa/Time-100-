import React from "react";
import Link from "next/link";
import { Cpu, ArrowRight, Server } from "lucide-react";

const TeamLandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header - Minimalista com detalhes verdes */}
      <header className="border-b border-emerald-900/30">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <span className="text-xl font-medium tracking-tight flex items-center gap-2 text-white">
            <Server className="text-emerald-400" size={20} />
            CZONE
          </span>
          <nav>
            <Link
              href="/login"
              className="text-emerald-300/80 hover:text-emerald-200 transition-all duration-200 text-sm font-medium flex items-center gap-1"
            >
              ENTRAR <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Estilo verde tech */}
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 w-full">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-emerald-900/20 border border-emerald-800/30">
                <Server className="text-emerald-400" size={28} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-none">
              PLATAFORMA{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                EXCLUSIVA
              </span>
            </h1>
            
            <div className="mt-8 max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            
            <p className="mt-8 text-emerald-300/70 text-sm tracking-wide font-light">
              ACESSO RESTRITO • GARAPA
            </p>
            
            <div className="mt-12 flex justify-center">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-sm font-medium tracking-wide rounded text-white hover:from-emerald-500 hover:to-green-500 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/10"
              >
                ACESSAR CONTA <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimalista com detalhes verdes */}
      <footer className="border-t border-emerald-900/30 py-5">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-emerald-400/40 tracking-wide">
          © CZONE — 2025
        </div>
      </footer>
    </div>
  );
};

export default TeamLandingPage;