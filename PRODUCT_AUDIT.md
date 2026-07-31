# ClinicOS - Auditoria de Produto

**Data:** 29 de Julho de 2026
**Objetivo:** Inventário Absoluto e Auditoria Funcional do ClinicOS para evolução ao status de "Sistema Operacional para Clínicas".

---

## 1. Inventário Absoluto (Arquitetura e Componentes)

O ClinicOS está estruturado como um monorepo contendo dois serviços principais:
- **`api`** (Backend Node.js): Utiliza Express, Prisma (PostgreSQL + pgvector), Socket.io, BullMQ, Redis e integrações com Stripe e AI (OpenAI). Possui arquitetura modular com injeção de dependência e workers em background.
- **`web`** (Frontend React): Utiliza Vite, React 19, Tailwind CSS, Zustand, React Query e Socket.io-client.

### Módulos Existentes no Backend (`api`)
- `ai`: Orquestrador de IA, Memória Semântica e Episódica (pgvector).
- `auth`: Autenticação JWT, Registro e Login.
- `conversations`: Engine de mensagens, controle de intenções, filas (BullMQ) e WebSocket.
- `memory`: Gestão de contexto e resumos consolidados.
- `scheduling`: Agendamentos via ferramentas da IA e listagem de consultas.
- `tenants`: Gestão de clínicas (multi-tenancy) e configurações.
- `webhook`: Recepção de mensagens via Evolution API.
- `whatsapp`: Integração via Evolution API e provedores simulados.

### Páginas Existentes no Frontend (`web`)
- `LoginPage`, `RegisterPage`
- `DashboardPage` (Visão geral de pacientes/conversão)
- `InboxPage` (Chat em tempo real com `PatientSidebar` para visão 360)
- `AgendaPage` (Visualização de calendário via FullCalendar)
- `BillingPage` (Integração com portal Stripe)
- `AutomationsPage`, `SettingsPage`, `UsersPage`, `KnowledgeBasePage`
- `PatientsPage` (Stub/incompleta)

---

## 2. Auditoria Funcional Detalhada

Para cada domínio da visão de produto, validamos o estado atual:

### 2.1. Multi-Tenancy & Autenticação
- **Funciona?** Sim.
- **Está integrado?** Sim. Frontend consome APIs reais.
- **Status:** **Concluído (Base)**. O isolamento de dados via `tenantId` está correto e seguro. RBAC (Roles) existe no payload JWT, mas requer expansão de granularidade na interface.

### 2.2. Copiloto do Médico & Transcrição Inteligente
- **Funciona?** Parcialmente.
- **Está integrado?** A orquestração de IA e as memórias funcionam bem no backend (`SemanticMemoryService`, `AIOrchestrator`). O `PatientSidebar` (Patient 360) já exibe memórias e histórico na Inbox.
- **Lacunas Críticas:**
  - A API de transcrição (`AudioTranscriptionProvider.ts`) é apenas um MOCK estático. Não existe integração real (ex: Whisper).
  - O fluxo assistido da consulta (UI de gravação, resumo de tópicos em tempo real, geração de tarefas) está completamente ausente no Frontend.

### 2.3. Agendamento & Copiloto da Agenda
- **Funciona?** Parcialmente.
- **Está integrado?** A IA consegue agendar usando as tools do backend. A visualização em calendário existe no frontend (`AgendaPage`).
- **Lacunas Críticas:**
  - O Frontend possui apenas a visualização. O botão de "Novo Agendamento" é um stub sem ação.
  - A API de Agendamentos (além do `list` para leitura) não possui rotas CRUD completas para a recepção usar o sistema manualmente. Não há UI para configurar slots ou bloquear horários.

### 2.4. Comercial & Automações (Follow-ups)
- **Funciona?** Backend funcional, Frontend ausente/limitado.
- **Está integrado?** No backend, existe o `followUpWorker.ts` que busca intents pendentes, envia prompts ao LLM e engatilha mensagens de saída. A API possui rotas `/automations`.
- **Lacunas Críticas:**
  - Faltam dashboards e pipelines comerciais no frontend (CRM). O usuário não consegue visualizar o status dos follow-ups e campanhas geradas pela IA.

### 2.5. Operacional & Recepção (Centro de Tarefas)
- **Funciona?** Não.
- **Está integrado?** Não há modelos Prisma, rotas API ou workers para gerir tickets, prioridades, fila de espera da clínica ou check-list da recepção.
- **Lacunas Críticas:**
  - Centro de Tarefas (Task Center) completamente inexistente.
  - A recepção não tem visão das pendências de retornos e cancelamentos além do Inbox genérico.

### 2.6. Copiloto Financeiro
- **Funciona?** Sim (Base).
- **Está integrado?** A página de Billing (`BillingPage.tsx`) comunica com o backend (`BillingController.ts`) via Stripe para exibir e gerenciar assinaturas.
- **Lacunas Críticas:**
  - Falta integração para exibir previsão de receita, análise de inadimplência e faturamento de consultas no dia a dia da clínica (o foco atual é apenas a assinatura SaaS da própria clínica).

### 2.7. Pacientes (Timeline Longitudinal)
- **Funciona?** Parcialmente.
- **Está integrado?** A `PatientsPage` é um arquivo de 215 bytes, servindo apenas de esqueleto.
- **Lacunas Críticas:**
  - É urgente desenvolver a página completa do Paciente, exibindo a linha do tempo cronológica com consultas, anexos, mensagens transcritas, financeiro do paciente e consolidação das memórias pela IA.

---

## 3. Conclusão da Auditoria

O ClinicOS atual é um MVP conversacional robusto (IA Orquestradora, Filas, WebSocket, Memória Vetorial), porém o **Core Operacional da Clínica** (Consultório Médico em tempo real, Tarefas e Gestão Prática da Agenda e Pacientes) está restrito a mocks, stubs ou não foi implementado visualmente.

**Próximo Passo:** Elaborar o `PRODUCT_ROADMAP.md` e iniciar a correção e implementação dos fluxos faltantes priorizando o E2E.
