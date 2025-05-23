// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  FileText,
  Layers,
  AlertCircle,
  Building,
  Settings,
  LogOut,
  CreditCard,
  User,
  Menu,
  Plane,
  ChevronDown,
  ChevronRight,
  Loader,
  HandCoins,
  PiggyBank,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { createSlug } from "@/lib/utils";

interface SubmenuState {
  "obrigacoes-acessorias": boolean;
  "obrigacoes-principais": boolean;
  empresas: boolean;
}

export default function Sidebar() {
  // Estado inicial vazio - será preenchido após carregar do localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<SubmenuState | null>(null);
  const { data: session } = useSession();

  // Carrega o estado do localStorage quando o componente é montado
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState) {
      const { isCollapsed: savedCollapsed, openSubmenus: savedSubmenus } =
        JSON.parse(savedState);
      setIsCollapsed(savedCollapsed);
      setOpenSubmenus(savedSubmenus);
    } else {
      // Estado padrão se não houver nada salvo
      setIsCollapsed(false);
      setOpenSubmenus({
        "obrigacoes-acessorias": false,
        "obrigacoes-principais": false,
        empresas: false,
      });
    }
  }, []);

  // Salva o estado no localStorage sempre que ele mudar
  useEffect(() => {
    if (isCollapsed !== null && openSubmenus !== null) {
      const stateToSave = {
        isCollapsed,
        openSubmenus,
      };
      localStorage.setItem("sidebarState", JSON.stringify(stateToSave));
    }
  }, [isCollapsed, openSubmenus]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSubmenu = (menu: keyof SubmenuState) => {
    if (openSubmenus) {
      setOpenSubmenus({
        ...openSubmenus,
        [menu]: !openSubmenus[menu],
      });
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Não renderiza até que o estado seja carregado
  if (isCollapsed === null || openSubmenus === null) {
    return <div className="w-16"></div>; // ou algum loader
  }

  return (
    <div
      className={`flex flex-col h-screen bg-background border-r ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
    >
      {/* Topo da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Loader className="text-fuchsia-400 animate-pulse" />
            <span className="text-lg font-bold">Time 100%</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Página Inicial</span>}
            </Link>
          </li>

          {/* Empresas com submenu */}
          <li>
            <div className="flex items-center">
              <Link
                href="/dashboard/empresas"
                className="flex items-center p-2 rounded-lg hover:bg-muted w-full"
              >
                <Building className="h-5 w-5" />
                {!isCollapsed && <span className="ml-2">Empresas</span>}
              </Link>
              {!isCollapsed && (
                <button
                  onClick={() => toggleSubmenu("empresas")}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  {openSubmenus["empresas"] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {!isCollapsed && openSubmenus["empresas"] && (
              <ul className="ml-8 mt-1 space-y-1">
                <li>
                  <Link
                    href="/dashboard/empresas/adicionar"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm dark:hover:bg-muted text-gray-500"
                  >
                    <span className="ml-2">Adicionar Empresa</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/empresas/claudenir"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm dark:hover:bg-muted text-gray-500"
                  >
                    <span className="ml-2">Claudenir</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/empresas/ana-conrado"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm dark:hover:bg-muted text-gray-500"
                  >
                    <span className="ml-2">Ana Conrado</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              href="/dashboard/calendario"
              className={`flex items-center p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Calendar className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Calendário</span>}
            </Link>
          </li>

          {/* Obrigações Acessórias com submenu */}
          <li>
            <div
              onClick={() => toggleSubmenu("obrigacoes-acessorias")}
              className={`flex items-center p-2 rounded-lg hover:bg-muted cursor-pointer ${
                isCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5" />
                {!isCollapsed && (
                  <span className="ml-2">Obrigações Acessórias</span>
                )}
              </div>
              {!isCollapsed &&
                (openSubmenus["obrigacoes-acessorias"] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </div>
            {!isCollapsed && openSubmenus["obrigacoes-acessorias"] && (
              <ul className="ml-8 mt-1 space-y-1">
                {[
                  "EFD ICMS IPI",
                  "DeSTDA",
                  "EFD Contribuições",
                  "GIA",
                  "DIME",
                  "GIA RS",
                  "MIT",
                  "EFD Reinf",
                  "DAPI",
                  "DECLAN"
                ].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/dashboard/obrigacoes/${createSlug(item)}`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm dark:hover:bg-muted text-gray-500"
                    >
                      <span className="ml-2">{item}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Obrigações Principais com submenu */}
          <li>
            <div
              onClick={() => toggleSubmenu("obrigacoes-principais")}
              className={`flex items-center p-2 rounded-lg hover:bg-muted cursor-pointer ${
                isCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center">
                <HandCoins className="h-5 w-5" />
                {!isCollapsed && (
                  <span className="ml-2">Obrigações Principais</span>
                )}
              </div>
              {!isCollapsed &&
                (openSubmenus["obrigacoes-principais"] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </div>
            {!isCollapsed && openSubmenus["obrigacoes-principais"] && (
              <ul className="ml-8 mt-1 space-y-1">
                {["ICMS", "PIS", "COFINS", "IPI"].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/dashboard/obrigacoes/${item.toLowerCase()}`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm dark:hover:bg-muted text-gray-500"
                    >
                      <span className="ml-2">{item}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <Link
              href="/dashboard/pendencias"
              className={`flex items-center p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <AlertCircle className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Pendências</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/parcelamentos"
              className={`flex items-center p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <PiggyBank className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Parcelamentos</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t">
        <ul className="space-y-1">
          <li>
            <div
              className={`flex items-center p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || "Usuário"}
                />
                <AvatarFallback>
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-2">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <Button
              variant="ghost"
              className={`w-full justify-start p-2 rounded-lg hover:bg-muted ${
                isCollapsed ? "justify-center" : ""
              }`}
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
