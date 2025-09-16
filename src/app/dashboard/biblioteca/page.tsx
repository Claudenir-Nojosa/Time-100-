"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditorRichText } from "@/components/shared/editorRichText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  ExternalLink,
  ArrowLeft,
  FileText,
  Save,
  Edit,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  Upload,
  X,
  Eye,
  Filter,
  Star,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// Definição da interface para BaseLegal
interface ArquivoBaseLegal {
  id: string;
  nome: string;
  url: string;
  tamanho: number;
  baseLegalId: string;
}

// Atualize a interface BaseLegal
interface BaseLegal {
  id: string;
  titulo: string;
  descricao: string;
  link: string;
  uf: string; // Já existe
  categoria: string;
  dataPublicacao: string;
  usuarioId: string;
  tags: string[];
  tipoTributo: string;
  status: string;
  anotacoes: string;
  ArquivoBaseLegal: ArquivoBaseLegal[];
  favoritos: BaseLegalFavorito[];
  Anotacao: Anotacao[];
}
// Definição da interface para Anotacao
interface Anotacao {
  id: string;
  conteudo: string;
  baseLegalId: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
}

interface BaseLegalFavorito {
  id: string;
  baseLegalId: string;
  usuarioId: string;
  createdAt: string;
}

// Definição das UFs brasileiras
const estadosBrasileiros = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

const opcoesFederais = [{ sigla: "FED", nome: "Base Federal" }];

// Tipos de tributo
const tiposTributo = [
  "ICMS",
  "ISS",
  "IPI",
  "IRPJ",
  "CSLL",
  "PIS",
  "COFINS",
  "Simples Nacional",
  "Contribuição Estadual",
  "Outros",
];

// Categorias/Assuntos
const categoriasBaseLegal = [
  "Substituição Tributária",
  "Retenção",
  "Diferencial de Alíquotas",
  "Crédito Presumido",
  "Regime Especial",
  "Isenção",
  "Redução de Base",
  "Compensação",
  "Outros",
];

export default function BibliotecaPage() {
  const { data: session, status } = useSession();
  const [mostrarBases, setMostrarBases] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const router = useRouter();
  const [editandoBaseLegal, setEditandoBaseLegal] = useState<BaseLegal | null>(
    null
  );
  const [dialogEdicaoAberto, setDialogEdicaoAberto] = useState(false);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState(false);
  const [baseParaExcluir, setBaseParaExcluir] = useState<BaseLegal | null>(
    null
  );
  const [basesLegais, setBasesLegais] = useState<BaseLegal[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [previewAberto, setPreviewAberto] = useState(false);
  const [novaTag, setNovaTag] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    apenasFavoritos: false,
    tags: [] as string[],
    palavraChave: "",
    tipoTributo: "",
    categoria: "",
    uf: "",
  });
  const [todasTags, setTodasTags] = useState<string[]>([]);
  const [basesFiltradas, setBasesFiltradas] = useState<BaseLegal[]>([]);

  const [novaBaseLegal, setNovaBaseLegal] = useState({
    titulo: "",
    descricao: "",
    link: "",
    uf: ufSelecionada || "",
    categoria: "",
    dataPublicacao: new Date().toISOString().split("T")[0],
    tags: [] as string[],
    tipoTributo: "",
    anotacoes: "",
    arquivos: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      carregarBasesLegais();
    }
  }, [status, router, ufSelecionada]);

  useEffect(() => {
    setNovaBaseLegal((prev) => ({
      ...prev,
      uf: ufSelecionada || "",
    }));
  }, [ufSelecionada]);

  const carregarTodasTags = async () => {
    try {
      const response = await fetch("/api/bases-legais/tags");
      if (response.ok) {
        const tags = await response.json();
        setTodasTags(tags);
      }
    } catch (error) {
      console.error("Erro ao carregar tags:", error);
    }
  };

  // Adicione estas funções no componente principal
  const handleEditarBaseLegal = (base: BaseLegal) => {
    setEditandoBaseLegal(base);
    setNovaBaseLegal({
      titulo: base.titulo,
      descricao: base.descricao || "",
      link: base.link || "",
      uf: base.uf,
      categoria: base.categoria || "",
      dataPublicacao: new Date(base.dataPublicacao).toISOString().split("T")[0],
      tags: base.tags || [],
      tipoTributo: base.tipoTributo || "",
      anotacoes: base.anotacoes || "",
      arquivos: [],
    });
    setDialogEdicaoAberto(true);
  };

  const handleExcluirBaseLegal = (base: BaseLegal) => {
    setBaseParaExcluir(base);
    setDialogExclusaoAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!baseParaExcluir) return;

    // Toast de carregamento
    const toastId = toast.loading("Excluindo base legal...");

    try {
      const response = await fetch(`/api/bases-legais/${baseParaExcluir.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBasesLegais(
          basesLegais.filter((base) => base.id !== baseParaExcluir.id)
        );
        setDialogExclusaoAberto(false);
        setBaseParaExcluir(null);

        // Toast de sucesso
        toast.success("Base legal excluída com sucesso!", {
          id: toastId,
          description: `"${baseParaExcluir.titulo}" foi removida permanentemente.`,
          duration: 3000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir");
      }
    } catch (error: any) {
      // Toast de erro
      toast.error("Erro ao excluir base legal", {
        id: toastId,
        description: error.message || "Tente novamente mais tarde.",
        duration: 5000,
      });
      console.error("Erro ao excluir base legal:", error);
    }
  };

  const handleAtualizarBaseLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoBaseLegal) return;
    const toastId = toast.loading("Atualizando base legal...");
    try {
      const formData = new FormData();
      formData.append("titulo", novaBaseLegal.titulo);
      formData.append("descricao", novaBaseLegal.descricao || "");
      formData.append("link", novaBaseLegal.link || "");
      formData.append("uf", novaBaseLegal.uf);
      formData.append("categoria", novaBaseLegal.categoria || "");
      formData.append("dataPublicacao", novaBaseLegal.dataPublicacao);
      formData.append("tags", JSON.stringify(novaBaseLegal.tags));
      formData.append("tipoTributo", novaBaseLegal.tipoTributo || "");
      formData.append("anotacoes", novaBaseLegal.anotacoes || "");

      arquivos.forEach((arquivo) => {
        formData.append("arquivos", arquivo);
      });

      const response = await fetch(
        `/api/bases-legais/${editandoBaseLegal.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        const baseAtualizada = await response.json();
        setBasesLegais(
          basesLegais.map((base) =>
            base.id === baseAtualizada.id ? baseAtualizada : base
          )
        );
        setDialogEdicaoAberto(false);
        setEditandoBaseLegal(null);
        setArquivos([]);
        toast.success("Base legal atualizada!", {
          id: toastId,
          description: `"${novaBaseLegal.titulo}" foi atualizada com sucesso.`,
          duration: 3000,
        });
      } else {
        console.error("Erro ao atualizar base legal");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar base legal", {
        id: toastId,
        description: error.message || "Tente novamente mais tarde.",
        duration: 5000,
      });
    }
  };

  const carregarBasesLegais = async () => {
    if (!session) return;
    try {
      setCarregando(true);

      const params = new URLSearchParams({
        usuarioId: session.user.id,
        apenasFavoritos: filtros.apenasFavoritos.toString(),
        tags: filtros.tags.join(","),
        palavraChave: filtros.palavraChave,
        tipoTributo: filtros.tipoTributo,
        categoria: filtros.categoria,
      });

      // Se há UF selecionada, adiciona ao filtro
      if (ufSelecionada) {
        params.append("uf", ufSelecionada);
      }

      console.log("Carregando bases com filtros:", params.toString());

      const response = await fetch(`/api/bases-legais?${params}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Bases carregadas:", data.length);
        setBasesLegais(data);
        setBasesFiltradas(data);
      } else {
        console.error("Erro ao carregar bases legais");
      }
    } catch (error) {
      console.error("Erro ao carregar bases legais:", error);
    } finally {
      setCarregando(false);
    }
  };

  const toggleFavorito = async (baseLegal: BaseLegal) => {
    if (!session) return;

    try {
      const response = await fetch("/api/bases-legais/favoritos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseLegalId: baseLegal.id,
          usuarioId: session.user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Atualizar a lista de bases legais
        carregarBasesLegais();
        toast.success(
          result.favoritado
            ? "Adicionado aos favoritos!"
            : "Removido dos favoritos!"
        );
      } else {
        console.error("Erro ao atualizar favorito:", result.error);
        toast.error("Erro ao atualizar favorito");
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleFiltroChange = (novosFiltros: Partial<typeof filtros>) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  };
  useEffect(() => {
    if (session) {
      carregarBasesLegais();
    }
  }, [
    filtros.apenasFavoritos,
    filtros.tipoTributo,
    filtros.categoria,
    filtros.palavraChave,
    ufSelecionada,
    session,
  ]);
  // Remova o useEffect para filtros locais ou atualize para não incluir palavra-chave
  useEffect(() => {
    if (basesLegais.length > 0) {
      // Apenas tags são filtros locais agora
      aplicarFiltrosLocais(basesLegais);
    }
  }, [filtros.tags, basesLegais]);
  // Crie uma função separada para filtros locais (apenas tags)
  const aplicarFiltrosLocais = (bases: BaseLegal[]) => {
    let filtered = bases;

    // Filtro de tags
    if (filtros.tags.length > 0) {
      filtered = filtered.filter((base) =>
        filtros.tags.every((tag) => base.tags.includes(tag))
      );
    }

    // Filtro de palavra-chave (local) - INCLUI ANOTAÇÕES
    if (filtros.palavraChave) {
      const keyword = filtros.palavraChave.toLowerCase();
      filtered = filtered.filter((base) => {
        return (
          // Campos principais
          base.titulo.toLowerCase().includes(keyword) ||
          base.descricao?.toLowerCase().includes(keyword) ||
          base.anotacoes?.toLowerCase().includes(keyword) || // Anotações iniciais (string)
          base.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
          // Anotações do usuário (array de objetos Anotacao)
          (base.Anotacao &&
            base.Anotacao.some((anotacao) =>
              anotacao.conteudo.toLowerCase().includes(keyword)
            ))
        );
      });
    }

    setBasesFiltradas(filtered);
  };
  const handleSelecionarUF = (uf: string) => {
    if (uf === "FED") {
      // Lógica específica para bases federais
      setUfSelecionada("FED");
    } else {
      setUfSelecionada(uf);
    }
  };

  const adicionarTag = () => {
    if (novaTag.trim() && !novaBaseLegal.tags.includes(novaTag.trim())) {
      setNovaBaseLegal({
        ...novaBaseLegal,
        tags: [...novaBaseLegal.tags, novaTag.trim()],
      });
      setNovaTag("");
    }
  };

  const removerTag = (tagToRemove: string) => {
    setNovaBaseLegal({
      ...novaBaseLegal,
      tags: novaBaseLegal.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setArquivos((prev) => [...prev, ...newFiles]);
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const sugerirTags = () => {
    const sugestoes: string[] = [];
    const titulo = novaBaseLegal.titulo.toLowerCase();

    if (titulo.includes("icms-st") || titulo.includes("st")) {
      sugestoes.push("Substituição Tributária");
    }
    if (titulo.includes("retenção") || titulo.includes("ret")) {
      sugestoes.push("Retenção");
    }
    if (titulo.includes("diferencial") || titulo.includes("difal")) {
      sugestoes.push("Diferencial de Alíquotas");
    }
    if (titulo.includes("crédito") || titulo.includes("presumido")) {
      sugestoes.push("Crédito Presumido");
    }
    if (titulo.includes("regime") || titulo.includes("especial")) {
      sugestoes.push("Regime Especial");
    }

    return sugestoes.filter((tag) => !novaBaseLegal.tags.includes(tag));
  };

  const handleAdicionarBaseLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const toastId = toast.loading("Salvando base legal...");
    try {
      const formData = new FormData();
      formData.append("titulo", novaBaseLegal.titulo);
      formData.append("descricao", novaBaseLegal.descricao);
      formData.append("link", novaBaseLegal.link);
      formData.append("uf", ufSelecionada || "");
      formData.append("categoria", novaBaseLegal.categoria);
      formData.append("dataPublicacao", novaBaseLegal.dataPublicacao);
      formData.append("tags", JSON.stringify(novaBaseLegal.tags));
      formData.append("tipoTributo", novaBaseLegal.tipoTributo);
      formData.append("anotacoes", novaBaseLegal.anotacoes);
      formData.append("usuarioId", session.user.id);

      arquivos.forEach((arquivo) => {
        formData.append("arquivos", arquivo); // Nome igual para todos
      });

      const response = await fetch("/api/bases-legais", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setDialogAberto(false);
        setNovaBaseLegal({
          titulo: "",
          descricao: "",
          link: "",
          uf: ufSelecionada || "",
          categoria: "",
          dataPublicacao: new Date().toISOString().split("T")[0],
          tags: [],
          tipoTributo: "",
          anotacoes: "",
          arquivos: [],
        });
        toast.success("Base legal criada com sucesso!", {
          id: toastId,
          description: `"${novaBaseLegal.titulo}" foi adicionada à biblioteca.`,
          duration: 3000,
        });
        setArquivos([]);
        carregarBasesLegais();
      } else {
        console.error("Erro ao adicionar base legal");
      }
    } catch (error: any) {
      toast.error("Erro ao criar base legal", {
        id: toastId,
        description: error.message || "Tente novamente mais tarde.",
        duration: 5000,
      });
    }
  };

  const voltarParaUFs = () => {
    setUfSelecionada(null);
    setBasesLegais([]);
  };

  // Adicione estas funções no componente principal
  const handleExcluirArquivoExistente = async (arquivoId: string) => {
    if (!editandoBaseLegal) return;

    const arquivo = editandoBaseLegal.ArquivoBaseLegal?.find(
      (a) => a.id === arquivoId
    );
    const toastId = toast.loading("Excluindo arquivo...");

    try {
      const response = await fetch(`/api/arquivos-base-legal/${arquivoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Atualizar a base legal em edição removendo o arquivo
        setEditandoBaseLegal({
          ...editandoBaseLegal,
          ArquivoBaseLegal:
            editandoBaseLegal.ArquivoBaseLegal?.filter(
              (arquivo) => arquivo.id !== arquivoId
            ) || [],
        });

        // Toast de sucesso
        toast.success("Arquivo excluído!", {
          id: toastId,
          description: `"${arquivo?.nome}" foi removido.`,
          duration: 2000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir arquivo");
      }
    } catch (error: any) {
      // Toast de erro
      toast.error("Erro ao excluir arquivo", {
        id: toastId,
        description: error.message || "Tente novamente mais tarde.",
        duration: 4000,
      });
      console.error("Erro ao excluir arquivo:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <div>Não autenticado</div>;
  }

  return (
    <div className="container mx-auto p-6 mt-20">
      {/* Diálogo de Edição - Adicione isso no return do componente principal */}
      <Dialog
        open={dialogEdicaoAberto}
        onOpenChange={(open) => {
          setDialogEdicaoAberto(open);
          if (!open) {
            setEditandoBaseLegal(null);
            setArquivos([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Base Legal</DialogTitle>
            <DialogDescription>
              Edite os dados da base legal para{" "}
              {
                estadosBrasileiros.find(
                  (e) => e.sigla === editandoBaseLegal?.uf
                )?.nome
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAtualizarBaseLegal} className="space-y-6">
            {/* Campos Principais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📋 Campos Principais</h3>
              <div className="grid gap-4">
                <form onSubmit={handleAdicionarBaseLegal} className="space-y-6">
                  {/* Campos Principais */}
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="titulo" className="text-sm font-medium">
                          Título da base legal *
                        </Label>
                        <Input
                          id="titulo"
                          required
                          value={novaBaseLegal.titulo}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              titulo: e.target.value,
                            })
                          }
                          placeholder="Ex: RET - Seminovos, Decreto nº 33.327/2019"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="descricao"
                          className="text-sm font-medium"
                        >
                          Descrição breve
                        </Label>
                        <Textarea
                          id="descricao"
                          value={novaBaseLegal.descricao}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Ex: Regime Especial de Tributação para veículos usados no Ceará"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="uf" className="text-sm font-medium">
                          UF
                        </Label>
                        <Input
                          id="uf"
                          value={
                            estadosBrasileiros.find(
                              (e) => e.sigla === ufSelecionada
                            )?.nome || ""
                          }
                          readOnly
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="tipoTributo"
                            className="text-sm font-medium"
                          >
                            Tipo de tributo
                          </Label>
                          <select
                            id="tipoTributo"
                            value={novaBaseLegal.tipoTributo}
                            onChange={(e) =>
                              setNovaBaseLegal({
                                ...novaBaseLegal,
                                tipoTributo: e.target.value,
                              })
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tributo</option>
                            {tiposTributo.map((tributo) => (
                              <option key={tributo} value={tributo}>
                                {tributo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="link" className="text-sm font-medium">
                          Link oficial
                        </Label>
                        <Input
                          id="link"
                          type="url"
                          value={novaBaseLegal.link}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              link: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="dataPublicacao"
                          className="text-sm font-medium"
                        >
                          Data de publicação / vigência
                        </Label>
                        <Input
                          id="dataPublicacao"
                          type="date"
                          value={novaBaseLegal.dataPublicacao}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              dataPublicacao: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categorias/Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      📂 Categoria / Assunto
                    </h3>

                    <div>
                      <Label
                        htmlFor="categoria"
                        className="text-sm font-medium"
                      >
                        Categoria principal
                      </Label>
                      <select
                        id="categoria"
                        value={novaBaseLegal.categoria}
                        onChange={(e) =>
                          setNovaBaseLegal({
                            ...novaBaseLegal,
                            categoria: e.target.value,
                          })
                        }
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoriasBaseLegal.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="tags" className="text-sm font-medium">
                        Tags (assuntos adicionais)
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="tags"
                          value={novaTag}
                          onChange={(e) => setNovaTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), adicionarTag())
                          }
                          placeholder="Digite uma tag e pressione Enter"
                          className="flex-1"
                        />
                        <Button type="button" onClick={adicionarTag}>
                          Adicionar
                        </Button>
                      </div>

                      {/* Sugestões de tags */}
                      {sugerirTags().length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">
                            Sugestões:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {sugerirTags().map((tag) => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNovaBaseLegal({
                                    ...novaBaseLegal,
                                    tags: [...novaBaseLegal.tags, tag],
                                  });
                                }}
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags selecionadas */}
                      {novaBaseLegal.tags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {novaBaseLegal.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removerTag(tag)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewAberto(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Pré-visualizar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogAberto(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Base Legal
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </div>
            </div>

            {/* Seção de Arquivos com visualização dos existentes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📁 Arquivos Existentes</h3>
              {editandoBaseLegal?.ArquivoBaseLegal &&
              editandoBaseLegal.ArquivoBaseLegal.length > 0 ? (
                <div className="space-y-2">
                  {editandoBaseLegal.ArquivoBaseLegal.map((arquivo) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{arquivo.nome}</p>
                          <p className="text-xs text-gray-500">
                            {(arquivo.tamanho / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleExcluirArquivoExistente(arquivo.id)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum arquivo anexado.</p>
              )}
            </div>

            {/* Seção para adicionar novos arquivos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                📁 Adicionar Novos Arquivos
              </h3>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Arquivos
                </Button>
              </div>

              {arquivos.length > 0 && (
                <div className="space-y-2">
                  {arquivos.map((arquivo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{arquivo.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(arquivo.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerArquivo(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewAberto(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogEdicaoAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Atualizar Base Legal
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog
        open={dialogExclusaoAberto}
        onOpenChange={setDialogExclusaoAberto}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a base legal "
              {baseParaExcluir?.titulo}"? Esta ação não pode ser desfeita e
              todos os arquivos anexados serão removidos.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={!baseParaExcluir}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <h1 className="text-3xl font-bold mb-6">Biblioteca de Bases Legais</h1>

      {!ufSelecionada ? (
        <>
          {/* SEÇÃO DE FILTROS NA PÁGINA PRINCIPAL */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Filtrar Bases Legais</h2>
              <Button
                variant="outline"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>
              <Button
                variant={mostrarBases ? "secondary" : "default"}
                onClick={() => setMostrarBases(!mostrarBases)}
                disabled={basesFiltradas.length === 0}
                className="flex items-center"
              >
                {mostrarBases ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Bases
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar Bases
                  </>
                )}
                {basesFiltradas.length > 0 && (
                  <span className="ml-2 bg-primary-foreground text-primary rounded-full h-5 w-5 text-xs flex items-center justify-center">
                    {basesFiltradas.length}
                  </span>
                )}
              </Button>
            </div>

            {mostrarFiltros && (
              <div className="p-4 border rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Filtro de favoritos */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apenasFavoritos"
                      checked={filtros.apenasFavoritos}
                      onChange={(e) =>
                        handleFiltroChange({
                          apenasFavoritos: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="apenasFavoritos"
                      className="text-sm font-medium"
                    >
                      Apenas favoritos
                    </Label>
                  </div>

                  {/* Campo de busca */}
                  <div>
                    <Label
                      htmlFor="palavraChave"
                      className="text-sm font-medium"
                    >
                      Palavra-chave
                    </Label>
                    <Input
                      id="palavraChave"
                      value={filtros.palavraChave}
                      onChange={(e) =>
                        handleFiltroChange({
                          palavraChave: e.target.value,
                        })
                      }
                      placeholder="Buscar em título, descrição..."
                      className="mt-1"
                    />
                  </div>

                  {/* Filtro de tipo de tributo */}
                  <div>
                    <Label
                      htmlFor="tipoTributo"
                      className="text-sm font-medium"
                    >
                      Tipo de Tributo
                    </Label>
                    <select
                      id="tipoTributo"
                      value={filtros.tipoTributo}
                      onChange={(e) =>
                        handleFiltroChange({
                          tipoTributo: e.target.value,
                        })
                      }
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Todos os tributos</option>
                      {tiposTributo.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro de categoria */}
                  <div>
                    <Label htmlFor="categoria" className="text-sm font-medium">
                      Categoria
                    </Label>
                    <select
                      id="categoria"
                      value={filtros.categoria}
                      onChange={(e) =>
                        handleFiltroChange({
                          categoria: e.target.value,
                        })
                      }
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Todas categorias</option>
                      {categoriasBaseLegal.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtro de tags */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {todasTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={
                          filtros.tags.includes(tag) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          const novasTags = filtros.tags.includes(tag)
                            ? filtros.tags.filter((t) => t !== tag)
                            : [...filtros.tags, tag];
                          handleFiltroChange({ tags: novasTags });
                        }}
                        className="text-xs h-8 px-3"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleFiltroChange({
                        apenasFavoritos: false,
                        tags: [],
                        palavraChave: "",
                        tipoTributo: "",
                        categoria: "",
                        uf: "",
                      })
                    }
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}

            {/* Mostra filtros ativos */}
            {(filtros.apenasFavoritos ||
              filtros.tags.length > 0 ||
              filtros.palavraChave ||
              filtros.tipoTributo ||
              filtros.categoria) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filtros.apenasFavoritos && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Favoritos
                    <button
                      onClick={() =>
                        handleFiltroChange({ apenasFavoritos: false })
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => {
                        const novasTags = filtros.tags.filter((t) => t !== tag);
                        handleFiltroChange({ tags: novasTags });
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {filtros.palavraChave && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    "{filtros.palavraChave}"
                    <button
                      onClick={() => handleFiltroChange({ palavraChave: "" })}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.tipoTributo && (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {filtros.tipoTributo}
                    <button
                      onClick={() => handleFiltroChange({ tipoTributo: "" })}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.categoria && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {filtros.categoria}
                    <button
                      onClick={() => handleFiltroChange({ categoria: "" })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* LISTA DE BASES FILTRADAS (TODAS UFs) */}
          {mostrarBases && basesFiltradas.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Bases Encontradas ({basesFiltradas.length})
                </h3>
              </div>
              <div className="space-y-4">
                {basesFiltradas.map((base) => (
                  <Card key={base.id} className="p-6 relative">
                    {/* Botão de favorito */}
                    <div className="absolute top-0 left-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorito(base)}
                        className="h-8 w-8 text-yellow-400 hover:text-yellow-600 hover:bg-transparent"
                        title={
                          base.favoritos?.some(
                            (f: BaseLegalFavorito) =>
                              f.usuarioId === session?.user.id
                          )
                            ? "Remover dos favoritos"
                            : "Adicionar aos favoritos"
                        }
                      >
                        {base.favoritos?.some(
                          (f: BaseLegalFavorito) =>
                            f.usuarioId === session?.user.id
                        ) ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-12">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {base.uf}
                          </span>
                          {base.categoria && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {base.categoria}
                            </span>
                          )}
                          {base.tipoTributo && (
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {base.tipoTributo}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold">{base.titulo}</h3>
                        <p className="text-gray-600 mt-2">{base.descricao}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          Publicado em:{" "}
                          {new Date(base.dataPublicacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>

                        {/* Tags */}
                        {base.tags.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {base.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleSelecionarUF(base.uf)}
                        className="ml-4"
                      >
                        Ver mais de {base.uf}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem quando não há bases */}
          {mostrarBases && basesFiltradas.length === 0 && (
            <div className="text-center py-10 border rounded-lg mb-6">
              <p className="text-gray-500 mb-4">
                Nenhuma base legal encontrada com os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleFiltroChange({
                    apenasFavoritos: false,
                    tags: [],
                    palavraChave: "",
                    tipoTributo: "",
                    categoria: "",
                  });
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}

          {/* LISTA DE UFs (mantém o original) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Quadrado para Base Federal */}
            {opcoesFederais
              .filter(
                (federal) =>
                  federal.nome
                    .toLowerCase()
                    .includes(termoPesquisa.toLowerCase()) ||
                  federal.sigla
                    .toLowerCase()
                    .includes(termoPesquisa.toLowerCase())
              )
              .map((federal) => (
                <Card
                  key={federal.sigla}
                  className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-orange-300 dark:border-orange-500/60 shadow-md"
                  onClick={() => handleSelecionarUF(federal.sigla)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-24 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                      {federal.sigla}
                    </div>
                    <div className="text-sm text-center mt-2 text-orange-700 dark:text-orange-200/90">
                      {federal.nome}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Estados brasileiros */}
            {estadosBrasileiros
              .filter(
                (estado) =>
                  estado.nome
                    .toLowerCase()
                    .includes(termoPesquisa.toLowerCase()) ||
                  estado.sigla
                    .toLowerCase()
                    .includes(termoPesquisa.toLowerCase())
              )
              .map((estado) => (
                <Card
                  key={estado.sigla}
                  className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                  onClick={() => handleSelecionarUF(estado.sigla)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-24">
                    <div className="text-2xl font-bold">{estado.sigla}</div>
                    <div className="text-sm text-center mt-2">
                      {estado.nome}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={voltarParaUFs}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para todas UFs
              </Button>
              <h2 className="text-2xl font-semibold">
                Bases Legais -{" "}
                {ufSelecionada === "FED"
                  ? "Base Federal"
                  : estadosBrasileiros.find((e) => e.sigla === ufSelecionada)
                      ?.nome}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className=" ml-[600px]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(filtros.apenasFavoritos ||
                filtros.tags.length > 0 ||
                filtros.palavraChave ||
                filtros.tipoTributo ||
                filtros.categoria) && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Base Legal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Base Legal</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da base legal para{" "}
                    {
                      estadosBrasileiros.find((e) => e.sigla === ufSelecionada)
                        ?.nome
                    }
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAdicionarBaseLegal} className="space-y-6">
                  {/* Campos Principais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      📋 Campos Principais
                    </h3>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="titulo" className="text-sm font-medium">
                          Título da base legal *
                        </Label>
                        <Input
                          id="titulo"
                          required
                          value={novaBaseLegal.titulo}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              titulo: e.target.value,
                            })
                          }
                          placeholder="Ex: RET - Seminovos, Decreto nº 33.327/2019"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="descricao"
                          className="text-sm font-medium"
                        >
                          Descrição breve
                        </Label>
                        <Textarea
                          id="descricao"
                          value={novaBaseLegal.descricao}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Ex: Regime Especial de Tributação para veículos usados no Ceará"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="uf" className="text-sm font-medium">
                          UF
                        </Label>
                        <Input
                          id="uf"
                          value={
                            estadosBrasileiros.find(
                              (e) => e.sigla === ufSelecionada
                            )?.nome || ""
                          }
                          readOnly
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="tipoTributo"
                            className="text-sm font-medium"
                          >
                            Tipo de tributo
                          </Label>
                          <select
                            id="tipoTributo"
                            value={novaBaseLegal.tipoTributo}
                            onChange={(e) =>
                              setNovaBaseLegal({
                                ...novaBaseLegal,
                                tipoTributo: e.target.value,
                              })
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tributo</option>
                            {tiposTributo.map((tributo) => (
                              <option key={tributo} value={tributo}>
                                {tributo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="link" className="text-sm font-medium">
                          Link oficial
                        </Label>
                        <Input
                          id="link"
                          type="url"
                          value={novaBaseLegal.link}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              link: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="dataPublicacao"
                          className="text-sm font-medium"
                        >
                          Data de publicação / vigência
                        </Label>
                        <Input
                          id="dataPublicacao"
                          type="date"
                          value={novaBaseLegal.dataPublicacao}
                          onChange={(e) =>
                            setNovaBaseLegal({
                              ...novaBaseLegal,
                              dataPublicacao: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categorias/Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      📂 Categoria / Assunto
                    </h3>

                    <div>
                      <Label
                        htmlFor="categoria"
                        className="text-sm font-medium"
                      >
                        Categoria principal
                      </Label>
                      <select
                        id="categoria"
                        value={novaBaseLegal.categoria}
                        onChange={(e) =>
                          setNovaBaseLegal({
                            ...novaBaseLegal,
                            categoria: e.target.value,
                          })
                        }
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoriasBaseLegal.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="tags" className="text-sm font-medium">
                        Tags (assuntos adicionais)
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="tags"
                          value={novaTag}
                          onChange={(e) => setNovaTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), adicionarTag())
                          }
                          placeholder="Digite uma tag e pressione Enter"
                          className="flex-1"
                        />
                        <Button type="button" onClick={adicionarTag}>
                          Adicionar
                        </Button>
                      </div>

                      {/* Sugestões de tags */}
                      {sugerirTags().length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">
                            Sugestões:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {sugerirTags().map((tag) => (
                              <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNovaBaseLegal({
                                    ...novaBaseLegal,
                                    tags: [...novaBaseLegal.tags, tag],
                                  });
                                }}
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags selecionadas */}
                      {novaBaseLegal.tags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {novaBaseLegal.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removerTag(tag)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arquivos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      📁 Arquivos / Documentos
                    </h3>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Arquivos
                      </Button>
                      <p className="text-sm text-gray-500 mt-1">
                        Formatos aceitos: PDF, DOC, DOCX, TXT
                      </p>
                    </div>

                    {arquivos.length > 0 && (
                      <div className="space-y-2">
                        {arquivos.map((arquivo, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{arquivo.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(arquivo.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerArquivo(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewAberto(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Pré-visualizar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogAberto(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Base Legal
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mb-4">
            {/* Área de filtros (mostra/oculta) */}
            {mostrarFiltros && (
              <div className="p-4 border rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Filtro de favoritos */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apenasFavoritos"
                      checked={filtros.apenasFavoritos}
                      onChange={(e) =>
                        handleFiltroChange({
                          apenasFavoritos: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="apenasFavoritos"
                      className="text-sm font-medium"
                    >
                      Apenas favoritos
                    </Label>
                  </div>

                  {/* Campo de busca */}
                  <div>
                    <Label
                      htmlFor="palavraChave"
                      className="text-sm font-medium"
                    >
                      Palavra-chave
                    </Label>
                    <Input
                      id="palavraChave"
                      value={filtros.palavraChave}
                      onChange={(e) =>
                        handleFiltroChange({
                          palavraChave: e.target.value,
                        })
                      }
                      placeholder="Buscar em título, descrição..."
                      className="mt-1"
                    />
                  </div>

                  {/* Filtro de tipo de tributo */}
                  <div>
                    <Label
                      htmlFor="tipoTributo"
                      className="text-sm font-medium"
                    >
                      Tipo de Tributo
                    </Label>
                    <select
                      id="tipoTributo"
                      value={filtros.tipoTributo}
                      onChange={(e) =>
                        handleFiltroChange({
                          tipoTributo: e.target.value,
                        })
                      }
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Todos os tributos</option>
                      {tiposTributo.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro de categoria */}
                  <div>
                    <Label htmlFor="categoria" className="text-sm font-medium">
                      Categoria
                    </Label>
                    <select
                      id="categoria"
                      value={filtros.categoria}
                      onChange={(e) =>
                        handleFiltroChange({
                          categoria: e.target.value,
                        })
                      }
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Todas categorias</option>
                      {categoriasBaseLegal.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtro de tags */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {todasTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={
                          filtros.tags.includes(tag) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          const novasTags = filtros.tags.includes(tag)
                            ? filtros.tags.filter((t) => t !== tag)
                            : [...filtros.tags, tag];
                          handleFiltroChange({ tags: novasTags });
                        }}
                        className="text-xs h-8 px-3"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleFiltroChange({
                        apenasFavoritos: false,
                        tags: [],
                        palavraChave: "",
                        tipoTributo: "",
                        categoria: "",
                        uf: "",
                      })
                    }
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}

            {/* Mostra filtros ativos */}
            {(filtros.apenasFavoritos ||
              filtros.tags.length > 0 ||
              filtros.palavraChave ||
              filtros.tipoTributo ||
              filtros.categoria) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filtros.apenasFavoritos && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Favoritos
                    <button
                      onClick={() =>
                        handleFiltroChange({ apenasFavoritos: false })
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => {
                        const novasTags = filtros.tags.filter((t) => t !== tag);
                        handleFiltroChange({ tags: novasTags });
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {filtros.palavraChave && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    "{filtros.palavraChave}"
                    <button
                      onClick={() => handleFiltroChange({ palavraChave: "" })}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.tipoTributo && (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {filtros.tipoTributo}
                    <button
                      onClick={() => handleFiltroChange({ tipoTributo: "" })}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filtros.categoria && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {filtros.categoria}
                    <button
                      onClick={() => handleFiltroChange({ categoria: "" })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Preview Dialog */}
          <Dialog open={previewAberto} onOpenChange={setPreviewAberto}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Pré-visualização do Card</DialogTitle>
              </DialogHeader>
              <div className="p-6 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {novaBaseLegal.titulo || "Título da Base Legal"}
                    </h3>
                    {novaBaseLegal.tipoTributo && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                        {novaBaseLegal.tipoTributo}
                      </span>
                    )}

                    <p className="text-gray-600 mt-2">
                      {novaBaseLegal.descricao ||
                        "Descrição breve da legislação"}
                    </p>
                    <div className="text-sm text-gray-500 mt-2">
                      Publicado em:{" "}
                      {novaBaseLegal.dataPublicacao
                        ? new Date(
                            novaBaseLegal.dataPublicacao
                          ).toLocaleDateString("pt-BR")
                        : "Data não informada"}
                    </div>
                    {novaBaseLegal.tags.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {novaBaseLegal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Resto do código permanece igual */}
          {carregando ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="p-6 border-0 shadow-md bg-gradient-to-r from-gray-50 to-gray-100 animate-pulse"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="h-7 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/3 mt-4"></div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="h-9 bg-gray-300 rounded w-24 mb-2"></div>
                      <div className="h-9 bg-gray-300 rounded w-32"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {basesFiltradas.length > 0 ? (
                basesFiltradas.map((base) => (
                  <Card key={base.id} className="p-6 relative">
                    {/* Botão de favorito */}
                    <div className="absolute top-2 right-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorito(base)}
                        className="h-8 w-8 pl-16 pb-16  text-yellow-400 hover:text-yellow-600 hover:bg-transparent"
                        title={
                          base.favoritos?.some(
                            (f: BaseLegalFavorito) =>
                              f.usuarioId === session?.user.id
                          )
                            ? "Remover dos favoritos"
                            : "Adicionar aos favoritos"
                        }
                      >
                        {base.favoritos?.some(
                          (f: BaseLegalFavorito) =>
                            f.usuarioId === session?.user.id
                        ) ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="absolute top-2 right-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarBaseLegal(base)}
                          className="h-8 w-8 text-blue-300 hover:text-blue-100 hover:bg-transparent"
                          title="Editar base legal"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluirBaseLegal(base)}
                          className="h-8 w-8 text-red-300 hover:text-red-100 hover:bg-transparent"
                          title="Excluir base legal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-16">
                        {" "}
                        <h3 className="text-xl font-semibold">{base.titulo}</h3>
                        {base.categoria && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                            {base.categoria}
                          </span>
                        )}
                        <p className="text-gray-600 mt-2">{base.descricao}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          Publicado em:{" "}
                          {new Date(base.dataPublicacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 mt-6">
                        {base.link && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mb-2"
                          >
                            <a
                              href={base.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Conferir Base
                            </a>
                          </Button>
                        )}

                        <AnotacoesButton baseLegal={base} session={session} />
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-gray-500">
                    {basesLegais.length === 0
                      ? "Nenhuma base legal encontrada para esta UF."
                      : "Nenhuma base legal corresponde aos filtros aplicados."}
                  </p>
                  <Button
                    onClick={() => setDialogAberto(true)}
                    className="mt-4"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar a primeira base legal
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnotacoesButton({
  baseLegal,
  session,
}: {
  baseLegal: BaseLegal;
  session: any;
}) {
  const [anotacao, setAnotacao] = useState<Anotacao | null>(null);
  const [conteudo, setConteudo] = useState("");
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    if (dialogAberto) {
      carregarAnotacao();
    }
  }, [dialogAberto]);

  const carregarAnotacao = async () => {
    try {
      setCarregando(true);
      const response = await fetch(
        `/api/anotacoes?baseLegalId=${baseLegal.id}&usuarioId=${session.user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setAnotacao(data);
          setConteudo(data.conteudo);
        } else {
          setAnotacao(null);
          setConteudo("");
        }
      } else {
        console.error("Erro ao carregar anotação");
      }
    } catch (error) {
      console.error("Erro ao carregar anotação:", error);
    } finally {
      setCarregando(false);
    }
  };

  // No componente AnotacoesButton
  const salvarAnotacao = async () => {
    const html = conteudo || "";

    try {
      if (anotacao) {
        const response = await fetch(`/api/anotacoes/${anotacao.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conteudo: html }),
        });
        if (response.ok) {
          setEditando(false);
          carregarAnotacao();
        } else {
          console.error("Erro ao atualizar anotação");
        }
      } else {
        const response = await fetch("/api/anotacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conteudo: html,
            baseLegalId: baseLegal.id,
            usuarioId: session.user.id,
          }),
        });
        if (response.ok) {
          setEditando(false);
          carregarAnotacao();
        } else {
          console.error("Erro ao criar anotação");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
    }
  };

  const handleDelete = async () => {
    if (anotacao) {
      try {
        const response = await fetch(`/api/anotacoes/${anotacao.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setConteudo("");
          setAnotacao(null);
          setDialogAberto(false);
        } else {
          console.error("Erro ao deletar anotação");
        }
      } catch (error) {
        console.error("Erro ao deletar anotação:", error);
      }
    }
  };

  return (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Anotações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Anotações - {baseLegal.titulo}</DialogTitle>
          <DialogDescription>
            Adicione suas anotações pessoais sobre esta base legal
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {carregando ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : editando ? (
            <EditorRichText
              conteudo={conteudo}
              setConteudo={setConteudo}
              onDelete={handleDelete}
            />
          ) : (
            <div
              className="prose prose-gray dark:prose-invert max-w-none p-4 border rounded-md h-full overflow-y-auto prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-900 dark:prose-em:text-gray-100"
              dangerouslySetInnerHTML={{
                __html:
                  conteudo ||
                  "<p class='text-gray-500'>Nenhuma anotação ainda. Clique em Editar para adicionar.</p>",
              }}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {anotacao && (
              <span className="text-sm text-gray-500">
                Última atualização:{" "}
                {new Date(anotacao.updatedAt).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {editando ? (
              <>
                <Button variant="outline" onClick={() => setEditando(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarAnotacao}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditando(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {conteudo ? "Editar" : "Adicionar"} Anotação
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
