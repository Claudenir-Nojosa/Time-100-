"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ObrigacaoAcessoria, ObrigacaoPrincipal } from "@prisma/client";
import { toast } from "sonner";

// Schema de validação
const empresaSchema = z.object({
  razaoSocial: z.string().min(1, "Razão Social é obrigatória"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  inscricaoEstadual: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cidade: z.string().optional(),
  uf: z.string().min(2, "UF é obrigatória"),
  regimeTributacao: z.enum([
    "SIMPLES_NACIONAL",
    "LUCRO_PRESUMIDO",
    "LUCRO_REAL",
  ]),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  observacoes: z.string().optional(),
  obrigacoesAcessorias: z.array(
    z.object({
      id: z.string().optional(),
      obrigacaoAcessoriaId: z.string(),
      diaVencimento: z.number().min(1).max(31),
      anteciparDiaNaoUtil: z.boolean(),
    })
  ),
  obrigacoesPrincipais: z.array(
    z.object({
      id: z.string().optional(),
      obrigacaoPrincipalId: z.string(),
      diaVencimento: z.number().min(1).max(31),
      anteciparDiaNaoUtil: z.boolean(),
      aliquota: z.number().optional(),
      descricao: z.string().optional(),
      uf: z.string().optional(),
    })
  ),
});

interface PageProps {
  params: {
    id: string;
  };
}

type EmpresaFormValues = z.infer<typeof empresaSchema>;

export default function EditarEmpresaPage({ params }: PageProps) {
  const router = useRouter();
  const [obrigacoesAcessorias, setObrigacoesAcessorias] = useState<
    ObrigacaoAcessoria[]
  >([]);
  const [obrigacoesPrincipais, setObrigacoesPrincipais] = useState<
    ObrigacaoPrincipal[]
  >([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      obrigacoesAcessorias: [],
      obrigacoesPrincipais: [],
    },
  });

  // Carrega os dados iniciais
  useEffect(() => {
    async function loadData() {
      try {
        // Carrega obrigações disponíveis
        const [resObrigacoesAcessorias, resObrigacoesPrincipais, resEmpresa] =
          await Promise.all([
            fetch("/api/obrigacoes-acessorias"),
            fetch("/api/obrigacoes-principais"),
            fetch(`/api/empresas/${params.id}`),
          ]);

        const [
          obrigacoesAcessoriasData,
          obrigacoesPrincipaisData,
          empresaData,
        ] = await Promise.all([
          resObrigacoesAcessorias.json(),
          resObrigacoesPrincipais.json(),
          resEmpresa.json(),
        ]);

        setObrigacoesAcessorias(obrigacoesAcessoriasData);
        setObrigacoesPrincipais(obrigacoesPrincipaisData);

        // Preenche o formulário com os dados da empresa
        form.reset({
          ...empresaData,
          obrigacoesAcessorias: empresaData.obrigacoesAcessorias.map(
            (oa: any) => ({
              id: oa.id,
              obrigacaoAcessoriaId: oa.obrigacaoAcessoria.id,
              diaVencimento: oa.diaVencimento,
              anteciparDiaNaoUtil: oa.anteciparDiaNaoUtil,
            })
          ),
          obrigacoesPrincipais: empresaData.obrigacoesPrincipais.map(
            (op: any) => ({
              id: op.id,
              obrigacaoPrincipalId: op.obrigacaoPrincipal.id,
              diaVencimento: op.diaVencimento,
              anteciparDiaNaoUtil: op.anteciparDiaNaoUtil,
              aliquota: op.aliquota,
              descricao: op.descricao,
              uf: op.uf,
            })
          ),
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast("Não foi possível carregar os dados da empresa");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, form]);

  const onSubmit: SubmitHandler<EmpresaFormValues> = async (data) => {
    try {
      const response = await fetch(`/api/empresas/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar empresa");
      }

      toast("Empresa atualizada com sucesso");
      router.push(`/dashboard/empresas/${params.id}`);
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toast("Não foi possível atualizar a empresa");
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 mt-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar Empresa</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inscricaoEstadual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição Estadual</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regimeTributacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regime Tributário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o regime" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SIMPLES_NACIONAL">
                          Simples Nacional
                        </SelectItem>
                        <SelectItem value="LUCRO_PRESUMIDO">
                          Lucro Presumido
                        </SelectItem>
                        <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Obrigações Acessórias</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    form.setValue("obrigacoesAcessorias", [
                      ...form.getValues("obrigacoesAcessorias"),
                      {
                        obrigacaoAcessoriaId: "",
                        diaVencimento: 10,
                        anteciparDiaNaoUtil: false,
                      },
                    ])
                  }
                >
                  Adicionar Obrigação
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("obrigacoesAcessorias").map((obrigacao, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <FormField
                    control={form.control}
                    name={`obrigacoesAcessorias.${index}.obrigacaoAcessoriaId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obrigação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {obrigacoesAcessorias.map((oa) => (
                              <SelectItem key={oa.id} value={oa.id}>
                                {oa.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`obrigacoesAcessorias.${index}.diaVencimento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`obrigacoesAcessorias.${index}.anteciparDiaNaoUtil`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Antecipar dia não útil</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const obrigacoes = form.getValues(
                          "obrigacoesAcessorias"
                        );
                        form.setValue(
                          "obrigacoesAcessorias",
                          obrigacoes.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Obrigações Principais</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    form.setValue("obrigacoesPrincipais", [
                      ...form.getValues("obrigacoesPrincipais"),
                      {
                        obrigacaoPrincipalId: "",
                        diaVencimento: 10,
                        anteciparDiaNaoUtil: false,
                        aliquota: 0,
                        descricao: "",
                        uf: "",
                      },
                    ])
                  }
                >
                  Adicionar Obrigação
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("obrigacoesPrincipais").map((obrigacao, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <FormField
                    control={form.control}
                    name={`obrigacoesPrincipais.${index}.obrigacaoPrincipalId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obrigação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {obrigacoesPrincipais.map((op) => (
                              <SelectItem key={op.id} value={op.id}>
                                {op.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`obrigacoesPrincipais.${index}.diaVencimento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`obrigacoesPrincipais.${index}.anteciparDiaNaoUtil`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Antecipar dia não útil</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`obrigacoesPrincipais.${index}.aliquota`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alíquota (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const obrigacoes = form.getValues(
                          "obrigacoesPrincipais"
                        );
                        form.setValue(
                          "obrigacoesPrincipais",
                          obrigacoes.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
