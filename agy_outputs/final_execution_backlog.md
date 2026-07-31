# ClinicOS - Final Execution Backlog

Este documento contém o backlog definitivo de execução para o ClinicOS. A estrutura foi readequada para maximizar o retorno comercial imediato (MVP Operacional e Comercial) postergando abstrações avançadas (como Memória Vetorial) para fases de maturidade.

As tarefas devem ser executadas estritamente na ordem apresentada.

---

## Fase 1 — MVP Operacional
**Objetivo**: Estabelecer a fundação do produto. O sistema deve ter banco isolado, login seguro, e permitir que uma recepcionista visualize e responda conversas em tempo real via WhatsApp, sem inteligência artificial (apenas como um hub de comunicação).

### TASK-001
*   **Nome**: Modelagem Base do Banco de Dados
*   **Objetivo**: Criar o schema relacional simples no Prisma sem extensões complexas, focando no essencial.
*   **Arquivos principais**: `api/prisma/schema.prisma`
*   **Dependências**: Nenhuma
*   **Complexidade**: Média
*   **Critério de conclusão**: Tabelas criadas: `Tenant`, `User`, `Patient`, `Conversation`, `Message`, `Appointment`. Migrations aplicadas com sucesso.

### TASK-002
*   **Nome**: Implementação do Isolamento Multi-Tenant (RLS)
*   **Objetivo**: Garantir que as queries do backend sejam blindadas pelo PostgreSQL Row-Level Security, filtrando dados pelo `tenant_id`.
*   **Arquivos principais**: `api/src/lib/prisma.ts`, `api/prisma/migrations/`
*   **Dependências**: TASK-001
*   **Complexidade**: Alta
*   **Critério de conclusão**: Nenhuma query executada sem contexto de Tenant pode ler dados de outras clínicas. Testes unitários confirmam a falha de queries cross-tenant.

### TASK-003
*   **Nome**: Autenticação Backend (JWT + Refresh)
*   **Objetivo**: Implementar a API de login com JWT (Acesso) e HttpOnly Cookie (Refresh Token) para os `Users`.
*   **Arquivos principais**: `api/src/interfaces/http/controllers/AuthController.ts`, `api/src/interfaces/http/routes/authRoutes.ts`
*   **Dependências**: TASK-001
*   **Complexidade**: Média
*   **Critério de conclusão**: Endpoint de login retorna tokens válidos. Middleware valida JWT de todas as rotas protegidas da API.

### TASK-004
*   **Nome**: Autenticação Frontend
*   **Objetivo**: Criar a UI de Login e configurar a proteção de rotas no frontend usando Zustand.
*   **Arquivos principais**: `web/src/pages/LoginPage.tsx`, `web/src/store/useAuthStore.ts`, `web/src/App.tsx`
*   **Dependências**: TASK-003
*   **Complexidade**: Baixa
*   **Critério de conclusão**: Login com credenciais válidas salva o JWT no estado; refresh token opera silenciosamente; logout expulsa o usuário para a tela de login.

### TASK-005
*   **Nome**: Infraestrutura Realtime (Socket.IO)
*   **Objetivo**: Acoplar Socket.IO ao Node.js com autenticação, criar hook no Frontend e remover o polling (15s) do React Query.
*   **Arquivos principais**: `api/src/server.ts`, `api/src/infrastructure/socket/SocketServer.ts`, `web/src/hooks/useSocket.ts`
*   **Dependências**: TASK-003
*   **Complexidade**: Média
*   **Critério de conclusão**: Frontend conecta via WS com sucesso após o login, registrando-se na sala correta (`tenant:{id}`).

### TASK-006
*   **Nome**: Inbox Realtime UI
*   **Objetivo**: Atualizar o Inbox visualmente sempre que um evento `message.created` chegar pelo WebSocket.
*   **Arquivos principais**: `web/src/features/inbox/components/ChatWindow.tsx`, `web/src/features/inbox/components/ConversationList.tsx`
*   **Dependências**: TASK-005
*   **Complexidade**: Baixa
*   **Critério de conclusão**: Mensagens enviadas ou recebidas aparecem instantaneamente na UI sem necessidade de reload da página.

---

## Fase 2 — MVP Comercial
**Objetivo**: Entregar a proposta de valor principal. Habilitar o WhatsApp real, o motor básico de IA genérico (sem memória complexa) e o fluxo humano-IA (*Human Handoff*). A clínica pode testar o agendamento automatizado em beta.

### TASK-007
*   **Nome**: Pipeline WhatsApp (Inbound & Outbound)
*   **Objetivo**: Receber webhooks do WhatsApp Cloud API via filas no BullMQ, persistir a `Message` e confirmar resposta rápida ao Meta.
*   **Arquivos principais**: `api/src/modules/webhook/WebhookController.ts`, `api/src/application/workers/messageWorker.ts`
*   **Dependências**: TASK-001
*   **Complexidade**: Média
*   **Critério de conclusão**: Paciente envia mensagem no WhatsApp, ela entra no banco e aparece no Inbox. Mensagem enviada pelo Inbox chega no WhatsApp do paciente.

### TASK-008
*   **Nome**: Abstração Pluggable de IA
*   **Objetivo**: Criar a interface abstrata `ILLMProvider` e construir uma implementação concreta (ex: `OpenAIProvider`).
*   **Arquivos principais**: `api/src/interfaces/llm/ILLMProvider.ts`, `api/src/infrastructure/llm/OpenAIProvider.ts`
*   **Dependências**: Nenhuma
*   **Complexidade**: Baixa
*   **Critério de conclusão**: O sistema não referencia SDK da OpenAI em lógicas de domínio. Os métodos `classify` e `generate` estão devidamente abstraídos.

### TASK-009
*   **Nome**: Interface de Configuração da Clínica
*   **Objetivo**: CRUD para o admin da clínica editar o `prompt_config`, horários e nome na tabela Tenant.
*   **Arquivos principais**: `web/src/pages/SettingsPage.tsx`, `api/src/interfaces/http/controllers/TenantController.ts`
*   **Dependências**: TASK-004
*   **Complexidade**: Baixa
*   **Critério de conclusão**: O frontend permite edição do "Prompt Base" que guiará a IA, persistindo corretamente na tabela do Tenant logado.

### TASK-010
*   **Nome**: Triagem e Resposta Automática
*   **Objetivo**: Implementar o loop básico da IA. Recebe a mensagem, classifica intenção, e gera a resposta (juntando o Prompt do Tenant + últimas 10 mensagens).
*   **Arquivos principais**: `api/src/application/useCases/ProcessIncomingMessageUseCase.ts`
*   **Dependências**: TASK-007, TASK-008, TASK-009
*   **Complexidade**: Alta
*   **Critério de conclusão**: A IA responde automaticamente ao paciente baseado puramente no contexto recente e no Prompt configurado, sem uso de vetores.

### TASK-011
*   **Nome**: Human Handoff (Transbordo)
*   **Objetivo**: Se a IA não conseguir lidar, se o usuário pedir, ou a recepcionista clicar em "Assumir", alterar `Conversation.status` para `HUMAN`. Pausar a IA.
*   **Arquivos principais**: `api/src/modules/conversations/ConversationService.ts`, `web/src/features/inbox/components/ChatHeader.tsx`
*   **Dependências**: TASK-010
*   **Complexidade**: Média
*   **Critério de conclusão**: Um clique no Inbox altera o chat para modo "Humano", fazendo com que as próximas mensagens do WhatsApp ignorem o processamento da IA e apenas alertem a recepcionista.

### TASK-012
*   **Nome**: Tool Calling de Agendamento Simples
*   **Objetivo**: Habilitar funções abstratas `check_availability` e `book_appointment` para o `ILLMProvider`.
*   **Arquivos principais**: `api/src/modules/ai/tools.ts`, `api/src/modules/scheduling/SchedulingService.ts`
*   **Dependências**: TASK-010
*   **Complexidade**: Alta
*   **Critério de conclusão**: A IA consegue responder se tem vaga e inserir uma linha válida na tabela `Appointment` conversando com o paciente.

### TASK-013
*   **Nome**: UI Básica da Agenda
*   **Objetivo**: Interface simples (lista ou grid diário) para a recepcionista visualizar os `Appointments` gerados pela IA ou criar manuais.
*   **Arquivos principais**: `web/src/pages/AgendaPage.tsx`, `web/src/features/agenda/AgendaList.tsx`
*   **Dependências**: TASK-012
*   **Complexidade**: Média
*   **Critério de conclusão**: Agendamentos marcados pela IA aparecem instantaneamente na tela da Agenda para controle da clínica.

---

## Fase 3 — IA Contextual
**Objetivo**: Transição de um Chatbot para um Agente Cognitivo Avançado. Adição de persistência semântica e do banco de vetores para reter memória infinita do paciente sem limites de token.

### TASK-014
*   **Nome**: Instalação e Migration pgvector
*   **Objetivo**: Modificar schema do Prisma para criar `SemanticMemory` e configurar o DB com suporte vetorial.
*   **Arquivos principais**: `api/prisma/schema.prisma`
*   **Dependências**: TASK-001 (PostgreSQL instalado)
*   **Complexidade**: Baixa
*   **Critério de conclusão**: Campos com tipo customizado `vector` gerados e migrations rodam com sucesso.

### TASK-015
*   **Nome**: Semantic Memory Storage (Extração de Fatos)
*   **Objetivo**: Adicionar função ao `ILLMProvider` (Tool Calling) para `save_patient_fact`, permitindo que a IA registre dados perenes do paciente.
*   **Arquivos principais**: `api/src/modules/memory/SemanticMemoryService.ts`
*   **Dependências**: TASK-014
*   **Complexidade**: Média
*   **Critério de conclusão**: Fatos importantes ditos no chat são vetorizados (API embed) e salvos.

### TASK-016
*   **Nome**: Retrieval-Augmented Generation (RAG)
*   **Objetivo**: Injetar o RAG na orquestração de resposta. Buscar no `pgvector` memórias semânticas relevantes para o paciente antes de gerar a reposta final.
*   **Arquivos principais**: `api/src/application/useCases/ProcessIncomingMessageUseCase.ts`
*   **Dependências**: TASK-015
*   **Complexidade**: Alta
*   **Critério de conclusão**: A IA lembra de preferências do paciente ("Como sei que o senhor não toma dipirona, recomendo...") baseada na busca vetorial.

### TASK-017
*   **Nome**: Consolidação em Background (Episodic Memory)
*   **Objetivo**: Worker que sumariza sessões inteiras após inatividade (status = CLOSED) gerando um único registro vetorizado em `EpisodicMemory`.
*   **Arquivos principais**: `api/src/application/workers/consolidationWorker.ts`
*   **Dependências**: TASK-016
*   **Complexidade**: Média
*   **Critério de conclusão**: Conversas antigas somem da lista imediata de contexto do LLM e viram resumos consolidados acessíveis via RAG.

---

## Fase 4 — Escala Inicial
**Objetivo**: Garantir segurança, LGPD, observabilidade e robustez. Preparar a fundação para faturamento contínuo de centenas de clínicas, sem interrupção de serviço.

### TASK-018
*   **Nome**: Trilhas de Auditoria (AuditLog)
*   **Objetivo**: Criar sistema interceptor que loga ações manuais sensíveis (edição de agendamentos, handoff) em uma tabela rastreável e imutável.
*   **Arquivos principais**: `api/src/application/services/AuditService.ts`
*   **Dependências**: TASK-011, TASK-013
*   **Complexidade**: Baixa
*   **Critério de conclusão**: Cada ação humana sensível registra UUID do usuário e timestamp na tabela `AuditLog`.

### TASK-019
*   **Nome**: Proteção e Expurgos (LGPD Compliance)
*   **Objetivo**: Criar endpoint de deleção total de paciente (hard-delete / anonymization) de mensagens e vetores.
*   **Arquivos principais**: `api/src/interfaces/http/controllers/PatientController.ts`
*   **Dependências**: TASK-015
*   **Complexidade**: Média
*   **Critério de conclusão**: Deletar um paciente elimina com segurança embeddings, mensagens e dados identificáveis em cascatas ou limpezas assíncronas.

### TASK-020
*   **Nome**: Resiliência de IA (Retry & Fallbacks)
*   **Objetivo**: Configurar retry policies no BullMQ e lidar elegantemente com erros 429 (Too Many Requests) das APIs de LLM.
*   **Arquivos principais**: `api/src/infrastructure/redis/queues.ts`
*   **Dependências**: TASK-007, TASK-008
*   **Complexidade**: Média
*   **Critério de conclusão**: Queda temporária na API do provedor LLM causa reprocessamento da mensagem sem perda ou crashes no backend.

---

## Fase 5 — Plataforma Madura
**Objetivo**: Introdução de mecânicas de Growth e valor extremo ao LTV. Analytics profundos e expansões multi-mídia.

### TASK-021
*   **Nome**: Dashboards de Atendimento
*   **Objetivo**: Desenvolver visões analíticas no frontend mostrando o % de conversas resolvidas via IA vs % que exigiu Human Handoff.
*   **Arquivos principais**: `web/src/pages/DashboardPage.tsx`, `api/src/interfaces/http/controllers/AnalyticsController.ts`
*   **Dependências**: TASK-011
*   **Complexidade**: Média
*   **Critério de conclusão**: Gráficos no frontend carregam métricas agregadas da clínica de forma otimizada.

### TASK-022
*   **Nome**: Follow-ups Automáticos (Tarefas)
*   **Objetivo**: Permitir o agendamento de crons para disparar mensagens do WhatsApp (ex: pesquisar eficácia do tratamento após 3 dias).
*   **Arquivos principais**: `api/src/application/workers/followUpWorker.ts`
*   **Dependências**: TASK-007
*   **Complexidade**: Alta
*   **Critério de conclusão**: Sistema desperta rotina cron diariamente e a IA puxa conversa ativamente sem que o paciente envie a primeira mensagem.

### TASK-023
*   **Nome**: Processamento de Áudio (Transcrição)
*   **Objetivo**: Integrar Whisper (via provedor de IA plugável) para baixar áudios do WhatsApp e gerar transcrições convertidas como mensagens normais.
*   **Arquivos principais**: `api/src/infrastructure/llm/AudioTranscriptionProvider.ts`
*   **Dependências**: TASK-007
*   **Complexidade**: Alta
*   **Critério de conclusão**: Paciente manda um áudio de 2 minutos, ele é baixado e a IA responde baseada na transcrição textual instantaneamente.
