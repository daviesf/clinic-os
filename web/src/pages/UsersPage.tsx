import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, Plus, ArrowLeft, Trash2, Mail, Shield } from "lucide-react";
import { api } from "../services/api";

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/api/users");
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/users", {
        email: newEmail,
        password: newPassword
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Erro ao criar usuário");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Erro ao excluir usuário");
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="size-6 text-primary" /> Equipe e Acessos
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="size-4" /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium text-muted-foreground">E-mail / Usuário</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Data de Criação</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Shield className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="size-3" /> Acesso Ativo
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(user.id)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Remover Acesso"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-xl font-bold mb-6">Convidar para Equipe</h2>
            
            {error && (
              <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="email@clinica.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Senha Temporária</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="******"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  O usuário usará esta senha no primeiro login.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newEmail || !newPassword}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Salvando..." : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
