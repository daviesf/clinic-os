# ARCHITECTURE MAP

## Visão Geral do Sistema

O ClinicOS é uma plataforma Multi-Tenant SaaS dividida em duas áreas principais: `api/` (Backend Node.js/Express) e `web/` (Frontend React/Vite).

## Diretório Raiz

- `api/`: Diretório do backend.
- `web/`: Diretório do frontend web.
- `docs/`: Documentações de acompanhamento e auditoria.

## Backend (`api/`)

O backend utiliza Clean Architecture misturada com MVC, utilizando Prisma, PostgreSQL com extensão pgvector e filas via BullMQ.

### Principais Módulos de Código (`api/src/`)

#### 1. Core / Bootstrap
- `server.ts`: Ponto de entrada. Gerencia injeção de dependências e levanta o servidor HTTP e Socket.io ou inicializa workers em modo isolado (`WORKER_ONLY`).
- `app.ts`: Setup do Express e middlewares.

#### 2. Roteamento (`interfaces/http/routes/`)
- `analyticsRoutes.ts`
- `appointmentRoutes.ts`
- `authRoutes.ts`
- `conversationRoutes.ts`
- `messageRoutes.ts`
- `patientRoutes.ts`
- `tenantRoutes.ts`
- `webhook.ts`: Arquivos e2e acompanham as respectivas rotas (`*.e2e.spec.ts`).

#### 3. Controladores (`interfaces/http/controllers/`)
- `AnalyticsController.ts`
- `AppointmentController.ts`
- `AuthController.ts`
- `ConversationController.ts`
- `MessageController.ts`
- `PatientController.ts`
- `TenantController.ts`
- `WebhookController.ts` (em `modules/webhook/`)

#### 4. Casos de Uso e Serviços (`application/`)
- **Serviços**: `AuditService.ts`, `PatientService.ts`
- **Use Cases**: `AuthUseCase.ts`, `GetConversationsUseCase.ts`, `GetMessagesUseCase.ts`, `ProcessIncomingMessageUseCase.ts`, `SendMessageUseCase.ts`
- **Workers (BullMQ)**: `messageWorker.ts`, `consolidationWorker.ts`, `followUpWorker.ts`
- **Queues**: `messageQueue.ts`

#### 5. Infraestrutura (`infrastructure/`)
- **Billing**: `StripeBillingProvider.ts`
- **LLM**: `OpenAIProvider.ts`, `AudioTranscriptionProvider.ts`
- **Persistence**: `PrismaRepositories.ts` (Implementações criptografadas)
- **Redis**: `client.ts`, `RedisRateLimiter.ts`, `RedisLock.ts`
- **Socket**: `SocketServer.ts`, `emitter.ts`

#### 6. Módulos Específicos
- **AI**: `AIOrchestrator.ts`, `promptService.ts`, `tools.ts`
- **Conversations**: Controla intenções, templates de resposta (`IntentService`, `MessageService`, etc).
- **Memory**: `SemanticMemoryService.ts` (pgvector integrando).
- **Scheduling**: Serviços p/ Agenda.
- **WhatsApp**: `CloudAPIProvider.ts`, `MockWhatsAppProvider.ts`

#### 7. Camadas de Segurança e Libs (`lib/` e `interfaces/http/middleware/`)
- `jwtAuth.ts`, `rateLimiterMiddleware.ts`, `webhookSignatureValidator.ts`
- `encryption.ts` (Cifra LGPD PII)

### Schema Prisma (`api/prisma/`)
- Contém dezenas de migrations. RLS implementado na base vetorial (`semantic_memory`), memórias (`episodic_memory`), tabelas relacionais de conversas, e trilha de auditoria (`audit_log`).

## Frontend (`web/`)

Frontend SPA utilizando Vite, React, React Query, Zustand e Tailwind.

### Principais Módulos de Código (`web/src/`)

#### 1. Bootstrap
- `main.tsx`: Ponto de entrada do React.
- `App.tsx`: Roteamento Principal (React Router Dom).
- `index.css` & `App.css`: Base e configurações do Tailwind.

#### 2. Roteamento e Páginas (`pages/`)
- `LoginPage.tsx` & `RegisterPage.tsx` (Autenticação/Onboarding).
- `DashboardPage.tsx` (Analytics com React Query e Recharts).
- `InboxPage.tsx` (Atendimento multicanal).
- `AgendaPage.tsx` (Agendamentos do Tenant).
- `SettingsPage.tsx` (Configurações da clínica).

#### 3. Serviços e APIs (`services/`)
- `api.ts` (Client Axios instanciado).
- `appointmentService.ts`, `conversationService.ts`, `tenantService.ts`

#### 4. Gerenciamento de Estado (`store/` e `hooks/`)
- `useAuthStore.ts` (Zustand com Persist).
- `useSocket.ts` / `useSocketSync.ts` (Integração WebSocket real-time).

#### 5. Funcionalidades (Features / Componentes)
- `features/inbox/`: Contém a lógica isolada da central de atendimento (e.g. `ChatWindow.tsx`, `ConversationList.tsx`, hooks dedicados).
- `components/ui/`: Componentes visuais básicos (`button.tsx`, `input.tsx`).

---
**Fase 1 - Inventário Total Concluído.**
