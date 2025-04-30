import React from "react";
import Link from "next/link";

const TeamLandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span className="ml-3 text-xl font-semibold">Time 100%</span>

          <nav className="hidden md:flex space-x-8">
            <Link href="/login" className="text-gray-600 hover:text-blue-600">
              Login
            </Link>
            <Link href="/cadastro" className="text-gray-600 hover:text-blue-600">
              Cadastre-se
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Centralizada */}
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Plataforma exclusiva
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-gray-500">
              Ta em produção ainda cara
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                href="/login"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Acessar minha conta
              </Link>
              <Link
                href="/cadastro"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
              >
                Criar nova conta
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (opcional) */}
      <footer className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          © Garapa
        </div>
      </footer>
    </div>
  );
};

export default TeamLandingPage;
