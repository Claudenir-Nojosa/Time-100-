"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { CalendarSkeleton } from "@/components/shared/CalendarSkeleton";

interface Atividade {
  id: string;
  nome: string;
  horario?: string;
  responsavel: string;
  data: Date;
  concluida: boolean;
}

export default function CalendarioPage() {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/atividades");
        const data = await res.json();
        setAtividades(data);
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAtividades();
  }, []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [atividadeParaExcluir, setAtividadeParaExcluir] = useState<
    string | null
  >(null);
  const [atividadeParaEditar, setAtividadeParaEditar] =
    useState<Atividade | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [novaAtividade, setNovaAtividade] = useState({
    nome: "",
    horario: "",
    responsavel: session.data?.user.name, // Substitua pelo nome do usuário logado
  });

  const handleToggleConcluida = async (atividade: Atividade) => {
    try {
      const res = await fetch(`/api/atividades/${atividade.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...atividade,
          concluida: !atividade.concluida,
        }),
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

  // Buscar atividades do banco de dados
  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const res = await fetch("/api/atividades");
        const data = await res.json();
        setAtividades(data);
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
      }
    };

    fetchAtividades();
  }, []);

  const handleDeleteAtividade = async () => {
    if (!atividadeParaExcluir) return;

    try {
      const res = await fetch(`/api/atividades/${atividadeParaExcluir}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAtividades(atividades.filter((a) => a.id !== atividadeParaExcluir));
        setOpenDeleteDialog(false);
        setAtividadeParaExcluir(null);
      }
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
    }
  };

  const handleEditAtividade = (atividade: Atividade) => {
    setAtividadeParaEditar(atividade);
    setNovaAtividade({
      nome: atividade.nome,
      horario: atividade.horario || "",
      responsavel: atividade.responsavel,
    });
    setSelectedDate(new Date(atividade.data));
    setOpenDialog(true);
  };

  const handleUpdateAtividade = async () => {
    if (!atividadeParaEditar || !novaAtividade.nome) return;

    try {
      const res = await fetch(`/api/atividades/${atividadeParaEditar.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novaAtividade,
          data: selectedDate?.toISOString(),
        }),
      });

      const atividadeAtualizada = await res.json();
      setAtividades(
        atividades.map((a) =>
          a.id === atividadeParaEditar.id ? atividadeAtualizada : a
        )
      );

      setAtividadeParaEditar(null);
      setNovaAtividade({
        nome: "",
        horario: "",
        responsavel: session.data?.user.name,
      });
      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
    }
  };

  const handleOpenDialog = (date: Date) => {
    setAtividadeParaEditar(null); // Limpa edição anterior
    setNovaAtividade({
      nome: "",
      horario: "",
      responsavel: session.data?.user?.name || "Usuário Atual",
    });
    setSelectedDate(date);
    setOpenDialog(true);
  };

  const handleAddAtividade = async () => {
    if (!selectedDate || !novaAtividade.nome) return;

    try {
      const res = await fetch("/api/atividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novaAtividade,
          data: selectedDate.toISOString(),
        }),
      });

      const atividadeCriada = await res.json();
      setAtividades([...atividades, atividadeCriada]);

      setNovaAtividade({
        nome: "",
        horario: "",
        responsavel: session.data?.user.name,
      });
      setOpenDialog(false);
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
    }
  };

  const getAtividadesDoDia = (date: Date) => {
    return atividades.filter((atividade) => {
      const atividadeDate = new Date(atividade.data);
      return (
        atividadeDate.getDate() === date.getDate() &&
        atividadeDate.getMonth() === date.getMonth() &&
        atividadeDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderDays = () => {
    const days = [];
    let day = 1;

    // Dias do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startingDayOfWeek - i - 1));
      const dayIndex = i % 7;
      days.push(
        <div
          key={`empty-${i}`}
          className={`h-32 p-2 border border-gray-100 ${isWeekend(dayIndex) ? "bg-gray-50" : "bg-white"} text-gray-300`}
        >
          <div className="flex justify-between items-start">
            <span>{prevDate.getDate()}</span>
          </div>
        </div>
      );
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dayIndex = currentDay.getDay();
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const atividadesDoDia = getAtividadesDoDia(currentDay);

      days.push(
        <div
          key={`day-${i}`}
          className={`h-32 p-2 border border-gray-100 transition-all
            ${isToday ? "bg-blue-50 border-blue-200" : ""}
            ${isWeekend(dayIndex) ? "bg-gray-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-medium ${isToday ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}
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
          <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
            {atividadesDoDia.map((atividade) => (
              <div
                key={atividade.id}
                className={`text-xs p-1 rounded cursor-pointer relative group
        ${atividade.concluida ? "bg-green-100 text-green-800 line-through" : "bg-blue-100 text-blue-800"}`}
                onClick={() => handleToggleConcluida(atividade)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {atividade.horario && (
                      <span className="font-medium">
                        {atividade.horario} -{" "}
                      </span>
                    )}
                    {atividade.nome}
                  </div>
                  <div className="flex">
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
            ))}
          </div>
        </div>
      );
    }

    // Dias do próximo mês
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;

    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dayIndex = (startingDayOfWeek + daysInMonth + i - 1) % 7;
      days.push(
        <div
          key={`next-${i}`}
          className={`h-32 p-2 border border-gray-100 ${isWeekend(dayIndex) ? "bg-gray-50" : "bg-white"} text-gray-300`}
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
    <div className="container mx-auto py-8 px-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Calendário</h1>
        <div className="flex items-center space-x-4 bg-white rounded-lg shadow-sm p-2 border border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="hover:bg-gray-100 rounded-full p-2"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-700 min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="hover:bg-gray-100 rounded-full p-2"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-7 gap-px bg-gray-50 border-b border-gray-100">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center font-medium text-sm 
                ${isWeekend(index) ? "text-gray-600 bg-gray-50" : "text-gray-700"}`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Skeleton ou conteúdo real */}
        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {renderDays()}
          </div>
        )}
      </div>

      {/* Dialog para adicionar atividade */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          if (!open) {
            setOpenDialog(false);
            setAtividadeParaEditar(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {atividadeParaEditar ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="nome" className="text-right">
                Nome:
              </label>
              <Input
                id="nome"
                value={novaAtividade.nome}
                onChange={(e) =>
                  setNovaAtividade({ ...novaAtividade, nome: e.target.value })
                }
                className="col-span-3"
                placeholder="Nome da atividade"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="horario" className="text-right">
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
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="responsavel" className="text-right">
                Responsável:
              </label>
              <Input
                id="responsavel"
                value={novaAtividade.responsavel}
                readOnly
                className="col-span-3 bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="data" className="text-right">
                Data:
              </label>
              <Input
                id="data"
                value={selectedDate?.toLocaleDateString("pt-BR")}
                readOnly
                className="col-span-3 bg-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenDialog(false);
                setAtividadeParaEditar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
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

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir esta atividade?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAtividade}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
