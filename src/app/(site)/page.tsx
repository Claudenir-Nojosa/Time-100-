import React from "react";
import Link from "next/link";
import { Loader } from "lucide-react";

const TeamLandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header - Neon Accents */}
      <header className="border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <span className="text-xl font-medium tracking-tighter flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
            <Loader className="text-fuchsia-400 animate-pulse" />
            TIME100%
          </span>
          <nav className="flex space-x-6">
            <Link
              href="/login"
              className="text-purple-300/80 hover:text-purple-200 transition-all duration-300 text-sm font-light tracking-wider"
            >
              ENTRAR
            </Link>
            <Link
              href="/cadastro"
              className="text-white hover:text-fuchsia-300 transition-all duration-300 text-sm font-light tracking-wider"
            >
              CRIAR CONTA
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Neon Futuristic */}
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 w-full">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-none">
              PLATAFORMA{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-500 animate-text">
                EXCLUSIVA
              </span>
            </h1>
            <div className="mt-8 max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <p className="mt-8 text-purple-300/60 text-sm tracking-widest font-light">
              ACESSO RESTRITO • GARAPA
            </p>
            <div className="mt-12 flex justify-center space-x-4">
              <Link
                href="/login"
                className="px-8 py-3.5 border border-purple-500/30 text-sm font-light tracking-wider rounded-sm text-purple-200 hover:bg-purple-900/20 hover:border-purple-400/50 hover:text-white transition-all duration-300 shadow-[0_0_10px_-3px_rgba(192,132,252,0.2)] hover:shadow-[0_0_15px_-3px_rgba(192,132,252,0.3)]"
              >
                ACESSAR CONTA
              </Link>
              <Link
                href="/cadastro"
                className="px-8 py-3.5 text-sm font-medium tracking-wider rounded-sm bg-gradient-to-r from-purple-500 to-fuchsia-500 text-black hover:from-purple-400 hover:to-fuchsia-400 transition-all duration-300 shadow-[0_0_15px_-3px_rgba(217,70,239,0.4)] hover:shadow-[0_0_20px_-3px_rgba(217,70,239,0.6)]"
              >
                CRIAR CONTA
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Glow Effect */}
      <footer className="border-t border-purple-900/30 py-5">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-purple-300/40 tracking-widest">
          © TIME100% — 2025 • SISTEMA PROTEGIDO
        </div>
      </footer>
    </div>
  );
};

export default TeamLandingPage;