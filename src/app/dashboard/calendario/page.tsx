"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  X,
  GripVertical,
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

export default function CalendarioPage() {
  const session = useSession();
  const router = useRouter();
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
  });

  const [filtros, setFiltros] = useState<Record<CategoriaType, boolean>>({
    apuracao: true,
    reuniao: true,
    diagnostico: true,
    outros: true,
  });

  const [filtroConcluidas, setFiltroConcluidas] = useState<boolean>(true);
  const [openFiltroPopover, setOpenFiltroPopover] = useState(false);

  // Cleanup effect para remover classes de drag
  useEffect(() => {
    if (!isReordering) {
      // Remove todas as classes de estilo de drag quando não estiver reordenando
      document
        .querySelectorAll(
          ".opacity-50, .border-2, .border-emerald-400, .scale-105"
        )
        .forEach((el) => {
          el.classList.remove(
            "opacity-50",
            "border-2",
            "border-emerald-400",
            "scale-105"
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
        const data = await res.json();
        setAtividades(
          data.map((a: any) => ({
            ...a,
            data: new Date(a.data),
            categoria: a.categoria || "apuracao",
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session.status === "authenticated") {
      fetchAtividades();
    }
  }, [session.status]);

  if (session.status === "loading") {
    return <div>Carregando...</div>;
  }

  if (!session.data) {
    return null;
  }

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

  // Funções de drag and drop
  const handleDragStart = (e: React.DragEvent, atividade: Atividade) => {
    e.dataTransfer.setData("text/plain", atividade.id);
    setDraggedAtividade(atividade);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-emerald-100", "dark:bg-emerald-900/20");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(
      "bg-emerald-100",
      "dark:bg-emerald-900/20"
    );
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    e.currentTarget.classList.remove(
      "bg-emerald-100",
      "dark:bg-emerald-900/20"
    );

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
      const res = await fetch(`/api/atividades/${atividade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...atividade, concluida: !atividade.concluida }),
      });
      const atividadeAtualizada = await res.json();
      setAtividades(
        atividades.map((a) => (a.id === atividade.id ? atividadeAtualizada : a))
      );
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
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

  const handleUpdateAtividade = async () => {
    if (!atividadeParaEditar || !novaAtividade.nome) return;
    try {
      const updatePromise = fetch(`/api/atividades/${atividadeParaEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaAtividade,
          data: selectedDate?.toISOString(),
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
          });
          setOpenDialog(false);
          return `"${novaAtividade.nome}" atualizada com sucesso!`;
        },
        error: () => `Erro ao atualizar "${novaAtividade.nome}"`,
      });
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar a atividade");
      console.error("Erro ao atualizar atividade:", error);
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
          });
          setOpenDialog(false);
          return `"${novaAtividade.nome}" criada com sucesso!`;
        },
        error: () => `Erro ao criar "${novaAtividade.nome}"`,
      });
    } catch (error) {
      toast.error("Ocorreu um erro ao criar a atividade");
      console.error("Erro ao criar atividade:", error);
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
    e.currentTarget.classList.add("opacity-50");
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
            hover:shadow-sm transition-all transform hover:scale-[1.02]
            ${dragOverAtividade === atividade.id ? "border-2 border-emerald-400 scale-105" : ""}
            ${draggedAtividade?.id === atividade.id ? "opacity-50" : ""}`}
          onClick={() => handleToggleConcluida(atividade)}
          draggable
          onDragStart={(e) => handleVerticalDragStart(e, atividade)}
          onDragEnd={handleVerticalDragEnd}
          onDragOver={(e) => handleVerticalDragOver(e, atividade.id)}
          onDragLeave={handleVerticalDragLeave}
          onDrop={(e) => handleVerticalDrop(e, atividade.id, currentDay)}
        >
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
          </div>

          <div className="flex justify-between items-start gap-2 ml-4">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                <AvatarImage
                  src={atividade.responsavelImg || ""}
                  alt={atividade.responsavel}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-gray-100">
                  {atividade.responsavel
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0">
                {atividade.horario && (
                  <span className="font-medium text-xs whitespace-nowrap">
                    {atividade.horario}
                  </span>
                )}
                <span className="text-xs break-words whitespace-normal">
                  {atividade.nome}
                </span>
                <span className="text-[10px] opacity-70 mt-0.5">
                  {CATEGORIAS[atividade.categoria].label}
                </span>
              </div>
            </div>

            <div className="flex flex-shrink-0">
              <button
                className="text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full p-0.5 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAtividade(atividade);
                }}
                title="Editar atividade"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-full p-0.5 ml-1"
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

  const renderDays = () => {
    const days = [];
    let day = 1;

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startingDayOfWeek - i - 1));
      const dayIndex = i % 7;
      days.push(
        <div
          key={`empty-${i}`}
          className={`min-h-40 p-2 border dark:border-emerald-900/40 ${
            isWeekend(dayIndex)
              ? "dark:bg-gray-900 bg-emerald-50/30"
              : "dark:bg-gray-950 bg-white"
          } text-gray-400 dark:text-emerald-500/70`}
        >
          <div className="flex justify-between items-start">
            <span>{prevDate.getDate()}</span>
          </div>
        </div>
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dayIndex = currentDay.getDay();
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const atividadesDoDia = getAtividadesDoDia(currentDay);

      days.push(
        <div
          key={`day-${i}`}
          className={`min-h-40 p-2 border dark:border-emerald-900/40 transition-all flex flex-col
            ${isToday ? "dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600" : ""}
            ${isWeekend(dayIndex) ? "dark:bg-gray-900 bg-emerald-50/30" : "dark:bg-gray-950 bg-white"}`}
          onDragOver={(e) => handleDragOver(e, currentDay)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, currentDay)}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-medium ${
                isToday
                  ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-[0_0_6px_0_rgba(192,132,252,0.7)]"
                  : "dark:text-emerald-100 text-gray-800"
              }`}
            >
              {i}
            </span>
            <button
              onClick={() => handleOpenDialog(currentDay)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex-1 space-y-1 overflow-y-auto">
            {renderAtividadesDoDia(atividadesDoDia, currentDay)}
          </div>
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
          className={`min-h-40 p-2 border dark:border-emerald-900/40 ${
            isWeekend(dayIndex)
              ? "dark:bg-gray-900 bg-emerald-50/30"
              : "dark:bg-gray-950 bg-white"
          } text-gray-400 dark:text-emerald-500/70`}
          onDragOver={(e) => handleDragOver(e, nextDate)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nextDate)}
        >
          <div className="flex justify-between items-start">
            <span>{i}</span>
          </div>
        </div>
      );
    }

    return days;
  };
  
  return (
    <div className="container mx-auto py-8 px-4 mt-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold dark:text-emerald-100 text-gray-800">
          Calendário
        </h1>
        <div className="flex items-center space-x-4 dark:bg-emerald-950/20 bg-white rounded-lg shadow-sm p-2 border dark:border-emerald-900/30 border-gray-200">
          <Popover open={openFiltroPopover} onOpenChange={setOpenFiltroPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
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
                  <h4 className="font-medium dark:text-emerald-100">Status</h4>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="dark:hover:bg-emerald-900/30 hover:bg-emerald-100 rounded-full p-2"
          >
            <ChevronLeft className="h-5 w-5 dark:text-emerald-300 text-emerald-600" />
          </Button>
          <h2 className="text-xl font-semibold dark:text-emerald-100 text-gray-700 min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="dark:hover:bg-emerald-900/30 hover:bg-emerald-100 rounded-full p-2"
          >
            <ChevronRight className="h-5 w-5 dark:text-emerald-300 text-emerald-600" />
          </Button>
        </div>
      </div>

      {/* Legenda de categorias */}
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

      {/* Grid do Calendário */}
      <div className="dark:bg-emerald-950/10 bg-white rounded-xl shadow-sm overflow-hidden border dark:border-emerald-900/30 border-gray-200">
        <div className="grid grid-cols-7 gap-px dark:bg-emerald-950/20 bg-gray-50 border-b dark:border-emerald-900/30 border-gray-200">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center font-medium text-sm 
                ${
                  isWeekend(index)
                    ? "dark:text-emerald-300 text-emerald-600 dark:bg-emerald-950/10 bg-emerald-50/30"
                    : "dark:text-emerald-100 text-gray-700"
                }`}
            >
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7 gap-px dark:bg-gray-950 bg-gray-100">
            {renderDays()}
          </div>
        )}
      </div>

      {/* Dialog para adicionar/editar atividade */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => !open && setOpenDialog(false)}
      >
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-emerald-900/30 bg-white">
          <DialogHeader>
            <DialogTitle className="dark:text-emerald-100">
              {atividadeParaEditar ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="nome"
                className="text-right dark:text-emerald-200"
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
                className="text-right dark:text-emerald-200"
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
                className="text-right dark:text-emerald-200"
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
                className="text-right dark:text-emerald-200"
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
                className="text-right dark:text-emerald-200"
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
        <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-emerald-900/30 bg-white border-2">
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
    </div>
  );
}
