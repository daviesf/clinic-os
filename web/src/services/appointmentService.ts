import { api } from "./api";

export interface AppointmentDTO {
  id: string;
  patientName: string;
  phone: string;
  date: string;
  status: string;
}

export async function getAppointments(): Promise<AppointmentDTO[]> {
  const response = await api.get<{ data: AppointmentDTO[] }>("/api/appointments");
  return response.data.data;
}

export async function createAppointment(data: Omit<AppointmentDTO, "id">): Promise<AppointmentDTO> {
  const response = await api.post<{ data: AppointmentDTO }>("/api/appointments", data);
  return response.data.data;
}
