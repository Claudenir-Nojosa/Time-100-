import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCNPJ(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatRegime(regime: string) {
  const regimes: Record<string, string> = {
    SIMPLES_NACIONAL: "Simples Nacional",
    LUCRO_PRESUMIDO: "Lucro Presumido",
    LUCRO_REAL: "Lucro Real",
  };
  return regimes[regime] || regime;
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Normaliza para decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/[^\w\-]+/g, ""); // Remove caracteres não alfanuméricos
}

export function formatResponsavel(responsavel: string): string {
  const formatMap: Record<string, string> = {
    'CLAUDENIR': 'Claudenir',
  };
  
  return formatMap[responsavel] || responsavel;
}

export function formatarMinutos(minutos: number | undefined): string {
  if (!minutos || minutos <= 0) return '0min';
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas > 0 && mins > 0) {
    return `${horas}h${mins.toString().padStart(2, '0')}m`;
  } else if (horas > 0) {
    return `${horas}h`;
  } else {
    return `${mins}min`;
  }
}