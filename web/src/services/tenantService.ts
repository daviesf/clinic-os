import { api } from "./api";

export interface TenantSettings {
  id: string;
  name: string;
  specialty: string | null;
  promptConfig?: string;
  businessHours?: any;
  clinicAddress?: string;
  clinicTimezone?: string;
  aiModel?: string;
  aiTemperature?: number;
  autoHandoff?: boolean;
  whatsappToken?: string;
  webhookVerifyToken?: string;
  phoneNumberId: string | null;
}

export async function getTenantSettings(): Promise<TenantSettings> {
  const response = await api.get<{ data: TenantSettings }>("/api/tenant/settings");
  return response.data.data;
}

export async function updateTenantSettings(data: Partial<TenantSettings>): Promise<TenantSettings> {
  const response = await api.patch<{ data: TenantSettings }>("/api/tenant/settings", data);
  return response.data.data;
}
