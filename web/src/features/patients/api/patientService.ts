import { api } from "@/services/api";

export interface Patient {
  id: string;
  tenantId: string;
  phone: string;
  name: string | null;
  email: string | null;
  notes: string | null;
  lgpdConsent: boolean;
  createdAt: string;
}

export interface Patient360 extends Patient {
  conversations: any[];
  semanticMemories: any[];
  episodicMemories: any[];
  appointments: any[];
}

export interface PatientListResponse {
  data: Patient[];
  total: number;
}

export const patientService = {
  getPatients: async (params?: { search?: string; skip?: number; take?: number }): Promise<PatientListResponse> => {
    const res = await api.get("/api/patients", { params });
    return res.data;
  },

  getPatient: async (id: string): Promise<{ data: Patient }> => {
    const res = await api.get(`/api/patients/${id}`);
    return res.data;
  },

  getPatient360: async (id: string): Promise<{ data: Patient360 }> => {
    const res = await api.get(`/api/patients/${id}/360`);
    return res.data;
  },

  createPatient: async (data: Partial<Patient>): Promise<{ data: Patient }> => {
    const res = await api.post("/api/patients", data);
    return res.data;
  },

  updatePatient: async (id: string, data: Partial<Patient>): Promise<{ data: Patient }> => {
    const res = await api.put(`/api/patients/${id}`, data);
    return res.data;
  },

  anonymizePatient: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/api/patients/${id}/anonymize`);
    return res.data;
  }
};
