"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

// Definição da interface para BaseLegal
interface BaseLegal {
  id: string;
  titulo: string;
  descricao: string;
  link: string;
  uf: string;
  categoria: string;
  dataPublicacao: string;
  usuarioId: string;
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

// Categorias possíveis para as bases legais
const categoriasBaseLegal = [
  "ICMS",
  "ISS",
  "IPI",
  "IRPJ",
  "CSLL",
  "PIS",
  "COFINS",
  "Simples Nacional",
  "Outros",
];

export default function BibliotecaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [basesLegais, setBasesLegais] = useState<BaseLegal[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaBaseLegal, setNovaBaseLegal] = useState({
    titulo: "",
    descricao: "",
    link: "",
    uf: "",
    categoria: "",
    dataPublicacao: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      carregarBasesLegais();
    }
  }, [status, router, ufSelecionada]);

  const carregarBasesLegais = async () => {
    if (!ufSelecionada) {
      setCarregando(false);
      return;
    }
    if (!session) return;
    try {
      setCarregando(true);
      // Buscar bases legais do banco de dados
      const response = await fetch(
        `/api/bases-legais?uf=${ufSelecionada}&usuarioId=${session.user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setBasesLegais(data);
      } else {
        console.error("Erro ao carregar bases legais");
      }
    } catch (error) {
      console.error("Erro ao carregar bases legais:", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarUF = (uf: string) => {
    setUfSelecionada(uf);
  };

  const handleAdicionarBaseLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const response = await fetch("/api/bases-legais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novaBaseLegal,
          uf: ufSelecionada,
          usuarioId: session.user.id, // Adicionar o ID do usuário
        }),
      });

      if (response.ok) {
        setDialogAberto(false);
        setNovaBaseLegal({
          titulo: "",
          descricao: "",
          link: "",
          uf: "",
          categoria: "",
          dataPublicacao: new Date().toISOString().split("T")[0],
        });
        carregarBasesLegais(); // Recarregar a lista
      } else {
        console.error("Erro ao adicionar base legal");
      }
    } catch (error) {
      console.error("Erro ao adicionar base legal:", error);
    }
  };

  const voltarParaUFs = () => {
    setUfSelecionada(null);
    setBasesLegais([]);
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
      <h1 className="text-3xl font-bold mb-6">Biblioteca de Bases Legais</h1>

      {!ufSelecionada ? (
        <>
          <div className="mb-6">
            <Label htmlFor="pesquisa" className="text-lg">
              Pesquisar UF
            </Label>
            <Input
              id="pesquisa"
              type="text"
              placeholder="Digite o nome ou sigla de uma UF"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                Voltar
              </Button>
              <h2 className="text-2xl font-semibold">
                Bases Legais -{" "}
                {
                  estadosBrasileiros.find((e) => e.sigla === ufSelecionada)
                    ?.nome
                }
              </h2>
            </div>

            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Base Legal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
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

                <form onSubmit={handleAdicionarBaseLegal}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="titulo" className="text-right">
                        Título *
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
                        className="col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="descricao" className="text-right">
                        Descrição
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
                        className="col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="link" className="text-right">
                        Link
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
                        className="col-span-3"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoria" className="text-right">
                        Categoria
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
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoriasBaseLegal.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dataPublicacao" className="text-right">
                        Data de Publicação
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
                        className="col-span-3"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit">Salvar Base Legal</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {carregando ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {basesLegais.length > 0 ? (
                basesLegais.map((base) => (
                  <Card key={base.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
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

                      <div className="flex flex-col items-end gap-2">
                        {base.link && (
                          <Button asChild variant="outline" className="mb-2">
                            <a
                              href={base.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Conferir Base Legal
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
                    Nenhuma base legal encontrada para esta UF.
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

// Componente para o botão de anotações
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

  const salvarAnotacao = async () => {
    try {
      const method = anotacao ? "PUT" : "POST";
      const url = anotacao ? `/api/anotacoes/${anotacao.id}` : "/api/anotacoes";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conteudo,
          baseLegalId: baseLegal.id,
          usuarioId: session.user.id,
        }),
      });

      if (response.ok) {
        setEditando(false);
        carregarAnotacao(); // Recarregar a anotação
      } else {
        console.error("Erro ao salvar anotação");
      }
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
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
            <EditorRichText conteudo={conteudo} setConteudo={setConteudo} />
          ) : (
            <div
              className="prose max-w-none p-4 border rounded-md h-full overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html:
                  conteudo ||
                  "<p>Nenhuma anotação ainda. Clique em Editar para adicionar.</p>",
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

// Componente editor de texto rico
function EditorRichText({
  conteudo,
  setConteudo,
}: {
  conteudo: string;
  setConteudo: (conteudo: string) => void;
}) {
  const aplicarFormato = (comando: string, valor: string = "") => {
    document.execCommand(comando, false, valor);
    // Atualizar o conteúdo após aplicar o formato
    const editor = document.getElementById("editor");
    if (editor) {
      setConteudo(editor.innerHTML);
    }
  };

  const inserirCabecalho = (nivel: number) => {
    aplicarFormato("formatBlock", `<h${nivel}>`);
  };

  return (
    <div className="border rounded-md h-full flex flex-col">
      <div className="border-b p-2 flex flex-wrap gap-1">
        <button
          onClick={() => aplicarFormato("bold")}
          className="p-1 rounded hover:bg-gray-100"
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => aplicarFormato("italic")}
          className="p-1 rounded hover:bg-gray-100"
          title="Itálico"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => aplicarFormato("underline")}
          className="p-1 rounded hover:bg-gray-100"
          title="Sublinhado"
        >
          <u>S</u>
        </button>
        <div className="border-l mx-1 h-6"></div>
        <button
          onClick={() => inserirCabecalho(1)}
          className="p-1 rounded hover:bg-gray-100"
          title="Título 1"
        >
          H1
        </button>
        <button
          onClick={() => inserirCabecalho(2)}
          className="p-1 rounded hover:bg-gray-100"
          title="Título 2"
        >
          H2
        </button>
        <button
          onClick={() => inserirCabecalho(3)}
          className="p-1 rounded hover:bg-gray-100"
          title="Título 3"
        >
          H3
        </button>
        <div className="border-l mx-1 h-6"></div>
        <button
          onClick={() => aplicarFormato("insertUnorderedList")}
          className="p-1 rounded hover:bg-gray-100"
          title="Lista não ordenada"
        >
          • Lista
        </button>
        <button
          onClick={() => aplicarFormato("insertOrderedList")}
          className="p-1 rounded hover:bg-gray-100"
          title="Lista ordenada"
        >
          1. Lista
        </button>
        <div className="border-l mx-1 h-6"></div>
        <button
          onClick={() => aplicarFormato("justifyLeft")}
          className="p-1 rounded hover:bg-gray-100"
          title="Alinhar à esquerda"
        >
          ↶
        </button>
        <button
          onClick={() => aplicarFormato("justifyCenter")}
          className="p-1 rounded hover:bg-gray-100"
          title="Centralizar"
        >
          ⇄
        </button>
        <button
          onClick={() => aplicarFormato("justifyRight")}
          className="p-1 rounded hover:bg-gray-100"
          title="Alinhar à direita"
        >
          ↷
        </button>
      </div>
      <div
        id="editor"
        className="p-4 flex-1 overflow-auto prose max-w-none focus:outline-none"
        contentEditable
        dangerouslySetInnerHTML={{ __html: conteudo }}
        onInput={(e) => setConteudo(e.currentTarget.innerHTML)}
        style={{ minHeight: "300px" }}
      />
    </div>
  );
}
