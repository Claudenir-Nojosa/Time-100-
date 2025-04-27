// components/AdicionarEmpresaForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { calcularVencimento } from "@/lib/vencimentos";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Adicione este tipo no início do arquivo
type ObrigacaoAcessoriaSelecionada = {
  id: string;
  nome: string;
  selecionada: boolean;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean; // true = antecipa, false = posterga
};

// Esquemas de validação para cada etapa
const infoGeraisSchema = z.object({
  razaoSocial: z
    .string()
    .min(3, "Razão social deve ter pelo menos 3 caracteres"),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(14),
  inscricaoEstadual: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  cep: z.string().optional(),
  regimeTributacao: z.enum([
    "SIMPLES_NACIONAL",
    "LUCRO_PRESUMIDO",
    "LUCRO_REAL",
  ]),
  responsavel: z
    .string()
    .min(3, "Responsável deve ter pelo menos 3 caracteres"),
  observacoes: z.string().optional(),
});

const obrigacoesAcessoriasSchema = z.object({
  obrigacoesAcessorias: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      selecionada: z.boolean(),
      diaVencimento: z.number().min(1).max(31),
      anteciparDiaNaoUtil: z.boolean(), // true = antecipa, false = posterga
    })
  ),
});

const icmsItemSchema = z.object({
  id: z.string().optional(),
  diaVencimento: z.number().min(1).max(31),
  anteciparDiaNaoUtil: z.boolean(),
  descricao: z.string().optional(),
  uf: z.string().length(2).optional(),
});

const obrigacoesPrincipaisSchema = z.object({
  obrigacoesPrincipais: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      selecionada: z.boolean(),
      temMultiplos: z.boolean().optional(),
      itens: z.array(icmsItemSchema).optional(),
      // Campos para quando temMultiplos=false
      diaVencimento: z.number().min(1).max(31).optional(),
      anteciparDiaNaoUtil: z.boolean().optional(),
    })
  ),
});

const parcelamentoSchema = z.object({
  parcelamentos: z
    .array(
      z.object({
        ambito: z.enum(["FEDERAL", "ESTADUAL", "MUNICIPAL"]),
        debitoConsolidado: z.number().min(0),
        numeroParcelas: z.number().min(1),
        dataVencimento: z.string(), // Mantém como string para o input date
        observacoes: z.string().optional(),
      })
    )
    .optional(), // Torna opcional para permitir nenhum parcelamento
});

const formSchema = infoGeraisSchema
  .merge(obrigacoesAcessoriasSchema)
  .merge(obrigacoesPrincipaisSchema)
  .merge(parcelamentoSchema);

type FormValues = z.infer<typeof infoGeraisSchema> &
  z.infer<typeof obrigacoesAcessoriasSchema> &
  z.infer<typeof obrigacoesPrincipaisSchema> &
  z.infer<typeof parcelamentoSchema>;

// Dados mockados para as obrigações (você pode buscar do banco de dados)
const obrigacoesAcessorias = [
  { id: "1", nome: "EFD ICMS IPI", periodicidade: "Mensal" },
  { id: "2", nome: "DeSTDA", periodicidade: "Mensal" },
  { id: "3", nome: "EFD Contribuições", periodicidade: "Mensal" },
  { id: "4", nome: "GIA", periodicidade: "Mensal" },
  { id: "5", nome: "DIME", periodicidade: "Mensal" },
];

const obrigacoesPrincipais = [
  {
    id: "1",
    nome: "ICMS",
    descricao: "Imposto sobre Circulação de Mercadorias",
  },
  { id: "2", nome: "PIS", descricao: "Programa de Integração Social" },
  {
    id: "3",
    nome: "COFINS",
    descricao: "Contribuição para Financiamento da Seguridade Social",
  },
  {
    id: "4",
    nome: "IPI",
    descricao: "Imposto sobre Produtos Industrializados",
  },
];

export function AdicionarEmpresaForm() {
  const [step, setStep] = useState(1);
  const session = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      inscricaoEstadual: "",
      telefone: "",
      email: "",
      endereco: "",
      cidade: "",
      uf: "",
      cep: "",
      regimeTributacao: "SIMPLES_NACIONAL",
      responsavel: "",
      observacoes: "",
      obrigacoesAcessorias: obrigacoesAcessorias.map((obrigacao) => ({
        id: obrigacao.id,
        nome: obrigacao.nome,
        selecionada: false,
        diaVencimento: 20, // Valor padrão
        anteciparDiaNaoUtil: false, // Padrão posterga
      })),
      obrigacoesPrincipais: obrigacoesPrincipais.map((obrigacao) => ({
        id: obrigacao.id,
        nome: obrigacao.nome,
        selecionada: false,
        aliquota: 0,
        diaVencimento: 20, // Valor padrão igual às obrigações acessórias
        anteciparDiaNaoUtil: false, // Padrão posterga
      })),
      parcelamentos: [],
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      console.log('[FRONT] Iniciando submissão do formulário...');
      
      console.log('[FRONT] Sessão obtida:', {
        userId: session?.data?.user?.id,
        email: session?.data?.user?.email
      });

      // Log dos dados do formulário antes de processar
      console.log('[FRONT] Dados do formulário (raw):', JSON.parse(JSON.stringify(data)));
  
      const empresaData = {
        ...data,
        usuarioId: session?.data?.user?.id,
        obrigacoesAcessorias: data.obrigacoesAcessorias
          .filter((obrigacao) => obrigacao.selecionada)
          .map((obrigacao) => ({
            obrigacaoAcessoriaId: obrigacao.id,
            diaVencimento: obrigacao.diaVencimento,
            anteciparDiaNaoUtil: obrigacao.anteciparDiaNaoUtil,
          })),
        
        obrigacoesPrincipais: data.obrigacoesPrincipais
          .filter((obrigacao) => obrigacao.selecionada)
          .flatMap((obrigacao) => {
            if (obrigacao.nome === "ICMS" && obrigacao.temMultiplos && obrigacao.itens) {
              return obrigacao.itens.map(item => ({
                obrigacaoPrincipalId: obrigacao.id,
                diaVencimento: item.diaVencimento,
                anteciparDiaNaoUtil: item.anteciparDiaNaoUtil,
                aliquota: 0,
                descricao: item.descricao,
                uf: item.uf
              }));
            }
            return {
              obrigacaoPrincipalId: obrigacao.id,
              diaVencimento: obrigacao.diaVencimento || 20,
              anteciparDiaNaoUtil: obrigacao.anteciparDiaNaoUtil || false,
              aliquota: 0
            };
          }),
        
        parcelamentos: data.parcelamentos?.map((parcelamento) => ({
          ambito: parcelamento.ambito,
          debitoConsolidado: parcelamento.debitoConsolidado,
          numeroParcelas: parcelamento.numeroParcelas,
          dataVencimento: parcelamento.dataVencimento,
          observacoes: parcelamento.observacoes,
        })),
      };
  
      console.log('[FRONT] Dados preparados para API:', JSON.parse(JSON.stringify(empresaData)));
  
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(empresaData),
      });
  
      console.log('[FRONT] Resposta da API:', {
        status: response.status,
        statusText: response.statusText
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FRONT] Erro na resposta da API:', {
          status: response.status,
          errorData
        });
        throw new Error(errorData.error || 'Erro ao cadastrar empresa');
      }
  
      const result = await response.json();
      console.log('[FRONT] Empresa cadastrada com sucesso:', result);
      
      toast.success("Empresa cadastrada com sucesso!", {
        action: {
          label: "Visualizar",
          onClick: () => {
            // router.push(`/empresas/${result.id}`);
          },
        },
      });
  
      form.reset();
      setStep(1);
  
    } catch (error) {
      console.error('[FRONT] Erro completo no onSubmit:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar empresa");
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStep = async () => {
    // Valida os campos da etapa atual antes de avançar
    let isValid = true;

    if (step === 1) {
      isValid = await form.trigger([
        "razaoSocial",
        "cnpj",
        "uf",
        "regimeTributacao",
        "responsavel",
      ]);
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Corrigindo a função addParcelamento
  const addParcelamento = () => {
    const current = form.getValues("parcelamentos") || [];
    form.setValue("parcelamentos", [
      ...current,
      {
        ambito: "FEDERAL", // Valor padrão válido
        debitoConsolidado: 0,
        numeroParcelas: 1,
        dataVencimento: new Date().toISOString().split("T")[0], // Formato YYYY-MM-DD
        observacoes: "",
      },
    ]);
  };

  const removeParcelamento = (index: number) => {
    const current = form.getValues("parcelamentos") || [];
    form.setValue(
      "parcelamentos",
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">
          {step === 1 && "Informações Gerais"}
          {step === 2 && "Obrigações Acessórias"}
          {step === 3 && "Obrigações Principais"}
          {step === 4 && "Parcelamentos"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Etapa 1: Informações Gerais */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="razaoSocial"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Razão Social*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeFantasia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
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
                      <FormLabel>CNPJ*</FormLabel>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
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
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>UF*</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Regime Tributação*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o regime tributário" />
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
                      <FormLabel>Responsável*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ANA_CONRADO">
                            Ana Conrado
                          </SelectItem>
                          <SelectItem value="CLAUDENIR">
                            Claudenir
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Etapa 2: Obrigações Acessórias */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Obrigações Acessórias</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as obrigações e configure os vencimentos
                </p>

                <div className="space-y-4">
                  {obrigacoesAcessorias.map((obrigacao, index) => (
                    <div key={obrigacao.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={form.watch(
                              `obrigacoesAcessorias.${index}.selecionada`
                            )}
                            onCheckedChange={(checked) => {
                              form.setValue(
                                `obrigacoesAcessorias.${index}.selecionada`,
                                !!checked
                              );
                            }}
                          />
                          <div>
                            <h4 className="font-medium">{obrigacao.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {obrigacao.periodicidade}
                            </p>
                          </div>
                        </div>
                      </div>

                      {form.watch(
                        `obrigacoesAcessorias.${index}.selecionada`
                      ) && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`obrigacoesAcessorias.${index}.diaVencimento`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dia base do vencimento</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="31"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseInt(e.target.value) || 1
                                        )
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
                                <FormItem className="space-y-3">
                                  <FormLabel>
                                    Ajuste para dia não útil
                                  </FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={(value) =>
                                        field.onChange(value === "antecipar")
                                      }
                                      value={
                                        field.value ? "antecipar" : "postergar"
                                      }
                                      className="flex flex-col space-y-1"
                                    >
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="antecipar" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          Antecipar para o último dia útil
                                          anterior
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="postergar" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          Postergar para o próximo dia útil
                                        </FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Pré-visualização dos vencimentos */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">
                              Previsão de Vencimentos para o Ano
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Array.from({ length: 12 }).map(
                                (_, monthIndex) => {
                                  const month = monthIndex + 1;
                                  const mesCompetencia = monthIndex + 1;
                                  const anoAtual = new Date().getFullYear();
                                  const diaBase = form.watch(
                                    `obrigacoesAcessorias.${index}.diaVencimento`
                                  );
                                  const antecipar = form.watch(
                                    `obrigacoesAcessorias.${index}.anteciparDiaNaoUtil`
                                  );

                                  const dataVencimento = calcularVencimento(
                                    mesCompetencia,
                                    anoAtual,
                                    diaBase,
                                    antecipar
                                  );

                                  return (
                                    <div key={month} className="text-sm">
                                      <span className="font-medium">
                                        {new Date(0, month - 1).toLocaleString(
                                          "pt-BR",
                                          {
                                            month: "short",
                                          }
                                        )}
                                      </span>
                                      <div>{dataVencimento}</div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa 3: Obrigações Principais */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Obrigações Principais</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as obrigações e configure os vencimentos
                </p>

                <div className="space-y-4">
                  {obrigacoesPrincipais.map((obrigacao, index) => (
                    <div key={obrigacao.id} className="border rounded-lg p-4">
                      {/* Cabeçalho com checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={form.watch(
                              `obrigacoesPrincipais.${index}.selecionada`
                            )}
                            onCheckedChange={(checked) => {
                              form.setValue(
                                `obrigacoesPrincipais.${index}.selecionada`,
                                !!checked
                              );
                            }}
                          />
                          <div>
                            <h4 className="font-medium">{obrigacao.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {obrigacao.descricao}
                            </p>
                          </div>
                        </div>

                        {/* Botão para múltiplos ICMS */}
                        {obrigacao.nome === "ICMS" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = form.getValues(
                                `obrigacoesPrincipais.${index}`
                              );
                              const newValue = !current.temMultiplos;
                              form.setValue(
                                `obrigacoesPrincipais.${index}.temMultiplos`,
                                newValue
                              );

                              if (newValue && !current.itens) {
                                form.setValue(
                                  `obrigacoesPrincipais.${index}.itens`,
                                  [
                                    {
                                      diaVencimento:
                                        current.diaVencimento || 20,
                                      anteciparDiaNaoUtil:
                                        current.anteciparDiaNaoUtil || false,
                                      descricao: "ICMS Principal",
                                      uf: "",
                                    },
                                  ]
                                );
                              }
                            }}
                          >
                            {form.watch(
                              `obrigacoesPrincipais.${index}.temMultiplos`
                            )
                              ? "Remover múltiplos"
                              : "Tem mais de um ICMS"}
                          </Button>
                        )}
                      </div>

                      {form.watch(
                        `obrigacoesPrincipais.${index}.selecionada`
                      ) && (
                        <div className="mt-4 space-y-4">
                          {/* Modo múltiplos ICMS */}
                          {obrigacao.nome === "ICMS" &&
                          form.watch(
                            `obrigacoesPrincipais.${index}.temMultiplos`
                          ) ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Itens de ICMS</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentItems =
                                      form.getValues(
                                        `obrigacoesPrincipais.${index}.itens`
                                      ) || [];
                                    form.setValue(
                                      `obrigacoesPrincipais.${index}.itens`,
                                      [
                                        ...currentItems,
                                        {
                                          diaVencimento: 20,
                                          anteciparDiaNaoUtil: false,
                                          descricao: "",
                                          uf: "",
                                        },
                                      ]
                                    );
                                  }}
                                >
                                  Adicionar ICMS
                                </Button>
                              </div>

                              {form
                                .watch(`obrigacoesPrincipais.${index}.itens`)
                                ?.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className="border p-4 rounded-lg space-y-4"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name={`obrigacoesPrincipais.${index}.itens.${itemIndex}.descricao`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Descrição*</FormLabel>
                                            <FormControl>
                                              <Input
                                                {...field}
                                                placeholder="Ex: ICMS Normal, ICMS ST"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`obrigacoesPrincipais.${index}.itens.${itemIndex}.uf`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>UF (opcional)</FormLabel>
                                            <FormControl>
                                              <Input
                                                {...field}
                                                placeholder="Ex: SP, RJ"
                                                maxLength={2}
                                                onChange={(e) =>
                                                  field.onChange(
                                                    e.target.value.toUpperCase()
                                                  )
                                                }
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <FormField
                                        control={form.control}
                                        name={`obrigacoesPrincipais.${index}.itens.${itemIndex}.diaVencimento`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>
                                              Dia base do vencimento
                                            </FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                {...field}
                                                onChange={(e) =>
                                                  field.onChange(
                                                    parseInt(e.target.value) ||
                                                      1
                                                  )
                                                }
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`obrigacoesPrincipais.${index}.itens.${itemIndex}.anteciparDiaNaoUtil`}
                                        render={({ field }) => (
                                          <FormItem className="space-y-3">
                                            <FormLabel>
                                              Ajuste para dia não útil
                                            </FormLabel>
                                            <FormControl>
                                              <RadioGroup
                                                onValueChange={(value) =>
                                                  field.onChange(
                                                    value === "antecipar"
                                                  )
                                                }
                                                value={
                                                  field.value
                                                    ? "antecipar"
                                                    : "postergar"
                                                }
                                                className="flex flex-col space-y-1"
                                              >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                  <FormControl>
                                                    <RadioGroupItem value="antecipar" />
                                                  </FormControl>
                                                  <FormLabel className="font-normal">
                                                    Antecipar para o último dia
                                                    útil anterior
                                                  </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                  <FormControl>
                                                    <RadioGroupItem value="postergar" />
                                                  </FormControl>
                                                  <FormLabel className="font-normal">
                                                    Postergar para o próximo dia
                                                    útil
                                                  </FormLabel>
                                                </FormItem>
                                              </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    {/* Pré-visualização dos vencimentos */}
                                    <div className="mt-4">
                                      <h4 className="text-sm font-medium mb-2">
                                        Previsão de Vencimentos
                                        (Competência/Vencimento)
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {Array.from({ length: 12 }).map(
                                          (_, monthIndex) => {
                                            const mesCompetencia =
                                              monthIndex + 1;
                                            const anoAtual =
                                              new Date().getFullYear();
                                            const diaBase =
                                              form.watch(
                                                `obrigacoesPrincipais.${index}.itens.${itemIndex}.diaVencimento`
                                              ) || 20;
                                            const antecipar =
                                              form.watch(
                                                `obrigacoesPrincipais.${index}.itens.${itemIndex}.anteciparDiaNaoUtil`
                                              ) || false;

                                            const dataVencimento =
                                              calcularVencimento(
                                                mesCompetencia,
                                                anoAtual,
                                                diaBase,
                                                antecipar
                                              );

                                            return (
                                              <div
                                                key={mesCompetencia}
                                                className="text-sm"
                                              >
                                                <span className="font-medium">
                                                  {new Date(
                                                    0,
                                                    mesCompetencia - 1
                                                  ).toLocaleString("pt-BR", {
                                                    month: "short",
                                                  })}
                                                  /{anoAtual}
                                                </span>
                                                <div>
                                                  Vence: {dataVencimento}
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const currentItems =
                                          form.getValues(
                                            `obrigacoesPrincipais.${index}.itens`
                                          ) || [];
                                        if (currentItems.length > 1) {
                                          form.setValue(
                                            `obrigacoesPrincipais.${index}.itens`,
                                            currentItems.filter(
                                              (_, i) => i !== itemIndex
                                            )
                                          );
                                        } else {
                                          toast.warning(
                                            "É necessário ter pelo menos um item de ICMS"
                                          );
                                        }
                                      }}
                                    >
                                      Remover ICMS
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            /* Modo único (para ICMS ou outras obrigações) */
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`obrigacoesPrincipais.${index}.diaVencimento`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Dia base do vencimento
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          max="31"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseInt(e.target.value) || 1
                                            )
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
                                    <FormItem className="space-y-3">
                                      <FormLabel>
                                        Ajuste para dia não útil
                                      </FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={(value) =>
                                            field.onChange(
                                              value === "antecipar"
                                            )
                                          }
                                          value={
                                            field.value
                                              ? "antecipar"
                                              : "postergar"
                                          }
                                          className="flex flex-col space-y-1"
                                        >
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value="antecipar" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                              Antecipar para o último dia útil
                                              anterior
                                            </FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value="postergar" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                              Postergar para o próximo dia útil
                                            </FormLabel>
                                          </FormItem>
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Pré-visualização dos vencimentos */}
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">
                                  Previsão de Vencimentos
                                  (Competência/Vencimento)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Array.from({ length: 12 }).map(
                                    (_, monthIndex) => {
                                      const mesCompetencia = monthIndex + 1;
                                      const anoAtual = new Date().getFullYear();
                                      const diaBase =
                                        form.watch(
                                          `obrigacoesPrincipais.${index}.diaVencimento`
                                        ) || 20;
                                      const antecipar =
                                        form.watch(
                                          `obrigacoesPrincipais.${index}.anteciparDiaNaoUtil`
                                        ) || false;

                                      const dataVencimento = calcularVencimento(
                                        mesCompetencia,
                                        anoAtual,
                                        diaBase,
                                        antecipar
                                      );

                                      return (
                                        <div
                                          key={mesCompetencia}
                                          className="text-sm"
                                        >
                                          <span className="font-medium">
                                            {new Date(
                                              0,
                                              mesCompetencia - 1
                                            ).toLocaleString("pt-BR", {
                                              month: "short",
                                            })}
                                            /{anoAtual}
                                          </span>
                                          <div>Vence: {dataVencimento}</div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa 4: Parcelamentos */}
            {/* Etapa 4: Parcelamentos */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Parcelamentos</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione os parcelamentos da empresa
                </p>

                <div className="space-y-4">
                  {form.watch("parcelamentos")?.map((parcelamento, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          Parcelamento {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const current =
                              form.getValues("parcelamentos") || [];
                            form.setValue(
                              "parcelamentos",
                              current.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          Remover
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`parcelamentos.${index}.ambito`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Âmbito*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o âmbito" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="FEDERAL">
                                    Federal
                                  </SelectItem>
                                  <SelectItem value="ESTADUAL">
                                    Estadual
                                  </SelectItem>
                                  <SelectItem value="MUNICIPAL">
                                    Municipal
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`parcelamentos.${index}.debitoConsolidado`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Débito Consolidado (R$)*</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`parcelamentos.${index}.numeroParcelas`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Parcelas*</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`parcelamentos.${index}.dataVencimento`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Data do Primeiro Vencimento*
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`parcelamentos.${index}.observacoes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Observações</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={3}
                                    placeholder="Informações adicionais sobre o parcelamento"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addParcelamento} // Usa a função corrigida
                  >
                    Adicionar Parcelamento
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
              ) : (
                <div></div>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Empresa"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
