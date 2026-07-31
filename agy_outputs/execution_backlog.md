# ClinicOS - Execution Backlog

Este documento contém o backlog executável completo do ClinicOS, decomposto em Epics, Features e Tasks. As tarefas estão listadas estritamente na ordem cronológica ideal de implementação, de forma que as dependências sejam respeitadas a cada passo.

---

## EPIC 1: Database Foundation & Security

### Feature: Schema Migration & pgvector Setup
**Task 1.1: Habilitar pgvector e criar Entidades Core**
*   **Objetivo**: Instalar extensão `pgvector` e estruturar o schema final (Patient, Conversation, Message, Appointment).
*   **Arquivos Afetados**: `api/prisma/schema.prisma`
*   **Dependências**: Nenhuma
*   **Critério de Conclusão**: Schema Prisma validado (`prisma generate`), migrations rodam com sucesso e suporte ao tipo `vector` ativo.
*   **Complexidade**: Média
*   **Prioridade**: Altíssima

**Task 1.2: Modelar Tabelas de Memória e Auditoria**
*   **Objetivo**: Criar `SemanticMemory`, `EpisodicMemory`, `Task` e `AuditLog` no Prisma.
*   **Arquivos Afetados**: `api/prisma/schema.prisma`
*   **Dependências**: Task 1.1
*   **Critério de Conclusão**: Tabelas criadas com índices HNSW para os vetores e chaves estrangeiras para Tenant e Patient.
*   **Complexidade**: Baixa
*   **Prioridade**: Altíssima

### Feature: Row-Level Security (RLS) Implementation
**Task 1.3: Implementar Middleware de Injeção de Contexto RLS**
*   **Objetivo**: Garantir que toda query ao Prisma execute com o `tenant_id` correto (isolamento) usando extensões ou middleware Prisma (RLS bypassing prevention).
*   **Arquivos Afetados**: `api/src/lib/prisma.ts`, `api/src/interfaces/http/middleware/tenantContext.ts`
*   **Dependências**: Task 1.2
*   **Critério de Conclusão**: É impossível ler dados de um Tenant A usando credenciais do Tenant B. Testes unitários comprovam a restrição.
*   **Complexidade**: Alta
*   **Prioridade**: Altíssima

---

## EPIC 2: Core Authentication

### Feature: Backend Auth System
**Task 2.1: Implementar Login e Refresh Token na API**
*   **Objetivo**: Substituir mock por login real usando JWT (curto prazo) e HttpOnly Cookies (Refresh Token).
*   **Arquivos Afetados**: `api/src/interfaces/http/controllers/AuthController.ts`, `api/src/application/useCases/AuthUseCase.ts`, `api/src/interfaces/http/routes/index.ts`
*   **Dependências**: Task 1.3
*   **Critério de Conclusão**: Endpoint `/api/auth/login` retorna token; `/api/auth/refresh` gera novo token. Middleware JWT validar corretamente.
*   **Complexidade**: Média
*   **Prioridade**: Alta

### Feature: Frontend Auth Flow
**Task 2.2: Criar UI de Login e Proteção de Rotas**
*   **Objetivo**: Criar página de Login e configurar Zustand e React Router para proteger a aplicação.
*   **Arquivos Afetados**: `web/src/pages/LoginPage.tsx`, `web/src/features/auth/store/useAuthStore.ts`, `web/src/App.tsx`
*   **Dependências**: Task 2.1
*   **Critério de Conclusão**: Usuário deslogado é redirecionado; credenciais corretas logam e salvam contexto no estado global.
*   **Complexidade**: Baixa
*   **Prioridade**: Alta

---

## EPIC 3: Realtime Infrastructure

### Feature: Backend WebSocket Server
**Task 3.1: Configurar Servidor Socket.IO e Autenticação JWT**
*   **Objetivo**: Subir o Socket.IO acoplado ao Express e autenticar as conexões usando o JWT.
*   **Arquivos Afetados**: `api/src/server.ts`, `api/src/infrastructure/socket/SocketServer.ts`
*   **Dependências**: Task 2.1
*   **Critério de Conclusão**: Conexões sem JWT falham. Conexões com JWT entram numa "room" `tenant:{tenantId}`.
*   **Complexidade**: Média
*   **Prioridade**: Alta

### Feature: Frontend Realtime Integration
**Task 3.2: Remover Polling do Inbox e Conectar Socket.IO**
*   **Objetivo**: Trocar a query com `refetchInterval: 15_000` por uma conexão WS que atualize o cache do React Query via eventos.
*   **Arquivos Afetados**: `web/src/features/inbox/hooks/useConversations.ts`, `web/src/lib/socketClient.ts`
*   **Dependências**: Task 3.1
*   **Critério de Conclusão**: Novas mensagens pipocam no Inbox instantaneamente sem recarregar a tela.
*   **Complexidade**: Alta
*   **Prioridade**: Alta

---

## EPIC 4: Event & Queue Architecture

### Feature: Redis & BullMQ Workers
**Task 4.1: Refatorar Filas de Inbound e Outbound**
*   **Objetivo**: Estruturar corretamente as filas `inbound_messages` e `outbound_messages` para lidar com alto throughput.
*   **Arquivos Afetados**: `api/src/application/workers/messageWorker.ts`, `api/src/infrastructure/redis/queues.ts`
*   **Dependências**: Nenhuma
*   **Critério de Conclusão**: Mensagens entram na fila Redis e o worker processa garantindo retry em caso de falha.
*   **Complexidade**: Média
*   **Prioridade**: Alta

---

## EPIC 5: Memory System (Context Engine)

### Feature: Working Memory (Redis)
**Task 5.1: Máquina de Estado e Histórico de Curto Prazo**
*   **Objetivo**: Salvar contexto imediato e estado atual (ex: `AWAITING_DATE`) no Redis sempre que uma mensagem for processada.
*   **Arquivos Afetados**: `api/src/domain/conversation/ConversationStateService.ts`
*   **Dependências**: Task 4.1
*   **Critério de Conclusão**: O estado do paciente sobrevive entre requisições de mensagens e pode ser lido em ms.
*   **Complexidade**: Média
*   **Prioridade**: Média

### Feature: Semantic Memory (pgvector)
**Task 5.2: Ferramenta (Tool) de Salvamento Semântico**
*   **Objetivo**: Criar serviço que gere embeddings (via OpenAI Text-Embedding-3) e salve fatos em `SemanticMemory`.
*   **Arquivos Afetados**: `api/src/modules/conversations/MemoryService.ts`
*   **Dependências**: Task 1.2
*   **Critério de Conclusão**: Envio de um texto (ex: "Alergia a dipirona") gera um vetor e persiste no banco corretamente.
*   **Complexidade**: Alta
*   **Prioridade**: Média

### Feature: Episodic Memory & Background Summarization
**Task 5.3: Worker de Consolidação (CRON/Background)**
*   **Objetivo**: Quando a sessão expirar (status CLOSED), buscar o histórico, pedir um resumo ao LLM e gravar vetor em `EpisodicMemory`.
*   **Arquivos Afetados**: `api/src/application/workers/memoryConsolidationWorker.ts`
*   **Dependências**: Task 5.2
*   **Critério de Conclusão**: Conversas encerradas ganham registros episódicos sem travar a API principal.
*   **Complexidade**: Alta
*   **Prioridade**: Média

---

## EPIC 6: AI Orchestration & RAG

### Feature: Intent Classification & Triage
**Task 6.1: Substituir Mock por LLM Classificador (Haiku/Mini)**
*   **Objetivo**: Alterar `classifier.ts` para enviar a mensagem recebida a um modelo rápido e devolver a intenção e risco.
*   **Arquivos Afetados**: `api/src/modules/ai/classifier.ts`
*   **Dependências**: Task 4.1
*   **Critério de Conclusão**: A API do provedor LLM processa a triagem de mensagens perfeitamente e em menos de 1 segundo.
*   **Complexidade**: Média
*   **Prioridade**: Alta

### Feature: Human Handoff Mechanism
**Task 6.2: Fluxo de Transbordo (Handoff)**
*   **Objetivo**: Se a triagem acusar risco alto ou se o usuário pedir, alterar o estado da conversa para `HUMAN` e notificar Socket.
*   **Arquivos Afetados**: `api/src/application/useCases/ProcessIncomingMessageUseCase.ts`
*   **Dependências**: Task 3.1, 6.1
*   **Critério de Conclusão**: O robô para de responder automaticamente; o UI no frontend ganha tag visual alertando a recepcionista.
*   **Complexidade**: Média
*   **Prioridade**: Alta

### Feature: RAG Pipeline & Prompt Assembly
**Task 6.3: Injeção de Contexto RAG e System Prompt**
*   **Objetivo**: Antes de chamar o LLM principal, buscar no `pgvector` por similaridade (K=3) e concatenar as memórias ao prompt do Tenant.
*   **Arquivos Afetados**: `api/src/modules/conversations/ResponseService.ts`
*   **Dependências**: Task 5.2
*   **Critério de Conclusão**: O Prompt enviado à LLM contém os fatos do banco vetorial relevantes para o paciente específico.
*   **Complexidade**: Alta
*   **Prioridade**: Alta

### Feature: Tool Calling & Actions
**Task 6.4: Integração Roteiro Agenda e Execução via LLM**
*   **Objetivo**: Expor `check_agenda` e `book_slot` ao LLM principal e gerenciar a execução da função de volta pro banco de dados.
*   **Arquivos Afetados**: `api/src/modules/ai/tools.ts`, `api/src/modules/scheduling/service.ts`
*   **Dependências**: Task 6.3
*   **Critério de Conclusão**: A IA é capaz de efetuar um agendamento válido alterando a tabela `Appointment`.
*   **Complexidade**: Alta
*   **Prioridade**: Alta

---

## EPIC 7: Frontend Operational Overhaul

### Feature: Realtime Inbox Interface
**Task 7.1: UI de Lock e Typing Indicators**
*   **Objetivo**: Adicionar no frontend os indicadores de que o paciente está digitando e de quem está atendendo a conversa.
*   **Arquivos Afetados**: `web/src/features/inbox/components/ChatWindow.tsx`
*   **Dependências**: Task 3.2
*   **Critério de Conclusão**: Experiência visual idêntica aos melhores CRMs conversacionais, sem delays visuais.
*   **Complexidade**: Baixa
*   **Prioridade**: Média

### Feature: Patient CRM & Memory Viewer
**Task 7.2: Painel de Perfil e Histórico do Paciente**
*   **Objetivo**: Criar na barra lateral direita do Inbox os fatos extraídos pela IA e histórico de consultas.
*   **Arquivos Afetados**: `web/src/features/inbox/components/PatientSidebar.tsx`
*   **Dependências**: Task 5.2
*   **Critério de Conclusão**: A recepcionista consegue visualizar (e excluir/editar) memórias semânticas coletadas do paciente.
*   **Complexidade**: Média
*   **Prioridade**: Baixa

### Feature: Agenda & Scheduling UI
**Task 7.3: View Gráfica do Calendário**
*   **Objetivo**: Renderizar uma tela com calendário semanal mostrando os `Appointments`.
*   **Arquivos Afetados**: `web/src/pages/AgendaPage.tsx`, `web/src/features/agenda/Calendar.tsx`
*   **Dependências**: Task 1.1
*   **Critério de Conclusão**: Visualização clara de blocos ocupados com detalhes do paciente e do status da consulta.
*   **Complexidade**: Alta
*   **Prioridade**: Baixa

### Feature: Tenant Configuration & Prompts
**Task 7.4: UI de Configuração da Inteligência**
*   **Objetivo**: Tela para o administrador do Tenant escrever o System Prompt customizado e definir as diretrizes semânticas da clínica.
*   **Arquivos Afetados**: `web/src/pages/SettingsPage.tsx`
*   **Dependências**: Task 2.2
*   **Critério de Conclusão**: Formulário permite salvar o Prompt no campo JSON da tabela Tenant.
*   **Complexidade**: Baixa
*   **Prioridade**: Média

---

## EPIC 8: Audit & Observability

### Feature: Audit Logs & LGPD
**Task 8.1: Implementação Global de Auditoria**
*   **Objetivo**: Disparar eventos para a tabela `AuditLog` toda vez que um atendente interagir manualmente (handoff, cancelamento).
*   **Arquivos Afetados**: `api/src/application/services/AuditService.ts`
*   **Dependências**: Task 1.2
*   **Critério de Conclusão**: Ações sensíveis são rastreáveis até o ID do usuário.
*   **Complexidade**: Baixa
*   **Prioridade**: Média

### Feature: Application Metrics & Tracing
**Task 8.2: Setup de Telemetria de LLM**
*   **Objetivo**: Inserir Langfuse ou middleware nas chamadas da OpenAI para contar os tokens de uso por Tenant.
*   **Arquivos Afetados**: `api/src/lib/llmClient.ts`
*   **Dependências**: Task 6.4
*   **Critério de Conclusão**: Métricas de latência, token count e custo são registrados.
*   **Complexidade**: Baixa
*   **Prioridade**: Baixa
