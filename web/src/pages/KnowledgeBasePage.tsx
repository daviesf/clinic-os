import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Plus, ArrowLeft, Trash2, Globe, File, Link as LinkIcon } from "lucide-react";
import { api } from "../services/api";

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("TEXT");

  const { data: items, isLoading } = useQuery({
    queryKey: ["knowledgebase"],
    queryFn: async () => {
      const res = await api.get("/api/knowledge");
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/knowledge", {
        title: newTitle,
        content: newContent,
        type: newType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgebase"] });
      setIsModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewType("TEXT");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgebase"] });
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="size-6 text-primary" /> Base de Conhecimento
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="size-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border">
              <BookOpen className="size-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-medium">Nenhum documento encontrado</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Adicione textos, manuais ou links para treinar a Inteligência Artificial da sua clínica.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Adicionar primeiro documento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items?.map((item: any) => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      {item.type === "TEXT" ? <FileText className="size-5" /> : item.type === "URL" ? <Globe className="size-5" /> : <File className="size-5" />}
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-1 truncate" title={item.title}>{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Adicionado em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground border-t border-border pt-4">
                    <span className="flex items-center gap-1">
                      <LinkIcon className="size-3" /> {item.type}
                    </span>
                    <span className="text-primary cursor-pointer hover:underline">Ver detalhes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-bold mb-6">Adicionar Conhecimento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Como agendar retorno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="TEXT">Texto Direto</option>
                  <option value="URL">Link de Site</option>
                  <option value="PDF">Arquivo PDF (em breve)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Conteúdo</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px] resize-y"
                  placeholder="Cole o texto ou a URL aqui..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newTitle || !newContent}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
