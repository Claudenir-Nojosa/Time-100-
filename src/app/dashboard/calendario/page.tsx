"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  X,
  GripVertical,
  Menu,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { CalendarSkeleton } from "@/components/shared/CalendarSkeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Atividade {
  id: string;
  nome: string;
  horario?: string;
  responsavel: string;
  responsavelId: string;
  responsavelImg?: string;
  data: Date;
  concluida: boolean;
  categoria: "apuracao" | "reuniao" | "diagnostico" | "outros";
  ordem?: number;

  // 🆕 CAMPOS PARA VINCULAR ENTREGA
  empresaId?: string;
  obrigacaoId?: string;
  mesReferencia?: string; // Formato: "YYYY-MM"

  // 🆕 NOVOS CAMPOS PARA CONTROLE DE TEMPO
  tempoEstimado?: number;
  tempoReal?: number;
  dataInicio?: Date;
  dataConclusao?: Date;
  emAndamento?: boolean;
  historicoTempo?: SessaoTrabalho[];
}
interface Empresa {
  id: string;
  codigo: string;
  descricao: string;
  cnpj: string;
}

interface Obrigacao {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

interface Entrega {
  id: string;
  empresaId: string;
  obrigacaoId: string;
  mesReferencia: string;
  entregue: boolean;
  dataEntrega: string | null;
}

interface SessaoTrabalho {
  inicio: Date;
  fim?: Date;
  duracao?: number; // em minutos
  emAndamento?: boolean;
}

// Configuração das categorias
const CATEGORIAS = {
  apuracao: {
    label: "Apuração",
    cor: "bg-blue-100 text-blue-800 border-blue-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-blue-500",
  },
  reuniao: {
    label: "Reunião",
    cor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-cyan-500",
  },
  diagnostico: {
    label: "Diagnóstico",
    cor: "bg-orange-100 text-orange-800 border-orange-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-orange-500",
  },
  outros: {
    label: "Outros",
    cor: "bg-gray-100 text-gray-800 border-gray-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-gray-200",
  },
} as const;

type CategoriaType = keyof typeof CATEGORIAS;

// Função para verificar se é dia útil
const isDiaUtil = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Não é domingo (0) nem sábado (6)
};

// Função para encontrar o próximo dia útil
const encontrarProximoDiaUtil = (date: Date): Date => {
  const novaData = new Date(date);

  while (!isDiaUtil(novaData)) {
    novaData.setDate(novaData.getDate() + 1);
  }

  return novaData;
};

// Função para encontrar o dia útil anterior
const encontrarDiaUtilAnterior = (date: Date): Date => {
  const novaData = new Date(date);

  while (!isDiaUtil(novaData)) {
    novaData.setDate(novaData.getDate() - 1);
  }

  return novaData;
};

export default function CalendarioPage() {
  const session = useSession();
  const router = useRouter();
  const [isDeletingMonth, setIsDeletingMonth] = useState(false);
  const [openDeleteMonthDialog, setOpenDeleteMonthDialog] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dragOverAtividade, setDragOverAtividade] = useState<string | null>(
    null
  );
  const [draggedAtividade, setDraggedAtividade] = useState<Atividade | null>(
    null
  );
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [atividadeParaExcluir, setAtividadeParaExcluir] = useState<
    string | null
  >(null);
  const [atividadeParaEditar, setAtividadeParaEditar] =
    useState<Atividade | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [novaAtividade, setNovaAtividade] = useState({
    nome: "",
    horario: "",
    responsavel: session.data?.user.name || "",
    categoria: "apuracao" as "apuracao" | "reuniao" | "diagnostico" | "outros",
    tempoEstimado: undefined as number | undefined,
    // 🆕 NOVOS CAMPOS PARA ENTREGA
    empresaId: "" as string | undefined,
    obrigacaoId: "" as string | undefined,
    mesReferencia: "" as string | undefined,
  });

  const [filtros, setFiltros] = useState<Record<CategoriaType, boolean>>({
    apuracao: true,
    reuniao: true,
    diagnostico: true,
    outros: true,
  });

  const [filtroConcluidas, setFiltroConcluidas] = useState<boolean>(true);
  const [openTempoDialog, setOpenTempoDialog] = useState(false);
  const [atividadeParaTempo, setAtividadeParaTempo] =
    useState<Atividade | null>(null);
  const [openFiltroPopover, setOpenFiltroPopover] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileDayView, setMobileDayView] = useState<Date | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [ultimoClique, setUltimoClique] = useState<{
    id: string;
    timestamp: number;
  } | null>(null);
  const [cliqueTimeout, setCliqueTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Verificar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Cleanup effect para remover classes de drag
  useEffect(() => {
    if (!isReordering) {
      document
        .querySelectorAll(
          ".opacity-50, .border-2, .border-emerald-400, .scale-105, .bg-emerald-100, .dark\\:bg-emerald-900\\/20"
        )
        .forEach((el) => {
          el.classList.remove(
            "opacity-50",
            "border-2",
            "border-emerald-400",
            "scale-105",
            "bg-emerald-100",
            "dark:bg-emerald-900/20"
          );
        });
    }
  }, [isReordering]);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/login");
    }
  }, [session.status, router]);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/atividades");

        // Verifica se a resposta foi bem sucedida
        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`);
        }

        const data = await res.json();

        // DEBUG: Log para verificar o que está vindo da API
        console.log("Dados recebidos da API:", data);

        // Verifica se data é um array antes de usar map
        if (Array.isArray(data)) {
          setAtividades(
            data.map((a: any) => ({
              ...a,
              data: new Date(a.data),
              categoria: a.categoria || "apuracao",
            }))
          );
        } else {
          console.error("Dados não são um array:", data);
          // Se não for array, tenta extrair atividades de uma propriedade
          if (data.atividades && Array.isArray(data.atividades)) {
            setAtividades(
              data.atividades.map((a: any) => ({
                ...a,
                data: new Date(a.data),
                categoria: a.categoria || "apuracao",
              }))
            );
          } else {
            // Se não conseguir encontrar array, define como vazio
            setAtividades([]);
            toast.error("Formato de dados inválido da API");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        toast.error("Erro ao carregar atividades");
        setAtividades([]); // Garante que atividades seja um array vazio em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    if (session.status === "authenticated") {
      fetchAtividades();
    }
  }, [session.status]);
  // 🆕 EFFECT PARA CARREGAR EMPRESAS E OBRIGAÇÕES
  useEffect(() => {
    const fetchDadosEntregas = async () => {
      if (session.status !== "authenticated") return;

      try {
        setLoadingEmpresas(true);

        // Buscar empresas
        const resEmpresas = await fetch("/api/empresas");
        if (resEmpresas.ok) {
          const empresasData = await resEmpresas.json();
          setEmpresas(empresasData);
        }

        // Buscar obrigações do usuário
        const resObrigacoes = await fetch("/api/obrigacoes");
        if (resObrigacoes.ok) {
          const obrigacoesData = await resObrigacoes.json();
          setObrigacoes(obrigacoesData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar empresas e obrigações");
      } finally {
        setLoadingEmpresas(false);
      }
    };

    fetchDadosEntregas();
  }, [session.status]);
  // 🆕 FUNÇÃO PARA SINCRONIZAR ENTREGA
  const sincronizarEntrega = async (
    atividade: Atividade,
    concluida: boolean
  ) => {
    // Verifique se todos os campos necessários estão preenchidos
    if (
      !atividade.empresaId ||
      !atividade.obrigacaoId ||
      !atividade.mesReferencia
    ) {
      console.log("❌ Dados insuficientes para sincronizar entrega:", {
        empresaId: atividade.empresaId,
        obrigacaoId: atividade.obrigacaoId,
        mesReferencia: atividade.mesReferencia,
      });
      return null;
    }

    try {
      console.log("🔄 Sincronizando entrega:", {
        empresaId: atividade.empresaId,
        obrigacaoId: atividade.obrigacaoId,
        mesReferencia: atividade.mesReferencia,
        entregue: concluida,
      });

      const response = await fetch("/api/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: atividade.empresaId,
          obrigacaoId: atividade.obrigacaoId,
          mesReferencia: atividade.mesReferencia,
          entregue: concluida,
        }),
      });

      if (response.ok) {
        const entrega = await response.json();
        console.log("✅ Entrega sincronizada com sucesso:", entrega);
        return entrega;
      } else {
        const errorData = await response.json();
        console.error("❌ Erro na resposta da API:", errorData);
        return null;
      }
    } catch (error) {
      console.error("💥 Erro ao sincronizar entrega:", error);
      return null;
    }
  };

  if (session.status === "loading") {
    return <div>Carregando...</div>;
  }

  if (!session.data) {
    return null;
  }

  // Adicione esta função para deletar todas as atividades do mês
  const deletarAtividadesDoMes = async () => {
    if (!session.data?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsDeletingMonth(true);
    try {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Buscar atividades do mês atual
      const atividadesDoMes = atividades.filter((atividade) => {
        const atividadeDate = new Date(atividade.data);
        return (
          atividadeDate.getMonth() === currentMonth &&
          atividadeDate.getFullYear() === currentYear
        );
      });

      if (atividadesDoMes.length === 0) {
        toast.info("Nenhuma atividade encontrada para excluir este mês");
        setOpenDeleteMonthDialog(false);
        return;
      }

      const response = await fetch("/api/atividades/deletar-mes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir atividades do mês");
      }

      // Remover atividades do estado local
      setAtividades((prev) =>
        prev.filter((atividade) => {
          const atividadeDate = new Date(atividade.data);
          return !(
            atividadeDate.getMonth() === currentMonth &&
            atividadeDate.getFullYear() === currentYear
          );
        })
      );

      toast.success(
        `${atividadesDoMes.length} atividades de ${monthNames[currentMonth]} excluídas com sucesso!`
      );
      setOpenDeleteMonthDialog(false);
    } catch (error) {
      console.error("Erro ao excluir atividades do mês:", error);
      toast.error("Erro ao excluir atividades do mês");
    } finally {
      setIsDeletingMonth(false);
    }
  };

  const atividadesFiltradas = atividades.filter((atividade) => {
    const categoriaFiltrada = filtros[atividade.categoria];
    const concluidaFiltrada = filtroConcluidas ? true : !atividade.concluida;
    return categoriaFiltrada && concluidaFiltrada;
  });

  const getAtividadesDoDia = (date: Date) => {
    return atividadesFiltradas.filter((atividade) => {
      const atividadeDate = new Date(atividade.data);
      return (
        atividadeDate.getDate() === date.getDate() &&
        atividadeDate.getMonth() === date.getMonth() &&
        atividadeDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // FUNÇÃO MELHORADA: Copiar atividades para o próximo mês considerando dias úteis
  const copiarParaProximoMes = async () => {
    if (!session.data?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsCopying(true);
    try {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      // Buscar atividades do mês atual (apenas dias úteis)
      const atividadesDoMes = atividades.filter((atividade) => {
        const atividadeDate = new Date(atividade.data);
        return (
          atividadeDate.getMonth() === currentMonth &&
          atividadeDate.getFullYear() === currentYear &&
          isDiaUtil(atividadeDate) // Só considera dias úteis
        );
      });

      if (atividadesDoMes.length === 0) {
        toast.info(
          "Nenhuma atividade em dias úteis encontrada para copiar este mês"
        );
        return;
      }

      // Agrupar atividades por dia da semana útil (1=segunda, 2=terça, etc)
      const atividadesPorDiaUtil = atividadesDoMes.reduce(
        (acc, atividade) => {
          const atividadeDate = new Date(atividade.data);
          const diaDaSemana = atividadeDate.getDay(); // 0=domingo, 1=segunda, etc

          // Converter para formato de dia útil (1=segunda, 2=terça, ..., 5=sexta)
          const diaUtil = diaDaSemana === 0 ? 7 : diaDaSemana;

          if (!acc[diaUtil]) {
            acc[diaUtil] = [];
          }
          acc[diaUtil].push(atividade);
          return acc;
        },
        {} as Record<number, Atividade[]>
      );

      // Preparar dados para cópia - mapear para os mesmos dias úteis do próximo mês
      const atividadesParaCopiar: any[] = [];
      const diasUteisProximoMes: Date[] = [];

      // Encontrar todos os dias úteis do próximo mês
      const primeiroDiaProximoMes = new Date(nextYear, nextMonth, 1);
      const ultimoDiaProximoMes = new Date(nextYear, nextMonth + 1, 0);

      let dataAtual = new Date(primeiroDiaProximoMes);
      while (dataAtual <= ultimoDiaProximoMes) {
        if (isDiaUtil(dataAtual)) {
          diasUteisProximoMes.push(new Date(dataAtual));
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      // Mapear atividades para os dias úteis correspondentes do próximo mês
      Object.entries(atividadesPorDiaUtil).forEach(
        ([diaUtilStr, atividadesDia]) => {
          const diaUtil = parseInt(diaUtilStr);

          // Encontrar todas as ocorrências deste dia útil no próximo mês
          const diasCorrespondentes = diasUteisProximoMes.filter((data) => {
            const diaDaSemana = data.getDay();
            const diaUtilCorrespondente = diaDaSemana === 0 ? 7 : diaDaSemana;
            return diaUtilCorrespondente === diaUtil;
          });

          // Distribuir as atividades pelos dias correspondentes
          diasCorrespondentes.forEach((data, index) => {
            const atividadesParaEsteDia =
              index < atividadesDia.length
                ? [atividadesDia[index]]
                : atividadesDia.slice(0, 1); // Pelo menos uma atividade por dia

            atividadesParaEsteDia.forEach((atividade) => {
              atividadesParaCopiar.push({
                nome: atividade.nome,
                horario: atividade.horario,
                responsavel: atividade.responsavel,
                responsavelId: atividade.responsavelId,
                responsavelImg: atividade.responsavelImg,
                data: data.toISOString(),
                concluida: false,
                categoria: atividade.categoria,
              });
            });
          });
        }
      );

      if (atividadesParaCopiar.length === 0) {
        toast.info(
          "Nenhuma atividade pôde ser copiada para dias úteis do próximo mês"
        );
        return;
      }

      // Enviar para a API
      const response = await fetch("/api/atividades/copiar-mes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          atividades: atividadesParaCopiar,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao copiar atividades");
      }

      const novasAtividades = await response.json();

      // Atualizar a lista de atividades
      setAtividades((prev) => [...prev, ...novasAtividades]);

      toast.success(
        `${atividadesParaCopiar.length} atividades copiadas para ${monthNames[nextMonth]} (apenas dias úteis)!`
      );

      // Navegar para o próximo mês
      setCurrentDate(new Date(nextYear, nextMonth, 1));
    } catch (error) {
      console.error("Erro ao copiar atividades:", error);
      toast.error("Erro ao copiar atividades para o próximo mês");
    } finally {
      setIsCopying(false);
    }
  };

  const iniciarTimer = async (atividade: Atividade) => {
    try {
      console.log("🟢 INICIANDO TIMER para:", atividade.nome);

      const response = await fetch(`/api/atividades/${atividade.id}/tempo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "iniciar" }),
      });

      if (response.ok) {
        const atividadeAtualizada = await response.json();
        setAtividades((prev) =>
          prev.map((a) =>
            a.id === atividade.id ? { ...a, ...atividadeAtualizada } : a
          )
        );
        toast.success(`⏱️ Timer iniciado para "${atividade.nome}"`, {
          description: "Clique uma vez para parar",
          duration: 2000,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao iniciar timer");
      }
    } catch (error) {
      console.error("💥 Erro completo:", error);
      toast.error("Erro ao iniciar timer");
    }
  };

  const pararTimer = async (atividade: Atividade) => {
    try {
      console.log("🔴 PARANDO TIMER para:", atividade.nome);

      const response = await fetch(`/api/atividades/${atividade.id}/tempo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parar" }),
      });

      if (response.ok) {
        const atividadeAtualizada = await response.json();
        setAtividades((prev) =>
          prev.map((a) =>
            a.id === atividade.id ? { ...a, ...atividadeAtualizada } : a
          )
        );

        const tempoGasto =
          atividadeAtualizada.tempoReal - (atividade.tempoReal || 0);
        const formatarTempo = (minutos: number) => {
          if (minutos === 0) return "0min";
          if (minutos < 60) {
            return `${minutos}min`;
          } else {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return mins > 0 ? `${horas}h${mins}min` : `${horas}h`;
          }
        };

        toast.success(`⏹️ Timer parado para "${atividade.nome}"`, {
          description: `Tempo gasto: ${formatarTempo(tempoGasto)}`,
          duration: 3000,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao parar timer");
      }
    } catch (error) {
      console.error("💥 Erro completo:", error);
      toast.error("Erro ao parar timer");
    }
  };
  // Adicione este useEffect para limpar o timeout
  useEffect(() => {
    return () => {
      if (cliqueTimeout) {
        clearTimeout(cliqueTimeout);
      }
    };
  }, [cliqueTimeout]);

  const definirEstimativa = async (atividade: Atividade, minutos: number) => {
    try {
      const response = await fetch(`/api/atividades/${atividade.id}/tempo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "estimativa", tempoEstimado: minutos }),
      });

      if (response.ok) {
        const atividadeAtualizada = await response.json();
        setAtividades((prev) =>
          prev.map((a) =>
            a.id === atividade.id ? { ...a, ...atividadeAtualizada } : a
          )
        );
        toast.success(`Estimativa definida para ${minutos}min`);
      }
    } catch (error) {
      toast.error("Erro ao definir estimativa");
    }
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    // Remove qualquer destaque anterior de TODAS as células
    document.querySelectorAll(".day-cell").forEach((cell) => {
      cell.classList.remove(
        "bg-emerald-100",
        "dark:bg-emerald-900/20",
        "border-emerald-300",
        "border-2"
      );
    });
  };
  // Função para formato ultra compacto
  const formatarTempoCompacta = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos}m`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h${mins}m` : `${horas}h`;
    }
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Remove qualquer destaque ao sair da célula
    e.currentTarget.classList.remove(
      "bg-emerald-100",
      "dark:bg-emerald-900/20",
      "border-emerald-300",
      "border-2"
    );
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();

    // Remove qualquer destaque imediatamente
    document.querySelectorAll(".day-cell").forEach((cell) => {
      cell.classList.remove(
        "bg-emerald-100",
        "dark:bg-emerald-900/20",
        "border-emerald-300",
        "border-2"
      );
    });

    if (!draggedAtividade) return;

    const draggedDate = new Date(draggedAtividade.data);
    if (
      draggedDate.getDate() === targetDate.getDate() &&
      draggedDate.getMonth() === targetDate.getMonth() &&
      draggedDate.getFullYear() === targetDate.getFullYear()
    ) {
      return;
    }

    try {
      const updatedAtividade = await updateAtividadeDate(
        draggedAtividade.id,
        targetDate
      );
      setAtividades(
        atividades.map((a) =>
          a.id === draggedAtividade.id
            ? { ...updatedAtividade, data: new Date(updatedAtividade.data) }
            : a
        )
      );
      toast.success(
        `Atividade movida para ${targetDate.toLocaleDateString("pt-BR")}`
      );
    } catch (error) {
      toast.error("Erro ao mover atividade");
      console.error("Erro ao mover atividade:", error);
    }
  };

  const updateAtividadeDate = async (id: string, newDate: Date) => {
    const response = await fetch(`/api/atividades/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: newDate.toISOString() }),
    });

    if (!response.ok) throw new Error("Falha ao atualizar atividade");
    return await response.json();
  };

  const handleToggleConcluida = async (atividade: Atividade) => {
    try {
      // Se estiver marcando como concluída e o timer estiver rodando, para primeiro
      if (!atividade.concluida && atividade.emAndamento) {
        await pararTimer(atividade);
      }

      const novaConclusao = !atividade.concluida;

      // 🆕 SINCRONIZAR ENTREGA SE A ATIVIDADE ESTIVER VINCULADA
      if (
        atividade.empresaId &&
        atividade.obrigacaoId &&
        atividade.mesReferencia
      ) {
        await sincronizarEntrega(atividade, novaConclusao);
      }

      const res = await fetch(`/api/atividades/${atividade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...atividade,
          concluida: novaConclusao,
          dataConclusao: novaConclusao ? new Date() : null,
          emAndamento: false,
        }),
      });

      const atividadeAtualizada = await res.json();
      setAtividades(
        atividades.map((a) => (a.id === atividade.id ? atividadeAtualizada : a))
      );

      // 🆕 TOASTS MELHORADOS COM INFO DE ENTREGA
      if (atividadeAtualizada.concluida) {
        const mensagem = atividade.empresaId
          ? `✅ "${atividade.nome}" concluída e entrega sincronizada!`
          : `✅ "${atividade.nome}" concluída!`;

        toast.success(mensagem, {
          description: "Duplo clique para reabrir",
          duration: 3000,
        });
      } else {
        toast.info(`🔄 "${atividade.nome}" reaberta!`, {
          description: "Pronta para trabalhar novamente",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      toast.error("Erro ao atualizar atividade");
    }
  };

  const confirmDelete = (id: string) => {
    setAtividadeParaExcluir(id);
    setOpenDeleteDialog(true);
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const isWeekend = (dayIndex: number) => dayIndex === 0 || dayIndex === 6;

  const handleEditAtividade = (atividade: Atividade) => {
    setAtividadeParaEditar(atividade);
    setNovaAtividade({
      nome: atividade.nome,
      horario: atividade.horario || "",
      responsavel: atividade.responsavel,
      categoria: atividade.categoria,
      tempoEstimado: atividade.tempoEstimado || undefined,
      // 🆕 ADICIONE OS NOVOS CAMPOS
      empresaId: atividade.empresaId || undefined,
      obrigacaoId: atividade.obrigacaoId || undefined,
      mesReferencia: atividade.mesReferencia || undefined,
    });
    setSelectedDate(new Date(atividade.data));
    setOpenDialog(true);
  };

  const handleOpenDialog = (date: Date) => {
    setAtividadeParaEditar(null);
    setNovaAtividade({
      nome: "",
      horario: "",
      responsavel: session.data?.user?.name || "Usuário Atual",
      categoria: "apuracao",
      tempoEstimado: undefined,
      // 🆕 ADICIONE OS NOVOS CAMPOS COM VALORES PADRÃO
      empresaId: undefined,
      obrigacaoId: undefined,
      mesReferencia: undefined,
    });
    setSelectedDate(date);
    setOpenDialog(true);
  };

  const handleDeleteAtividade = async () => {
    if (!atividadeParaExcluir) return;
    const atividade = atividades.find((a) => a.id === atividadeParaExcluir);
    const atividadeNome = atividade?.nome || "Atividade";

    try {
      const deletePromise = fetch(`/api/atividades/${atividadeParaExcluir}`, {
        method: "DELETE",
      });
      toast.promise(deletePromise, {
        loading: `Excluindo "${atividadeNome}"...`,
        success: () => {
          setAtividades(
            atividades.filter((a) => a.id !== atividadeParaExcluir)
          );
          setOpenDeleteDialog(false);
          setAtividadeParaExcluir(null);
          return `"${atividadeNome}" excluída com sucesso!`;
        },
        error: () => `Erro ao excluir "${atividadeNome}"`,
      });
    } catch (error) {
      toast.error("Ocorreu um erro ao excluir a atividade");
      console.error("Erro ao deletar atividade:", error);
    }
  };

  const handleAddAtividade = async () => {
    if (!selectedDate || !novaAtividade.nome) return;

    try {
      const createPromise = fetch("/api/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaAtividade,
          responsavelId: session.data?.user.id,
          responsavelImg: session.data?.user.image,
          data: selectedDate.toISOString(),
          tempoEstimado: novaAtividade.tempoEstimado,
          // 🆕 INCLUIR CAMPOS DE ENTREGA
          empresaId: novaAtividade.empresaId || null,
          obrigacaoId: novaAtividade.obrigacaoId || null,
          mesReferencia: novaAtividade.mesReferencia || null,
        }),
      }).then((res) => res.json());

      toast.promise(createPromise, {
        loading: `Criando "${novaAtividade.nome}"...`,
        success: (atividadeCriada) => {
          setAtividades([...atividades, atividadeCriada]);
          setNovaAtividade({
            nome: "",
            horario: "",
            responsavel: session.data?.user.name || "",
            categoria: "apuracao",
            tempoEstimado: undefined,
            // 🆕 RESETAR CAMPOS DE ENTREGA
            empresaId: undefined,
            obrigacaoId: undefined,
            mesReferencia: undefined,
          });
          setOpenDialog(false);

          const mensagem = novaAtividade.empresaId
            ? `"${novaAtividade.nome}" criada com vínculo de entrega!`
            : `"${novaAtividade.nome}" criada com sucesso!`;

          return mensagem;
        },
        error: () => `Erro ao criar "${novaAtividade.nome}"`,
      });
    } catch (error) {
      toast.error("Ocorreu um erro ao criar a atividade");
      console.error("Erro ao criar atividade:", error);
    }
  };

  const handleUpdateAtividade = async () => {
    if (!atividadeParaEditar || !novaAtividade.nome) return;

    try {
      const updatePromise = fetch(`/api/atividades/${atividadeParaEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaAtividade,
          data: selectedDate?.toISOString(),
          tempoEstimado: novaAtividade.tempoEstimado,
          // 🆕 INCLUIR CAMPOS DE ENTREGA
          empresaId: novaAtividade.empresaId || null,
          obrigacaoId: novaAtividade.obrigacaoId || null,
          mesReferencia: novaAtividade.mesReferencia || null,
        }),
      }).then((res) => res.json());

      toast.promise(updatePromise, {
        loading: `Atualizando "${novaAtividade.nome}"...`,
        success: (atividadeAtualizada) => {
          setAtividades(
            atividades.map((a) =>
              a.id === atividadeParaEditar.id ? atividadeAtualizada : a
            )
          );
          setAtividadeParaEditar(null);
          setNovaAtividade({
            nome: "",
            horario: "",
            responsavel: session.data?.user.name || "",
            categoria: "apuracao",
            tempoEstimado: undefined,
            empresaId: undefined,
            obrigacaoId: undefined,
            mesReferencia: undefined,
          });
          setOpenDialog(false);

          const mensagem = novaAtividade.empresaId
            ? `"${novaAtividade.nome}" atualizada com vínculo de entrega!`
            : `"${novaAtividade.nome}" atualizada com sucesso!`;

          return mensagem;
        },
        error: () => `Erro ao atualizar "${novaAtividade.nome}"`,
      });
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar a atividade");
      console.error("Erro ao atualizar atividade:", error);
    }
  };

  const reordenarAtividades = async (
    atividadeId: string,
    novaOrdem: number,
    data: Date
  ) => {
    try {
      const response = await fetch(`/api/atividades/${atividadeId}/reordenar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: novaOrdem, data: data.toISOString() }),
      });

      if (!response.ok) throw new Error("Falha ao reordenar atividade");
      const atividadeAtualizada = await response.json();
      setAtividades((prev) =>
        prev.map((a) => (a.id === atividadeId ? { ...a, ordem: novaOrdem } : a))
      );
      return atividadeAtualizada;
    } catch (error) {
      console.error("Erro ao reordenar atividade:", error);
      throw error;
    }
  };

  // Handlers para drag and drop vertical
  const handleVerticalDragStart = (
    e: React.DragEvent,
    atividade: Atividade
  ) => {
    e.dataTransfer.setData("text/plain", atividade.id);
    setDraggedAtividade(atividade);
    setIsReordering(true);
  };

  const handleVerticalDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    setIsReordering(false);
    setDragOverAtividade(null);
  };

  const handleVerticalDragOver = (e: React.DragEvent, atividadeId: string) => {
    e.preventDefault();
    setDragOverAtividade(atividadeId);
    e.currentTarget.classList.add("border-2", "border-emerald-400");
  };

  const handleVerticalDragLeave = (e: React.DragEvent) => {
    setDragOverAtividade(null);
    e.currentTarget.classList.remove("border-2", "border-emerald-400");
  };

  const handleVerticalDrop = async (
    e: React.DragEvent,
    targetAtividadeId: string,
    date: Date
  ) => {
    e.preventDefault();
    setIsReordering(false);
    setDragOverAtividade(null);

    // Limpa todas as classes de estilo
    document
      .querySelectorAll(".opacity-50, .border-2, .border-emerald-400")
      .forEach((el) => {
        el.classList.remove("opacity-50", "border-2", "border-emerald-400");
      });

    if (!draggedAtividade || draggedAtividade.id === targetAtividadeId) return;

    try {
      const atividadesDoDia = atividades
        .filter((a) => {
          const atividadeDate = new Date(a.data);
          return (
            atividadeDate.getDate() === date.getDate() &&
            atividadeDate.getMonth() === date.getMonth() &&
            atividadeDate.getFullYear() === date.getFullYear()
          );
        })
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

      const targetIndex = atividadesDoDia.findIndex(
        (a) => a.id === targetAtividadeId
      );
      const draggedIndex = atividadesDoDia.findIndex(
        (a) => a.id === draggedAtividade.id
      );

      if (targetIndex === -1 || draggedIndex === -1) return;

      const novasAtividades = [...atividadesDoDia];
      const [removed] = novasAtividades.splice(draggedIndex, 1);
      novasAtividades.splice(targetIndex, 0, removed);

      const atividadesAtualizadas = await Promise.all(
        novasAtividades.map(async (atividade, index) => {
          if (atividade.ordem !== index) {
            return await reordenarAtividades(atividade.id, index, date);
          }
          return atividade;
        })
      );

      setAtividades((prev) =>
        prev.map((a) => {
          const updated = atividadesAtualizadas.find((ua) => ua.id === a.id);
          return updated || a;
        })
      );

      toast.success("Ordem das atividades atualizada!");
    } catch (error) {
      toast.error("Erro ao reordenar atividades");
      console.error("Erro ao reordenar:", error);
    }
  };
  // 🆕 ADICIONE ESTA FUNÇÃO NO COMPONENTE PRINCIPAL (fora do renderAtividadesDoDia)
  const handleCliqueAtividade = (e: React.MouseEvent, atividade: Atividade) => {
    e.stopPropagation();

    const agora = Date.now();
    const ehDuploClique =
      ultimoClique &&
      ultimoClique.id === atividade.id &&
      agora - ultimoClique.timestamp < 300; // 300ms para duplo clique

    if (cliqueTimeout) {
      clearTimeout(cliqueTimeout);
      setCliqueTimeout(null);
    }

    if (ehDuploClique) {
      // 🟢 DUPLO CLIQUE - Concluir/Desconcluir
      setUltimoClique(null);
      handleToggleConcluida(atividade);
    } else {
      // 🔵 CLIQUE ÚNICO - Controlar timer
      setUltimoClique({ id: atividade.id, timestamp: agora });

      // Se não for duplo clique, espera um pouco antes de executar o clique único
      const timeout = setTimeout(() => {
        if (atividade.emAndamento) {
          // Se timer está ativo, para o timer
          pararTimer(atividade);
        } else {
          // Se timer não está ativo, inicia o timer (só se não estiver concluída)
          if (!atividade.concluida) {
            iniciarTimer(atividade);
          }
        }
        setUltimoClique(null);
      }, 200);

      setCliqueTimeout(timeout);
    }
  };
  // 🆕 ADICIONE ESTA FUNÇÃO NO COMPONENTE PRINCIPAL
  const formatarTempo = (minutos: number) => {
    if (minutos === 0) return "0min";
    if (minutos < 60) {
      return `${minutos}min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h${mins}min` : `${horas}h`;
    }
  };
  const renderAtividadesDoDia = (
    atividadesDoDia: Atividade[],
    currentDay: Date
  ) => {
    const atividadesOrdenadas = [...atividadesDoDia].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );

    return atividadesOrdenadas.map((atividade) => {
      const categoriaConfig = CATEGORIAS[atividade.categoria];
      const estilo = atividade.concluida
        ? categoriaConfig.corConcluida
        : categoriaConfig.cor;

      return (
        <div
          key={atividade.id}
          className={`text-xs p-1.5 rounded cursor-pointer relative group border ${estilo}
          hover:shadow-md transition-all
          ${dragOverAtividade === atividade.id ? "border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : ""}
          ${draggedAtividade?.id === atividade.id ? "" : ""}`}
          onClick={(e) => handleCliqueAtividade(e, atividade)} // 🆕 Agora passamos a atividade como parâmetro
          draggable
          onDragStart={(e) => handleVerticalDragStart(e, atividade)}
          onDragEnd={handleVerticalDragEnd}
          onDragOver={(e) => handleVerticalDragOver(e, atividade.id)}
          onDragLeave={handleVerticalDragLeave}
          onDrop={(e) => handleVerticalDrop(e, atividade.id, currentDay)}
        >
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>

          <div className="flex justify-between items-start gap-2 ml-4">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Avatar className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5">
                <AvatarImage
                  src={atividade.responsavelImg || ""}
                  alt={atividade.responsavel}
                  className="object-cover"
                />
                <AvatarFallback className="text-[10px] md:text-xs bg-gray-100">
                  {atividade.responsavel
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1">
                {atividade.horario && (
                  <span className="font-medium text-xs whitespace-nowrap">
                    {atividade.horario}
                  </span>
                )}
                <span className="text-xs break-words line-clamp-2 leading-tight">
                  {atividade.nome}
                </span>

                {/* 🆕 INDICADOR MINIMALISTA DE STATUS */}
                <div className="flex items-center gap-1.5 mt-1">
                  {atividade.emAndamento && (
                    <span className="text-[9px] text-red-600 font-medium bg-red-50 px-1 py-0.5 rounded-full">
                      ● Andamento
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-0.5 opacity-80">
                  {CATEGORIAS[atividade.categoria].label}
                </span>
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-1">
              {/* 🆕 ÍCONE DE TIMER */}
              <button
                className="text-blue-500 opacity-0 group-hover:opacity-100 hover:bg-blue-100 rounded-full p-0.5 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setAtividadeParaTempo(atividade);
                  setOpenTempoDialog(true);
                }}
                title="Ver detalhes de tempo"
              >
                <Clock className="h-3 w-3" />
              </button>

              <button
                className="text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full p-0.5 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAtividade(atividade);
                }}
                title="Editar atividade"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-full p-0.5 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(atividade.id);
                }}
                title="Excluir atividade"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  // E na função renderDays, ajuste as células do calendário:
  const renderDays = () => {
    const days = [];
    let day = 1;

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startingDayOfWeek - i - 1));
      const dayIndex = i % 7;
      days.push(
        <div
          key={`empty-${i}`}
          className={`min-h-24 sm:min-h-28 md:min-h-36 lg:min-h-40 p-1 sm:p-1.5 md:p-2 border dark:border-emerald-900/40 ${
            isWeekend(dayIndex)
              ? "dark:bg-gray-900 bg-emerald-50/30"
              : "dark:bg-gray-950 bg-white"
          } text-gray-400 dark:text-emerald-500/70`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm">{prevDate.getDate()}</span>
          </div>
        </div>
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dayIndex = currentDay.getDay();
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const atividadesDoDia = getAtividadesDoDia(currentDay);

      // CÁLCULO DO PERCENTUAL DE CONCLUSÃO
      const totalAtividades = atividadesDoDia.length;
      const atividadesConcluidas = atividadesDoDia.filter(
        (a) => a.concluida
      ).length;
      const percentualConclusao =
        totalAtividades > 0
          ? Math.round((atividadesConcluidas / totalAtividades) * 100)
          : 0;

      days.push(
        <div
          key={`day-${i}`}
          className={`day-cell min-h-24 sm:min-h-28 md:min-h-36 lg:min-h-40 p-1 sm:p-1.5 md:p-2 border dark:border-emerald-900/40 transition-all flex flex-col
          ${isToday ? "dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600" : ""}
          ${isWeekend(dayIndex) ? "dark:bg-gray-900 bg-emerald-50/30" : "dark:bg-gray-950 bg-white"}
          ${isMobileView ? "cursor-pointer" : ""}`}
          onDragOver={(e) => handleDragOver(e, currentDay)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, currentDay)}
          onClick={() => isMobileView && setMobileDayView(currentDay)}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1">
              <span
                className={`text-xs sm:text-sm font-medium ${
                  isToday
                    ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-[0_0_6px_0_rgba(192,132,252,0.7)]"
                    : "dark:text-emerald-100 text-gray-800"
                }`}
              >
                {i}
              </span>

              {/* INDICADOR MELHORADO: Quantidade + Percentual */}
              {/* INDICADOR MELHORADO: Quantidade + Percentual */}
              {totalAtividades > 0 && (
                <div className="flex flex-col gap-0.5 ml-1 min-w-[40px]">
                  <div className="flex items-center gap-0.5 justify-between">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        percentualConclusao === 100
                          ? "bg-green-500"
                          : percentualConclusao >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      title={`${percentualConclusao}% concluído (${atividadesConcluidas}/${totalAtividades})`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                      {atividadesConcluidas}/{totalAtividades}
                    </span>
                  </div>

                  {/* BARRA DE PROGRESSO MAIOR */}
                  {totalAtividades > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentualConclusao === 100
                            ? "bg-green-500"
                            : percentualConclusao >= 50
                              ? "bg-yellow-500"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${percentualConclusao}%` }}
                        title={`${percentualConclusao}% concluído`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isMobileView && (
              <button
                onClick={() => handleOpenDialog(currentDay)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 sm:p-1"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>

          {!isMobileView && (
            <div className="mt-1 flex-1 space-y-1 overflow-y-auto">
              {renderAtividadesDoDia(atividadesDoDia, currentDay)}
            </div>
          )}

          {isMobileView && atividadesDoDia.length > 0 && (
            <div className="mt-1 flex justify-center">
              <div className="flex flex-wrap gap-0.5">
                {atividadesDoDia.slice(0, 3).map((atividade) => {
                  const categoriaConfig = CATEGORIAS[atividade.categoria];
                  return (
                    <div
                      key={atividade.id}
                      className={`w-2 h-2 rounded-full ${categoriaConfig.corEscura} ${
                        atividade.concluida ? "opacity-50" : ""
                      }`}
                      title={atividade.nome}
                    ></div>
                  );
                })}
                {atividadesDoDia.length > 3 && (
                  <span className="text-[10px] text-gray-500">
                    +{atividadesDoDia.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;

    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dayIndex = (startingDayOfWeek + daysInMonth + i - 1) % 7;
      days.push(
        <div
          key={`next-${i}`}
          className={`min-h-24 sm:min-h-28 md:min-h-36 lg:min-h-40 p-1 sm:p-1.5 md:p-2 border dark:border-emerald-900/40 ${
            isWeekend(dayIndex)
              ? "dark:bg-gray-900 bg-emerald-50/30"
              : "dark:bg-gray-950 bg-white"
          } text-gray-400 dark:text-emerald-500/70`}
          onDragOver={(e) => handleDragOver(e, nextDate)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nextDate)}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm">{i}</span>
          </div>
        </div>
      );
    }

    return days;
  };

  const renderMobileDayView = () => {
    if (!mobileDayView) return null;

    const atividadesDoDia = getAtividadesDoDia(mobileDayView);
    const isToday = mobileDayView.toDateString() === new Date().toDateString();

    return (
      <Sheet
        open={!!mobileDayView}
        onOpenChange={(open) => !open && setMobileDayView(null)}
      >
        <SheetContent
          side="bottom"
          className="h-3/4 rounded-t-2xl max-w-md mx-auto"
        >
          <SheetHeader className="mb-4 text-center px-10">
            <SheetTitle className="flex flex-col items-center">
              <span className="text-lg font-semibold">
                {mobileDayView.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm text-gray-500 font-normal">
                {mobileDayView.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {isToday && (
                <span className="text-xs text-emerald-600 mt-1 bg-emerald-100 px-2 py-1 rounded-full">
                  Hoje
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="absolute top-4 leftt-4">
            <Button
              size="icon"
              onClick={() => {
                handleOpenDialog(mobileDayView);
                setMobileDayView(null);
              }}
              className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 overflow-y-auto h-full pb-20 pt-2">
            {atividadesDoDia.length > 0 ? (
              <div className="px-2">
                {atividadesDoDia.map((atividade) => {
                  const categoriaConfig = CATEGORIAS[atividade.categoria];
                  const estilo = atividade.concluida
                    ? categoriaConfig.corConcluida
                    : categoriaConfig.cor;

                  return (
                    <div
                      key={atividade.id}
                      className={`p-3 rounded-lg border mb-2 ${estilo}`}
                      onClick={() => handleToggleConcluida(atividade)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {atividade.horario && (
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {atividade.horario}
                            </div>
                          )}
                          <div className="text-sm font-medium mb-1">
                            {atividade.nome}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                              {categoriaConfig.label}
                            </span>
                            <div className="flex items-center text-xs text-gray-600">
                              <Avatar className="h-5 w-5 mr-1">
                                <AvatarImage
                                  src={atividade.responsavelImg || ""}
                                  alt={atividade.responsavel}
                                />
                                <AvatarFallback className="text-xs">
                                  {atividade.responsavel
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-20">
                                {atividade.responsavel.split(" ")[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <button
                            className="text-gray-500 hover:text-gray-700 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAtividade(atividade);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(atividade.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-lg font-medium mb-2">
                  Nenhuma atividade
                </div>
                <div className="text-sm">Para este dia</div>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    handleOpenDialog(mobileDayView);
                    setMobileDayView(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar atividade
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold dark:text-emerald-100 text-gray-800">
          Calendário
        </h1>
        <div className="flex items-center space-x-2 md:space-x-4 dark:bg-emerald-950/20 bg-white rounded-lg shadow-sm p-2 border dark:border-emerald-900/30 border-gray-200 w-full md:w-auto justify-between">
          <div className="flex items-center">
            <Popover
              open={openFiltroPopover}
              onOpenChange={setOpenFiltroPopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size={isMobileView ? "sm" : "default"}
                  className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
                >
                  <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Filtrar</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 dark:bg-black dark:border-emerald-900/30">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium dark:text-emerald-100">
                      Categorias
                    </h4>
                    <div className="grid gap-2">
                      {Object.entries(CATEGORIAS).map(([key, categoria]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${key}`}
                            checked={filtros[key as CategoriaType]}
                            onCheckedChange={(checked) => {
                              setFiltros((prev) => ({
                                ...prev,
                                [key]: checked === true,
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`filter-${key}`}
                            className="text-sm font-normal dark:text-emerald-100"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${categoria.corEscura}`}
                              ></div>
                              {categoria.label}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium dark:text-emerald-100">
                      Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-concluidas"
                        checked={filtroConcluidas}
                        onCheckedChange={(checked) =>
                          setFiltroConcluidas(checked === true)
                        }
                      />
                      <Label
                        htmlFor="filter-concluidas"
                        className="text-sm font-normal dark:text-emerald-200"
                      >
                        Mostrar concluídas
                      </Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* NOVO BOTÃO: Copiar para o próximo mês */}
            <Button
              variant="outline"
              size={isMobileView ? "sm" : "default"}
              onClick={copiarParaProximoMes}
              disabled={isCopying}
              className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
            >
              <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">
                {isCopying ? "Copiando..." : "Copiar Mês"}
              </span>
            </Button>
            {/* NOVO BOTÃO: Deletar atividades do mês */}
            <Button
              variant="outline"
              size={isMobileView ? "sm" : "default"}
              onClick={() => setOpenDeleteMonthDialog(true)}
              disabled={isDeletingMonth}
              className="dark:border-red-900/30 dark:hover:bg-red-900/20 ml-2 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">
                {isDeletingMonth ? "Excluindo..." : "Limpar Mês"}
              </span>
            </Button>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              variant="ghost"
              size={isMobileView ? "sm" : "default"}
              onClick={prevMonth}
              className="dark:hover:bg-emerald-900/30 hover:bg-emerald-100 rounded-full p-1 md:p-2"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 dark:text-emerald-300 text-emerald-600" />
            </Button>
            <h2 className="text-sm md:text-xl font-semibold dark:text-emerald-100 text-gray-700 min-w-[120px] md:min-w-[180px] text-center">
              {monthNames[month]} {year}
            </h2>
            <Button
              variant="ghost"
              size={isMobileView ? "sm" : "default"}
              onClick={nextMonth}
              className="dark:hover:bg-emerald-900/30 hover:bg-emerald-100 rounded-full p-1 md:p-2"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 dark:text-emerald-300 text-emerald-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legenda de categorias - Ocultar em mobile para economizar espaço */}
      {!isMobileView && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 dark:bg-emerald-950/10 bg-white rounded-lg border dark:border-emerald-900/30 border-gray-200">
          {/* Categorias */}
          {Object.entries(CATEGORIAS).map(([key, categoria]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${categoria.corEscura}`}
              ></div>
              <span className="text-sm dark:text-emerald-100">
                {categoria.label}
              </span>
            </div>
          ))}

          {/* Concluído */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm dark:text-emerald-100">Concluído</span>
          </div>
        </div>
      )}

      {/* Grid do Calendário */}
      <div className="dark:bg-emerald-950/10 bg-white rounded-xl shadow-sm overflow-hidden border dark:border-emerald-900/30 border-gray-200">
        <div className="grid grid-cols-7 gap-px dark:bg-emerald-950/20 bg-gray-50 border-b dark:border-emerald-900/30 border-gray-200">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`py-2 md:py-3 text-center font-medium text-xs md:text-sm 
                ${
                  isWeekend(index)
                    ? "dark:text-emerald-300 text-emerald-600 dark:bg-emerald-950/10 bg-emerald-50/30"
                    : "dark:text-emerald-100 text-gray-700"
                }`}
            >
              {isMobileView ? day.charAt(0) : day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <CalendarSkeleton isMobile={isMobileView} />
        ) : (
          <div className="grid grid-cols-7 gap-px dark:bg-gray-950 bg-gray-100">
            {renderDays()}
          </div>
        )}
      </div>

      {renderMobileDayView()}

      {/* Dialog para adicionar/editar atividade */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => !open && setOpenDialog(false)}
      >
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-emerald-900/30 bg-white mx-2 md:mx-0">
          <DialogHeader>
            <DialogTitle className="dark:text-emerald-100">
              {atividadeParaEditar ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="nome"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Nome:
              </label>
              <Input
                id="nome"
                value={novaAtividade.nome}
                onChange={(e) =>
                  setNovaAtividade({ ...novaAtividade, nome: e.target.value })
                }
                className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                placeholder="Nome da atividade"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="categoria"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Categoria:
              </label>
              <Select
                value={novaAtividade.categoria}
                onValueChange={(
                  value: "apuracao" | "reuniao" | "diagnostico" | "outros"
                ) => setNovaAtividade({ ...novaAtividade, categoria: value })}
              >
                <SelectTrigger className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-950 dark:border-emerald-900/30">
                  <SelectItem
                    value="apuracao"
                    className="dark:hover:bg-emerald-900/30 dark:focus:bg-emerald-900/30 cursor-pointer"
                  >
                    Apuração
                  </SelectItem>
                  <SelectItem
                    value="reuniao"
                    className="dark:hover:bg-emerald-900/30 dark:focus:bg-emerald-900/30 cursor-pointer"
                  >
                    Reunião
                  </SelectItem>
                  <SelectItem
                    value="diagnostico"
                    className="dark:hover:bg-emerald-900/30 dark:focus:bg-emerald-900/30 cursor-pointer"
                  >
                    Diagnóstico
                  </SelectItem>
                  <SelectItem
                    value="outros"
                    className="dark:hover:bg-emerald-900/30 dark:focus:bg-emerald-900/30 cursor-pointer"
                  >
                    Outros
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="horario"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Horário:
              </label>
              <Input
                id="horario"
                type="time"
                value={novaAtividade.horario}
                onChange={(e) =>
                  setNovaAtividade({
                    ...novaAtividade,
                    horario: e.target.value,
                  })
                }
                className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="responsavel"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Responsável:
              </label>
              <Input
                id="responsavel"
                value={novaAtividade.responsavel}
                readOnly
                className="col-span-3 dark:bg-emerald-950/30 dark:border-emerald-900/30"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="data"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Data:
              </label>
              <Input
                id="data"
                value={selectedDate?.toLocaleDateString("pt-BR")}
                readOnly
                className="col-span-3 dark:bg-emerald-950/30 dark:border-emerald-900/30"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="tempoEstimado"
                className="text-right dark:text-emerald-200 text-sm"
              >
                Tempo Estimado (min):
              </label>
              <Input
                id="tempoEstimado"
                type="number"
                value={novaAtividade.tempoEstimado || ""}
                onChange={(e) =>
                  setNovaAtividade({
                    ...novaAtividade,
                    tempoEstimado: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                placeholder="Tempo em minutos"
              />
            </div>
            {/* 🆕 SEÇÃO DE VINCULO COM ENTREGA */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 dark:text-emerald-100 text-sm">
                📋 Vincular à Entrega (Opcional)
              </h4>

              <div className="grid gap-3">
                {/* EMPRESA */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="empresa"
                    className="text-right dark:text-emerald-200 text-sm"
                  >
                    Empresa:
                  </label>
                  <Select
                    value={novaAtividade.empresaId || "none"}
                    onValueChange={(value) =>
                      setNovaAtividade({
                        ...novaAtividade,
                        empresaId: value === "none" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-950 dark:border-emerald-900/30 max-h-60">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.codigo} - {empresa.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OBRIGAÇÃO */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="obrigacao"
                    className="text-right dark:text-emerald-200 text-sm"
                  >
                    Obrigação:
                  </label>
                  <Select
                    value={novaAtividade.obrigacaoId || "none"}
                    onValueChange={(value) =>
                      setNovaAtividade({
                        ...novaAtividade,
                        obrigacaoId: value === "none" ? undefined : value,
                      })
                    }
                    disabled={!novaAtividade.empresaId}
                  >
                    <SelectTrigger className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                      <SelectValue
                        placeholder={
                          novaAtividade.empresaId
                            ? "Selecione a obrigação"
                            : "Selecione primeiro a empresa"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-950 dark:border-emerald-900/30 max-h-60">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {obrigacoes.map((obrigacao) => (
                        <SelectItem key={obrigacao.id} value={obrigacao.id}>
                          {obrigacao.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* MÊS REFERÊNCIA */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="mesReferencia"
                    className="text-right dark:text-emerald-200 text-sm"
                  >
                    Mês Ref.:
                  </label>
                  <Input
                    type="month"
                    value={novaAtividade.mesReferencia || ""}
                    onChange={(e) =>
                      setNovaAtividade({
                        ...novaAtividade,
                        mesReferencia: e.target.value || undefined,
                      })
                    }
                    className="col-span-3 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                    disabled={
                      !novaAtividade.empresaId || !novaAtividade.obrigacaoId
                    }
                  />
                </div>

                {/* INFO */}
                {novaAtividade.empresaId &&
                  novaAtividade.obrigacaoId &&
                  novaAtividade.mesReferencia && (
                    <div className="col-span-4 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      ✅ Ao concluir esta atividade, a entrega será marcada como
                      concluída automaticamente.
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
              onClick={() => setOpenDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
              onClick={
                atividadeParaEditar ? handleUpdateAtividade : handleAddAtividade
              }
              disabled={!novaAtividade.nome}
            >
              {atividadeParaEditar ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-emerald-900/30 bg-white border-2 mx-2 md:mx-0">
          <DialogHeader>
            <DialogTitle className="dark:text-emerald-100">
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <p className="dark:text-emerald-200">
            Tem certeza que deseja excluir esta atividade?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="dark:bg-red-900/80 dark:hover:bg-red-900"
              onClick={handleDeleteAtividade}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog de Detalhes de Tempo */}
      <Dialog open={openTempoDialog} onOpenChange={setOpenTempoDialog}>
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-emerald-900/30 bg-white mx-2 md:mx-0">
          <DialogHeader>
            <DialogTitle className="dark:text-emerald-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Controle de Tempo
            </DialogTitle>
          </DialogHeader>

          {atividadeParaTempo && (
            <div className="space-y-6 py-4">
              {/* CABEÇALHO */}
              <div className="text-center">
                <h3 className="font-semibold text-lg dark:text-white">
                  {atividadeParaTempo.nome}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {CATEGORIAS[atividadeParaTempo.categoria].label}
                </p>
              </div>

              {/* ESTATÍSTICAS PRINCIPAIS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatarTempo(atividadeParaTempo.tempoReal || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Tempo Gasto
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {formatarTempo(atividadeParaTempo.tempoEstimado || 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Tempo Estimado
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESSO */}
              {atividadeParaTempo.tempoEstimado &&
                atividadeParaTempo.tempoEstimado > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Progresso
                      </span>
                      <span className="font-medium">
                        {Math.round(
                          ((atividadeParaTempo.tempoReal || 0) /
                            atividadeParaTempo.tempoEstimado) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (atividadeParaTempo.tempoReal || 0) <=
                          atividadeParaTempo.tempoEstimado
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(100, ((atividadeParaTempo.tempoReal || 0) / atividadeParaTempo.tempoEstimado) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              {/* STATUS */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm dark:text-white">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {atividadeParaTempo.emAndamento && (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Timer Ativo
                    </span>
                  )}
                  {atividadeParaTempo.concluida && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                      ✓ Concluída
                    </span>
                  )}
                  {atividadeParaTempo.dataInicio && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                      🗓️ Iniciada
                    </span>
                  )}
                </div>
              </div>

              {/* HISTÓRICO DE SESSÕES */}
              {atividadeParaTempo.historicoTempo &&
                Array.isArray(atividadeParaTempo.historicoTempo) &&
                atividadeParaTempo.historicoTempo.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm dark:text-white">
                      Sessões de Trabalho
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {atividadeParaTempo.historicoTempo.map(
                        (sessao: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <span>
                              {new Date(sessao.inicio).toLocaleTimeString(
                                "pt-BR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                              {sessao.fim &&
                                ` - ${new Date(sessao.fim).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}`}
                            </span>
                            <span className="font-medium text-blue-600">
                              {sessao.duracao
                                ? `${sessao.duracao}min`
                                : "Em andamento"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* AÇÕES RÁPIDAS */}
              <div className="flex gap-2 pt-4">
                {!atividadeParaTempo.concluida && (
                  <>
                    {!atividadeParaTempo.emAndamento ? (
                      <Button
                        onClick={() => {
                          iniciarTimer(atividadeParaTempo);
                          setOpenTempoDialog(false);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        ▶ Iniciar Timer
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          pararTimer(atividadeParaTempo);
                          setOpenTempoDialog(false);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        ⏹️ Parar Timer
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setOpenTempoDialog(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog de confirmação para deletar atividades do mês */}
      <Dialog
        open={openDeleteMonthDialog}
        onOpenChange={setOpenDeleteMonthDialog}
      >
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-red-900/30 bg-white border-2 mx-2 md:mx-0">
          <DialogHeader>
            <DialogTitle className="dark:text-red-100 text-red-600">
              ⚠️ Confirmar Exclusão em Lote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="dark:text-red-200 text-red-700 font-medium">
              Tem certeza que deseja excluir TODAS as atividades de{" "}
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}?
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm dark:text-red-200 text-red-600">
                📋 <strong>Esta ação não pode ser desfeita!</strong>
                <br />
                Todas as atividades, concluídas e pendentes, serão
                permanentemente excluídas.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => setOpenDeleteMonthDialog(false)}
              disabled={isDeletingMonth}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="dark:bg-red-900/80 dark:hover:bg-red-900 bg-red-600 hover:bg-red-700"
              onClick={deletarAtividadesDoMes}
              disabled={isDeletingMonth}
            >
              {isDeletingMonth ? "Excluindo..." : "Sim, Excluir Tudo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
