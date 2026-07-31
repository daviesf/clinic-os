import { useEffect, useState } from "react";
import { CheckCircle, Circle, AlertCircle, Clock, CheckSquare } from "lucide-react";
import { getTasks, updateTask, type TaskDTO } from "../services/taskService";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    setLoading(true);
    getTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (task: TaskDTO) => {
    const newStatus = task.status === "DONE" ? "PENDING" : "DONE";
    try {
      await updateTask(task.id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "LOW": return "text-muted-foreground bg-muted/50 border-border/50";
      default: return "text-muted-foreground bg-muted/50 border-border/50";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="border-b border-border bg-card p-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <CheckSquare className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Centro de Operações</h1>
            <p className="text-sm text-muted-foreground">Gerencie as pendências e tarefas da clínica</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando tarefas...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-4 text-muted-foreground">
              <CheckCircle className="size-12 opacity-20" />
              <p>Não há tarefas pendentes. Bom trabalho!</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  task.status === "DONE" 
                    ? "bg-muted/30 border-border/40 opacity-70" 
                    : "bg-card border-border hover:border-primary/50 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleTask(task)} className="mt-1 transition-transform active:scale-90">
                    {task.status === "DONE" ? (
                      <CheckCircle className="size-6 text-emerald-500" />
                    ) : (
                      <Circle className="size-6 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${task.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)} flex items-center gap-1.5`}>
                        {task.priority === "URGENT" && <AlertCircle className="size-3" />}
                        {task.priority}
                      </span>
                      
                      {task.dueDate && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                          <Clock className="size-3" />
                          {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}

                      {task.patient && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                          Paciente: {task.patient.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
