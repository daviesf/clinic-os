import { api } from "./api";

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  patientId?: string;
  patient?: { id: string; name: string; phone: string };
  createdAt: string;
}

export async function getTasks(status?: string): Promise<TaskDTO[]> {
  const url = status ? `/api/tasks?status=${status}` : "/api/tasks";
  const response = await api.get<{ data: TaskDTO[] }>(url);
  return response.data.data;
}

export async function createTask(data: Partial<TaskDTO>): Promise<TaskDTO> {
  const response = await api.post<{ data: TaskDTO }>("/api/tasks", data);
  return response.data.data;
}

export async function updateTask(id: string, data: Partial<TaskDTO>): Promise<TaskDTO> {
  const response = await api.put<{ data: TaskDTO }>(`/api/tasks/${id}`, data);
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}
