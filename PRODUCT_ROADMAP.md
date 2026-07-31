# ClinicOS - Product Roadmap

**Data:** 29 de Julho de 2026

Este roadmap detalha a estratégia de evolução do ClinicOS para preencher todas as lacunas identificadas na Auditoria, transformando-o no Sistema Operacional Inteligente para clínicas. As tarefas são priorizadas por dependência e impacto.

---

## FASE 1: Core de Agendamentos e Tarefas (Backend)
*Justificativa: Antes de evoluir o frontend, a API precisa expor as entidades básicas de negócio de forma completa (CRUD), substituindo stubs ou endpoints restritos à IA.*

- [ ] **1.1. API de Agendamentos Completa**
  - Implementar CRUD completo no `AppointmentController.ts` (Criar, Atualizar, Cancelar) para suportar agendamentos manuais via UI.
- [ ] **1.2. Módulo de Operações (Tasks)**
  - Adicionar modelo `Task` no `schema.prisma`.
  - Criar `TaskService`, `TaskController` e rotas `/tasks` para permitir que a IA e recepcionistas criem pendências e checklists diários.

## FASE 2: Copiloto do Médico & Transcrição Inteligente (Full-stack)
*Justificativa: Este é o maior diferencial (Wow-Factor) do produto. A geração automática de prontuário e memória longitudinal.*

- [ ] **2.1. Provider de Transcrição Real (API)**
  - Substituir o mock do `AudioTranscriptionProvider.ts` por uma integração real com OpenAI Whisper.
- [ ] **2.2. UI de Consulta (Web)**
  - Criar componente visual de Sala de Consulta (`ConsultationRoom`).
  - Implementar captura de áudio do microfone e envio para a API.
  - Exibir stream de transcrição, bullet points e sugestões de tarefas/retornos gerados pela IA durante o atendimento.
- [ ] **2.3. Timeline Longitudinal do Paciente (Web)**
  - Substituir o stub de `PatientsPage.tsx`.
  - Desenvolver página detalhada com: Histórico cronológico, anexos, resumo de memórias (Semânticas/Episódicas) e edição de dados demográficos.

## FASE 3: Copiloto da Recepção e Agenda (Web)
*Justificativa: Viabiliza a adoção imediata pela equipe de recepção, garantindo fluidez no dia a dia.*

- [ ] **3.1. Gestão Manual de Agenda (Web)**
  - Adicionar Modal Interativo na `AgendaPage.tsx` para criar/editar agendamentos com busca de pacientes.
- [ ] **3.2. Centro de Tarefas Operacional (Web)**
  - Desenvolver a `TasksPage` consumindo a nova API de Tarefas.
  - Exibir check-in de pacientes, confirmações pendentes e retornos sugeridos.

## FASE 4: Comercial & Automações (Web)
*Justificativa: O backend já gera campanhas/follow-ups (Intents), mas o usuário não consegue visualizá-los ou tomar decisões sobre eles.*

- [ ] **4.1. Dashboard CRM / Follow-ups (Web)**
  - Criar `CRMPage.tsx` no formato de Kanban/Listagem.
  - Consumir rotas de `/automations` para gerenciar pacientes com abandono de carrinho, retornos ignorados e propensão de compra.

## FASE 5: Enterprise, Finanças do Consultório & QA
*Justificativa: Fechamento do produto, polimento e estabilidade.*

- [ ] **5.1. Financeiro do Dia a Dia (Dashboard Adicional)**
  - Integrar faturamento de consultas ao Dashboard principal ou expandir BillingPage para mostrar receitas e inadimplência.
- [ ] **5.2. UX/UI Polish & Testes E2E**
  - Revisar design system (responsividade, micro-animações, estados de erro).
  - Testar fluxos ponta a ponta.
