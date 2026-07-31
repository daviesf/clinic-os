# ClinicOS - Final Technical Architecture Blueprint

Este documento estabelece o design arquitetural definitivo para o ClinicOS, detalhando as decisões de infraestrutura, banco de dados, motores de IA, frontend e comunicação assíncrona.

---

## 1. Arquitetura Geral

O ClinicOS opera num paradigma "Event-Driven" suportado por um núcleo monolítico modular (Node.js/Express) que interage com camadas de IA, WebSockets e Workers.

### Fluxo Completo (Inbound Message):
1. **Mensagem Recebida**: Webhook do WhatsApp (Cloud API) atinge a API.
2. **Autenticação de Webhook**: Assinatura criptográfica (SHA-256) é validada.
3. **Queueing (Inbound)**: O payload bruto é jogado numa fila Redis/BullMQ (`inbound_messages`) para responder rápido ao WhatsApp (200 OK).
4. **Worker Processing**:
   - Cria/Recupera o `Patient` e a `Conversation` (com `tenant_id` garantido via RLS).
   - Verifica `Workflow State` no Redis (ex: se o status for `HUMAN`, pula a IA).
5. **Classificação (Intent)**: LLM rápido (ex: Claude 3.5 Haiku) ou modelo treinado analisa a intenção e a urgência.
6. **Recuperação de Memória (RAG)**: Busca no `pgvector` por `SemanticMemory` (regras e perfil do paciente) e `EpisodicMemory` (contexto histórico).
7. **Prompt Assembly**: Concatena o System Prompt da clínica, as Memórias (RAG) e a `Working Memory` (histórico recente do Redis).
8. **Resposta & Tool Calling**: LLM principal (GPT-4o / Claude 3.5 Sonnet) gera a resposta ou executa chamadas de API internas (`check_agenda`, `schedule_appointment`).
9. **Despacho (Outbound)**: A resposta da IA é jogada na fila `outbound_messages`, e eventos de `message.created` vão para o Pub/Sub do Socket.IO.
10. **Frontend**: Recebe os eventos via WebSocket e renderiza no Inbox em tempo real.

---

## 2. Banco de Dados Final (Prisma / PostgreSQL)

O modelo foi projetado para escalabilidade multi-tenant e RAG embutido (`pgvector`).

### Entidades Core

*   **Tenant**
    *   *Campos*: `id`, `name`, `document_id` (CNPJ), `prompt_config` (JSON), `timezone`, `createdAt`.
    *   *Relacionamentos*: 1:N com todas as outras tabelas.
*   **User** (Recepcionistas, Médicos)
    *   *Campos*: `id`, `tenantId`, `email`, `password_hash`, `role` (ADMIN, AGENT), `isActive`.
    *   *Índices*: `[tenantId, email]` (Único).
*   **Patient** (O contato que conversa no WhatsApp)
    *   *Campos*: `id`, `tenantId`, `phone` (Único por Tenant), `name`, `lgpdConsent` (Boolean).
    *   *Índices*: `[tenantId, phone]`.
    *   *Justificativa*: Separa o canal físico (WhatsApp) da entidade paciente.

### Entidades de Comunicação

*   **Conversation**
    *   *Campos*: `id`, `tenantId`, `patientId`, `status` (AUTO, HUMAN, CLOSED), `frictionScore` (0-100).
    *   *Índices*: `[tenantId, patientId, status]`.
*   **Message**
    *   *Campos*: `id`, `conversationId`, `direction` (INBOUND, OUTBOUND), `senderType` (PATIENT, BOT, HUMAN), `content` (Text), `mediaUrl`, `status` (SENT, DELIVERED, READ), `timestamp`.
    *   *Índices*: `[conversationId, timestamp]`, `[senderType]`.

### Entidades de Memória (Context Engine)

*   **SemanticMemory** (Fatos e Regras)
    *   *Campos*: `id`, `tenantId`, `patientId` (Opcional, null = regra da clínica), `category` (ex: PREFERENCE, CLINICAL), `content` (Texto gerado pela IA), `embedding` (`Unsupported("vector(1536)")`).
    *   *Índices*: HNSW index sobre o `embedding`.
    *   *Justificativa*: Permite busca vetorial por fatos cruciais da clínica e do paciente, sem prender a schemas.
*   **EpisodicMemory** (Resumos de atendimentos passados)
    *   *Campos*: `id`, `tenantId`, `patientId`, `summary` (Texto), `embedding` (Vetor), `period` (Data do episódio).
    *   *Justificativa*: Impede que a IA leia 5.000 mensagens antigas. Lê apenas os vetores dos 3 episódios mais relevantes.

### Entidades Operacionais

*   **Appointment**
    *   *Campos*: `id`, `tenantId`, `patientId`, `date`, `duration`, `status` (SCHEDULED, CANCELED, COMPLETED).
*   **Task / Followup**
    *   *Campos*: `id`, `tenantId`, `targetPatientId`, `triggerDate`, `actionType` (ex: CHECK_RECOVERY), `status` (PENDING, EXECUTED).
*   **AuditLog**
    *   *Campos*: `id`, `tenantId`, `userId`, `action` (ex: "HANDOFF_TRIGGERED"), `metadata` (JSON), `createdAt`.

---

## 3. Arquitetura de Memória

### Working Memory (Curto Prazo)
*   **Armazenamento**: Redis (Lista circular de mensagens) + Histórico da janela da Sessão.
*   **Atualização**: A cada nova mensagem.
*   **Recuperação**: O LLM recebe as últimas `N` mensagens (ex: últimas 15) como contexto imediato.
*   **Expiração**: Inatividade de 2 horas. Após expirar, um Worker assíncrono dispara para resumir a sessão e persistir na `EpisodicMemory`.

### Episodic Memory (Longo Prazo/Eventos)
*   **Armazenamento**: PostgreSQL (`EpisodicMemory`) + `pgvector`.
*   **Atualização**: Consolidada via CRON/Background Job quando uma `Conversation` é fechada.
*   **Recuperação**: RAG. Se o paciente disser "Dói igual ao mês passado", o sistema busca o vetor mais próximo disso.

### Semantic Memory (Fatos Estruturados)
*   **Armazenamento**: PostgreSQL (`SemanticMemory`) + `pgvector`.
*   **Atualização**: Durante a conversa, se a IA detecta uma preferência imutável (ex: "Sou alérgico a dipirona"), ela executa um `Tool Call` (`save_semantic_fact`) que grava a informação.
*   **Recuperação**: Busca de similaridade k-NN e injetada no System Prompt.

### Workflow State (Máquina de Estado)
*   **Armazenamento**: Redis (`tenant:123:patient:456:state`) + PostgreSQL (`Conversation.status`).
*   **Valores**: AWAITING_DATE, CONFIRMING_CANCEL, CHITCHAT, HUMAN_HANDOFF.
*   **Uso**: Limita as *Tools* que o LLM tem acesso. (Se está em `AWAITING_DATE`, força a IA a esperar uma data antes de falar de outras coisas).

---

## 4. Arquitetura de IA

### Modelos (Orquestração Híbrida)
*   **Intent & Triage**: `Claude 3.5 Haiku` (Baixa latência, baixo custo). Resolve rápido: "Isso é uma dúvida, um agendamento ou xingamento?".
*   **RAG & Reasoning**: `OpenAI Text-Embedding-3-Small` (para gerar vetores do `pgvector`).
*   **Action & Response**: `Claude 3.5 Sonnet` ou `GPT-4o` (Alto QI). Capacidade superior de usar as ferramentas da clínica.

### Tool Calling (Funções Expostas ao LLM)
*   `search_agenda(date, specialty)`: Retorna horários livres.
*   `book_slot(date, time)`: Efetua o bloqueio.
*   `save_semantic_fact(fact, category)`: Salva uma informação na memória semântica do paciente.
*   `request_human_handoff(reason)`: Aciona os atendentes.

### Human Handoff Trigger
Ocorre se:
1. *Explicit Request*: Paciente diz "Quero falar com humano".
2. *Safety/Risk*: Detector (Haiku) acusa urgência médica ("Estou sangrando").
3. *Loop*: O LLM tenta agendar 3 vezes falhas e o *frictionScore* passa de 80.
Nesse momento, a IA apenas despacha uma mensagem "Transferindo para a nossa equipe...", o status vai para `HUMAN` (cortando o webhook da IA), e um WebSocket alerta a recepção.

---

## 5. Especialidades (Solução Genérica Sem Schemas Específicos)

A clínica parametrizará o seu núcleo via **Tenant Prompt Configs** e **SemanticMemory global do Tenant**.

**Exemplo Prático (Como evitar tabelas específicas):**
A tabela de Banco de Dados **NÃO TEM** `foodDislikes` nem `toothSensitivity`.
Em vez disso:
1. O administrador da clínica Odontológica preenche a interface do ClinicOS: "Nossos pacientes costumam ter relatórios de Dentes Extraídos".
2. Isso gera um registro de regra no System Prompt do tenant: *"Você é um assistente odontológico. Identifique se o paciente informa dentes sensíveis ou cirurgias e use o tool save_semantic_fact"*.
3. O LLM extrai e salva no Postgres: `{ entity: "patient:456", text: "Paciente extraiu o Siso direito inferior", vector: [...] }`.
4. Sem hardcode. Se amanhã entrar um Fisioterapeuta, o System Prompt dirá: *"Identifique lesões musculares"*, gerando vetores diferentes na mesma estrutura genérica de tabela.

---

## 6. Event Architecture (Filas e Workers)

Utilização de BullMQ em cima do Redis.

### Filas (Queues)
*   `inbound_webhooks`: Processamento de alta prioridade das mensagens do WhatsApp.
*   `outbound_messages`: Chamada para a API oficial do Meta (controle de rate limit).
*   `memory_consolidation`: Background Jobs. Prioridade baixa.
*   `webhook_dispatch`: Se o ClinicOS precisar avisar o sistema legado (ex: RD Station) da clínica.

### Eventos Principais (Pub/Sub Interno)
*   `message.received` -> Inicia fluxo de IA.
*   `message.sent` -> Confirmação de envio (atualiza tick no BD e Frontend).
*   `conversation.handoff` -> Altera SLA e alerta o frontend via Socket.
*   `session.expired` -> Dispara worker da fila de `memory_consolidation` para criar um episódio (`EpisodicMemory`).

---

## 7. Realtime (Socket.IO)

*   **Autenticação**: Ao conectar, o Socket.IO lê o JWT.
*   **Rooms (Salas)**:
    *   Cada recepcionista entra na sala `tenant:{tenant_id}` (Escuta global).
    *   Quando foca num chat, entra na sala `conversation:{conversation_id}`.
*   **Presence & Typing**:
    *   Ao focar, a recepcionista emite `typing`. O socket repassa para a API do WhatsApp (exibindo "Digitando..." no celular do paciente).
    *   Locking de Conversa: Mostra visualmente que "Recepcionista João está atendendo Maria", impedindo dupla intervenção.

---

## 8. Frontend Final (React + Vite + Zustand + React Query)

### Páginas Principais
1.  `/inbox`: Workspace principal. Lista de contatos, Chat Window, Sidebar de Perfil e Agendamentos rápidos.
2.  `/agenda`: Visualização de blocos de horários.
3.  `/patients`: CRM da clínica (Histórico de episódios e memórias formatadas).
4.  `/settings/ai`: Tuning de Prompts, regras de negócio da IA.

### Gerenciamento de Estado (Stores)
*   `useAuthStore`: JWT, perfil do agente, Tenant Context.
*   `useSocketStore`: Conexão, status de rede (Online/Offline/Reconnecting).
*   `useInboxStore`: Conversa atualmente selecionada, controle do form de input, UI do Human Handoff.

### Fluxo de Dados (Queries & Sockets)
As listas iniciais carregam via REST (React Query `getConversations`). Atualizações delta (novas mensagens, mudança de status) chegam via Socket.IO, invalidando o cache do React Query ou aplicando atualização otimista (Optimistic Update) no cache.

---

## 9. Segurança

*   **JWT & Refresh**: Tokens de 15 minutos (Acesso) em Memória; Refresh Tokens (HttpOnly Cookie, 7 dias).
*   **Row-Level Security (RLS)**: Obrigatório no PostgreSQL. Exemplo: `CREATE POLICY tenant_isolation ON "Message" USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`. Se o backend esquecer o `WHERE`, o banco trava o vazamento.
*   **Auditoria**: Qualquer exclusão, exportação de dados de pacientes, ou ativação de handoff gera um log imutável na tabela `AuditLog`.
*   **LGPD**:
    *   Soft-delete obrigatório para pacientes (`deletedAt`).
    *   Endpoint dedicado para gerar arquivo JSON completo dos `PatientFacts` e `Messages` (Portabilidade).
    *   Anonimização de vetores RAG quando os dados forem expurgados.

---

## 10. Escalabilidade & Gargalos

**10 Clínicas (Fase MVP)**
*   *Setup*: Um cluster Node.js simples no Render, 1 banco PostgreSQL, 1 Redis gerenciado.
*   *Gargalo*: Limites da API da OpenAI/Anthropic (Rate Limits de Tokens/min).
*   *Solução*: Filas no BullMQ com Fallback (retry com delay).

**100 Clínicas (Fase Growth)**
*   *Gargalo*: Consultas vetoriais concorrentes travando o PostgreSQL transacional.
*   *Solução*: Separação lógica: Criar uma *Read Replica* para as buscas RAG (HNSW), enquanto a tabela principal foca em escritas de alta velocidade de mensagens (Transactional). Scaling horizontal das APIs de Worker.

**1000 Clínicas (Fase Enterprise)**
*   *Gargalo*: Volume gigantesco da tabela `Message` impedindo consultas rápidas, Socket.IO engasgando com broadcast de centenas de conexões simultâneas.
*   *Solução*:
    *   Particionamento do PostgreSQL na tabela `Message` (por `tenant_id` e Data/Mês).
    *   Substituição do Socket.IO por Centrifugo (servidor Realtime de alta performance em Go) ou Redis Pub/Sub backplane se mantiver Socket.IO.
    *   Archiving: Mover `Messages` antigas (mais de 1 ano sem handoff) para Cold Storage (S3 / DynamoDB), mantendo apenas as memórias condensadas (`EpisodicMemory`) em cache de vetores quentes (como Pinecone ou Qdrant dedicado).
