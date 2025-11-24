// src/app/controle-horas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarMinutos } from "@/lib/utils";

interface RegistroHoras {
  id: string;
  data: string;
  entradaPrevista: string;
  almocoSaidaPrevista: string;
  almocoRetornoPrevisto: string;
  saidaPrevista: string;
  entradaReal?: string;
  almocoSaidaReal?: string;
  almocoRetornoReal?: string;
  saidaReal?: string;
  atrasoEntrada?: number;
  atrasoAlmoco?: number;
  horasExtras?: number;
  horasTrabalhadas?: number;
  observacoes?: string;
}

export default function ControleHorasPage() {
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    new Date().toISOString().slice(0, 7) // formato: "2024-01"
  );
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());

  // Buscar registros do mês
  useEffect(() => {
    buscarRegistros();
  }, [mesSelecionado]);

  const buscarRegistros = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/controle-horas?mes=${mesSelecionado}`);
      if (response.ok) {
        const data = await response.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarMinutos = (minutos: number | undefined): string => {
    if (!minutos) return "0min";
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h${mins}m` : `${mins}min`;
  };

  const getRegistroDoDia = (data: Date): RegistroHoras | undefined => {
    return registros.find(
      (reg) => new Date(reg.data).toDateString() === data.toDateString()
    );
  };

  const handleSalvarRegistro = async (registro: Partial<RegistroHoras>) => {
    try {
      const response = await fetch("/api/controle-horas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registro),
      });

      if (response.ok) {
        await buscarRegistros(); // Recarregar dados
      }
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Controle de Horas</h1>

        <div className="flex items-center space-x-4">
          <Label htmlFor="mes">Mês:</Label>
          <Input
            id="mes"
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Selecionar Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => date && setDataSelecionada(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Formulário do dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Registro do Dia: {dataSelecionada.toLocaleDateString("pt-BR")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioDia
              data={dataSelecionada}
              registro={getRegistroDoDia(dataSelecionada)}
              onSalvar={handleSalvarRegistro}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabela do mês */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Mês - {mesSelecionado}</CardTitle>
        </CardHeader>
        <CardContent>
          <TabelaMensal
            registros={registros}
            mes={mesSelecionado}
            onEditar={(data) => setDataSelecionada(new Date(data))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Componente do formulário do dia
function FormularioDia({
  data,
  registro,
  onSalvar,
}: {
  data: Date;
  registro?: RegistroHoras;
  onSalvar: (registro: Partial<RegistroHoras>) => void;
}) {
  const [formData, setFormData] = useState({
    entradaReal: registro?.entradaReal || "",
    almocoSaidaReal: registro?.almocoSaidaReal || "",
    almocoRetornoReal: registro?.almocoRetornoReal || "",
    saidaReal: registro?.saidaReal || "",
    observacoes: registro?.observacoes || "",
  });

  const handleSalvar = () => {
    onSalvar({
      data: data.toISOString(),
      entradaPrevista: registro?.entradaPrevista || "08:00",
      almocoSaidaPrevista: registro?.almocoSaidaPrevista || "12:00",
      almocoRetornoPrevisto: registro?.almocoRetornoPrevisto || "13:00",
      saidaPrevista: registro?.saidaPrevista || "17:00",
      ...formData,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Entrada Real</Label>
          <Input
            type="time"
            value={formData.entradaReal}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, entradaReal: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Saída Almoço</Label>
          <Input
            type="time"
            value={formData.almocoSaidaReal}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                almocoSaidaReal: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Retorno Almoço</Label>
          <Input
            type="time"
            value={formData.almocoRetornoReal}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                almocoRetornoReal: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Saída Real</Label>
          <Input
            type="time"
            value={formData.saidaReal}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, saidaReal: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input
          value={formData.observacoes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
          }
          placeholder="Observações do dia..."
        />
      </div>

      {registro && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-sm">Atraso Entrada</Label>
            <div className="font-medium">
              {formatarMinutos(registro.atrasoEntrada)}
            </div>
          </div>
          <div>
            <Label className="text-sm">Atraso Almoço</Label>
            <div className="font-medium">
              {formatarMinutos(registro.atrasoAlmoco)}
            </div>
          </div>
          <div>
            <Label className="text-sm">Horas Extras</Label>
            <div className="font-medium">
              {formatarMinutos(registro.horasExtras)}
            </div>
          </div>
          <div>
            <Label className="text-sm">Horas Trabalhadas</Label>
            <div className="font-medium">
              {formatarMinutos(registro.horasTrabalhadas)}
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleSalvar} className="w-full">
        Salvar Registro
      </Button>
    </div>
  );
}

// Componente da tabela mensal
function TabelaMensal({
  registros,
  mes,
  onEditar,
}: {
  registros: RegistroHoras[];
  mes: string;
  onEditar: (data: string) => void;
}) {
  // Gerar array de dias do mês
  const [ano, mesNum] = mes.split("-").map(Number);
  const diasNoMes = new Date(ano, mesNum, 0).getDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  const getRegistroDoDia = (dia: number): RegistroHoras | undefined => {
    const data = new Date(ano, mesNum - 1, dia);
    return registros.find(
      (reg) => new Date(reg.data).toDateString() === data.toDateString()
    );
  };

  const totais = registros.reduce(
    (acc, reg) => ({
      atrasoEntrada: acc.atrasoEntrada + (reg.atrasoEntrada || 0),
      atrasoAlmoco: acc.atrasoAlmoco + (reg.atrasoAlmoco || 0),
      horasExtras: acc.horasExtras + (reg.horasExtras || 0),
      horasTrabalhadas: acc.horasTrabalhadas + (reg.horasTrabalhadas || 0),
    }),
    { atrasoEntrada: 0, atrasoAlmoco: 0, horasExtras: 0, horasTrabalhadas: 0 }
  );

  const formatarMinutos = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h${mins}m` : `${mins}min`;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Dia</th>
              <th className="text-left p-2">Entrada</th>
              <th className="text-left p-2">Saída Almoço</th>
              <th className="text-left p-2">Retorno</th>
              <th className="text-left p-2">Saída</th>
              <th className="text-left p-2">Atrasos</th>
              <th className="text-left p-2">Extras</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((dia) => {
              const registro = getRegistroDoDia(dia);
              const data = new Date(ano, mesNum - 1, dia);

              return (
                <tr key={dia} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    {dia} (
                    {data.toLocaleDateString("pt-BR", { weekday: "short" })})
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-muted-foreground">
                      Prev: {registro?.entradaPrevista || "08:00"}
                    </div>
                    <div
                      className={
                        registro?.entradaReal
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {registro?.entradaReal || "--:--"}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-muted-foreground">
                      Prev: {registro?.almocoSaidaPrevista || "12:00"}
                    </div>
                    <div
                      className={
                        registro?.almocoSaidaReal
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {registro?.almocoSaidaReal || "--:--"}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-muted-foreground">
                      Prev: {registro?.almocoRetornoPrevisto || "13:00"}
                    </div>
                    <div
                      className={
                        registro?.almocoRetornoReal
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {registro?.almocoRetornoReal || "--:--"}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-muted-foreground">
                      Prev: {registro?.saidaPrevista || "17:00"}
                    </div>
                    <div
                      className={
                        registro?.saidaReal
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {registro?.saidaReal || "--:--"}
                    </div>
                  </td>
                  <td className="p-2">
                    {registro && (
                      <div className="text-xs">
                        <div>
                          Entrada:{" "}
                          {formatarMinutos(registro.atrasoEntrada || 0)}
                        </div>
                        <div>
                          Almoço: {formatarMinutos(registro.atrasoAlmoco || 0)}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {registro && formatarMinutos(registro.horasExtras || 0)}
                  </td>
                  <td className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditar(data.toISOString())}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted font-medium">
              <td className="p-2" colSpan={5}>
                Totais do Mês:
              </td>
              <td className="p-2">
                <div className="text-xs">
                  <div>Entrada: {formatarMinutos(totais.atrasoEntrada)}</div>
                  <div>Almoço: {formatarMinutos(totais.atrasoAlmoco)}</div>
                </div>
              </td>
              <td className="p-2">{formatarMinutos(totais.horasExtras)}</td>
              <td className="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
