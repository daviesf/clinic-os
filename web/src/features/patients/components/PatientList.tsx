import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { patientService } from "../api/patientService";
import { Users, Search, MoreVertical, ShieldAlert, Edit2 } from "lucide-react";
export function PatientList() {
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 10;
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["patients", { search, skip, take }],
    queryFn: () => patientService.getPatients({ search, skip, take }),
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pacientes</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie sua base de contatos e pacientes
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const name = prompt("Nome do paciente:");
              const phone = prompt("Telefone:");
              if (name && phone) {
                patientService.createPatient({ name, phone }).then(() => {
                  window.location.reload();
                });
              }
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Novo Paciente
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Status LGPD</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Carregando pacientes...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
                  </td>
                </tr>
              ) : (
                data?.data.map((patient) => (
                  <tr 
                    key={patient.id} 
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium">
                      {patient.name || <span className="text-muted-foreground italic">Sem nome</span>}
                    </td>
                    <td className="px-6 py-4">{patient.phone}</td>
                    <td className="px-6 py-4">
                      {patient.lgpdConsent ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-medium">
                          Consentido
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                          <ShieldAlert className="size-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(patient.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); alert("Edição será liberada na próxima versão."); }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 mr-1"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); alert("Mais opções em desenvolvimento."); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {data && data.total > take && (
            <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
              <div>
                Mostrando {skip + 1} a {Math.min(skip + take, data.total)} de {data.total}
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={skip === 0}
                  onClick={() => setSkip(s => Math.max(0, s - take))}
                  className="px-3 py-1 border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Anterior
                </button>
                <button 
                  disabled={skip + take >= data.total}
                  onClick={() => setSkip(s => s + take)}
                  className="px-3 py-1 border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
