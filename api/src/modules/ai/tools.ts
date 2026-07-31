import type { ToolDefinition } from "../../interfaces/llm/ILLMProvider";

export const aiTools: ToolDefinition[] = [
  {
    name: "check_availability",
    description: "Verifica se existe horário disponível para agendamento na data e hora solicitada. Use quando o paciente perguntar sobre disponibilidade ou quiser agendar.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Data e hora desejada no formato ISO 8601 (ex: 2026-06-01T14:00:00)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "book_appointment",
    description: "Agenda uma consulta para o paciente. Use somente após confirmar disponibilidade e receber confirmação do paciente.",
    parameters: {
      type: "object",
      properties: {
        patientName: {
          type: "string",
          description: "Nome completo do paciente",
        },
        date: {
          type: "string",
          description: "Data e hora da consulta no formato ISO 8601 (ex: 2026-06-01T14:00:00)",
        },
      },
      required: ["patientName", "date"],
    },
  },
  {
    name: "save_patient_fact",
    description: "Salva um fato ou preferência permanente sobre o paciente (ex: não gosta de médicos homens, alérgico a dipirona, tem filhos, etc).",
    parameters: {
      type: "object",
      properties: {
        fact: {
          type: "string",
          description: "O fato a ser salvo na memória permanente.",
        },
      },
      required: ["fact"],
    },
  },
];
