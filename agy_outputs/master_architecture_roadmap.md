# ClinicOS - Master Architecture Review & Final Roadmap

## 1. O produto está indo na direção correta?

Sim, de forma incisiva. A digitalização da saúde avança rapidamente, mas sistemas tradicionais (NextGen, DrChrono, Tebra) pecam por serem pesados, engessados e focados excessivamente no faturamento (billing), negligenciando a **experiência do paciente** e a **agilidade operacional da recepção**. 

* **Proposta de Valor:** Transformar o WhatsApp de uma "caixa de entrada caótica" para um "sistema de registro operável por IA". Isso ataca a principal dor das clínicas médias: perda de leads e alto custo de atendimento humano.
* **Diferenciação:** Diferente de CRMs tradicionais (Zendesk, Intercom) que adicionam IA como um "chatbot lateral", o ClinicOS coloca a IA no núcleo do roteamento (Intent-based routing) com *Human Handoff* transparente.
* **Viabilidade Técnica:** Altíssima. As fundações de LLMs (OpenAI, Anthropic) e bancos de dados vetoriais (pgvector) democratizaram a tecnologia necessária. O risco técnico real é a orquestração de memória, não o modelo em si.
* **Viabilidade Comercial:** Elevada, pois atua na linha de receita da clínica (mais agendamentos) e redução de custos (menos tempo de recepção).

---

## 2. Qual é o verdadeiro diferencial do ClinicOS?

O diferencial **NÃO é a IA em si**. Modelos de linguagem são comoditizados. Qualquer concorrente pode plugar a API do GPT-4.

O verdadeiro fosso competitivo (moat) do ClinicOS é a **Memória Contextual Longitudinal aliada à Interoperabilidade**. 
Se a IA sabe que a paciente "Maria" cancelou as últimas duas consultas por problemas com o filho, e no próximo contato a IA pergunta proativamente sobre o filho e adapta os horários sugeridos, a clínica oferece um atendimento de *concierge* de alto padrão de forma automatizada. 

O diferencial é **orquestrar o estado da clínica (agenda) com o estado do paciente (memória) de forma invisível via WhatsApp**.

---

## 3. Qual deve ser o núcleo arquitetural do produto?

O núcleo não é a IA nem a Agenda. O núcleo é o **Motor de Contexto (Context Engine) atrelado ao Inbox**.

O ClinicOS é, fundamentalmente, uma máquina de estado dirigida por eventos conversacionais. Cada mensagem altera o estado de um paciente ou de um agendamento. 
A arquitetura deve orbitar ao redor do **Inbox** como a única fonte de verdade da comunicação, com a **Memória** agindo como uma camada de enriquecimento imediato em cima do fluxo de mensagens. O CRM e a Agenda são meros "plugins de visualização" desse fluxo contínuo.

---

## 4. Como generalizar múltiplas especialidades?

**Abordagem Errada:** Criar tabelas/colunas no PostgreSQL como `toothSensitivity` (Odonto) ou `foodDislikes` (Nutrição). Isso infla o schema, gera forte acoplamento e impossibilita expansão sem deploy de código.

**Abordagem Correta (Motor Semântico Genérico):**
Em vez de colunas hardcoded, utilizamos **Arquitetura de Extração Semântica baseada em Grafo/Vetor**.
Quando um nutricionista configura o ClinicOS, ele define os "Fatos Críticos" (Ex: "Restrições Alimentares"). A IA, ao conversar, utiliza extração de entidades (Tool Calling) para gerar um fato estruturado genérico:
`{ tenantId: "123", patientId: "456", category: "CLINICAL_PREFERENCE", key: "diet", value: "vegan", timestamp: "..." }`

Essa informação é armazenada em uma tabela EAV (Entity-Attribute-Value) otimizada e vetorizada. Ao atender o paciente, o RAG busca fatos relevantes do paciente, independentemente se o fato é um "dente siso extraído" ou "alergia a camarão". A IA interpreta o dado bruto de acordo com o `System Prompt` do Tenant.

---

## 5. Arquitetura de Memória (Agent Memory)

Para não saturar o Context Window do LLM e reduzir custos de token, a memória deve ser fragmentada:

1. **Short-term memory (Working Memory):**
   * **O que é:** As últimas `N` mensagens da conversa atual + estado ativo da navegação (ex: "em processo de agendamento").
   * **Onde armazenar:** Redis (para acesso ultrarrápido) e PostgreSQL (backup).
   * **Como expirar:** Expirada/Comprimida (summarized) automaticamente após 2 horas de inatividade.

2. **Episodic memory:**
   * **O que é:** O log do que aconteceu no passado ("Paciente enviou um áudio reclamando da dor e a recepcionista humana agendou um encaixe").
   * **Onde armazenar:** `pgvector` (cada episódio é um chunk sumarizado).
   * **Quando usar:** Recuperado via RAG quando o usuário faz referência ao passado ("Quero remarcar igual àquela vez").

3. **Semantic memory:**
   * **O que é:** Conhecimento duradouro e condensado (Ex: "O paciente só tem disponibilidade nas terças pela manhã"; "O paciente é diabético").
   * **Onde armazenar:** Tabela de Fatos (`PatientFact`) com Embeddings no Postgres.
   * **Como recuperar:** Injetado no System Prompt via busca por similaridade + busca relacional na abertura da conversa.

4. **Workflow State:**
   * **O que é:** Em qual "nó" do atendimento o usuário está (Ex: AWAITING_DATE_CONFIRMATION).
   * **Onde:** Redis + PostgreSQL (`Conversation.status`). Evita que a IA alucine tentando fazer coisas fora de ordem.

---

## 6. Arquitetura de IA

A IA no ClinicOS operará em camadas de roteamento:

1. **Intent Classifier (LLM rápido - ex: Claude 3.5 Haiku / GPT-4o-mini):**
   Lê a mensagem de entrada e classifica a intenção (Agendar, Cancelar, Dúvida Clínica, etc.) e o nível de risco.
2. **Retrieval (RAG):**
   Baseado na intenção, o backend busca na memória Semântica e Episódica (`pgvector`) os fatos do paciente e regras da clínica.
3. **Response Generator & Tool Caller (LLM forte - ex: Claude 3.5 Sonnet / GPT-4o):**
   Recebe o `System Prompt` injetado com o RAG e as ferramentas disponíveis (ex: `check_availability`, `book_appointment`, `request_human_handoff`).
4. **Safety & Handoff Trigger:**
   Se a IA não souber a resposta, o Risco Clínico for alto (ex: paciente relata dor aguda) ou o paciente pedir um humano, o Tool `request_human_handoff` é acionado. A conversa passa para `status = HUMAN`, silenciando a IA e enviando um alerta real-time (WebSocket) para o frontend.

---

## 7. Infraestrutura Ideal

### Curto Prazo (MVP & Scale Inicial)
* **Compute:** API Node.js/Express rodando no Render ou AWS ECS.
* **Database:** PostgreSQL centralizado. Migrar urgentemente para instalar a extensão **`pgvector`**.
* **Tenant Isolation:** Usar `SET LOCAL` + **Row-Level Security (RLS)** no PostgreSQL para garantir vazamento zero entre clínicas, vital para LGPD/HIPAA.
* **Cache/Workers:** Redis hospedado (Upstash/ElastiCache) manipulando BullMQ para as chamadas da IA e Rate Limiting.

### Médio Prazo (Tração & Crescimento)
* **Realtime:** Serviço desacoplado (Node.js + Socket.IO ou Centrifugo) para distribuir mensagens via WebSocket ao frontend (Inbox sem polling).
* **Observabilidade:** Langfuse/Helicone (para análise e custo de prompts de IA) + OpenTelemetry e DataDog (Logs e Tracing da aplicação).

### Longo Prazo (Plataforma Enterprise)
* **Storage:** S3 (AWS) para áudios, imagens de WhatsApp, laudos, criptografados at-rest.
* **Compute Distribuído:** Kubernetes (EKS).
* **LLM Engine Privada:** Utilização de GPUs dedicadas (NVIDIA NIM) ou modelos fine-tunados caso o custo de API de LLMs (OpenAI/Anthropic) se torne restritivo ou a segurança exija processamento on-premise.

---

# ROADMAP DE IMPLEMENTAÇÃO

## Fase 1: Fundação & Estabilidade Operacional
**Objetivo:** Transformar a PoC atual num sistema utilizável para uma clínica real operar manualmente (sem IA avançada, apenas como Inbox eficiente).

* **Arquitetura/Infra:** Substituição do Polling por WebSocket. Deploy da infra base em cloud.
* **Banco de Dados:** Habilitar extensões e criar regras rígidas de Row-Level Security (RLS) no PostgreSQL para multi-tenancy.
* **APIs:** Rotas completas de Autenticação (Login, Refresh Token) e setup básico da clínica.
* **Frontend:** Finalizar UI do Inbox (real-time, loading states, feedbacks visuais de falha).
* **IA:** Manter desativada ou apenas como "sugeridor" de respostas no painel.
* **Critérios de Conclusão:** A primeira clínica consegue usar o sistema diariamente apenas com recepcionistas humanas, sem queixas de lentidão, bugs de envio, e sem ver dados de outras clínicas.

## Fase 2: Automação Base & Agendamento
**Objetivo:** Introduzir a IA para lidar com 60% da carga conversacional (agendamento, dúvidas simples).

* **Banco de Dados:** Criação do schema de Agendamento real. Habilitar `pgvector`.
* **APIs:** Endpoints de Configuração de Tenant (Prompt da Clínica, Horários de Funcionamento).
* **Frontend:** UI de Agenda/Calendário; Painel de Configuração do Prompt da Clínica.
* **IA:** 
  * Integração LLM (OpenAI/Anthropic).
  * Setup do Intent Classifier real.
  * Implementação de Tool Calling para `check_availability` e `book_appointment`.
  * Criação do fluxo de *Human Handoff*.
* **Critérios de Conclusão:** O bot agenda pacientes automaticamente durante a madrugada de forma confiável e repassa para humanos em casos complexos. Lançamento para Primeiros Clientes Pagantes.

## Fase 3: Memória Contextual & Follow-ups
**Objetivo:** O ClinicOS deixa de ser "transacional" e passa a ser "relacional" (Concierge).

* **Arquitetura:** Introdução do sistema de Background Jobs para summarização de conversas e CRONs para follow-up.
* **Banco de Dados:** Tabelas `PatientFact` (Semantic Memory) e `ConversationEpisode` (Episodic Memory).
* **IA:** Pipeline RAG funcional. Antes de responder, o bot lê o resumo do paciente. Extração contínua de preferências pós-conversa.
* **Funcionalidades:** Follow-ups automáticos (Ex: "A clínica programou a IA para perguntar se o paciente melhorou 3 dias após a consulta").
* **Critérios de Conclusão:** Produto validado no mercado, clínicas relatam que os pacientes acham que estão falando com humanos. Redução drástica da necessidade de interação da recepção.

## Fase 4: Escalabilidade & Múltiplas Especialidades
**Objetivo:** Generalizar a plataforma para dominar nichos além das clínicas básicas.

* **Infraestrutura:** Replicação de leitura no PostgreSQL. Implementação de Tracing completo (OpenTelemetry).
* **Funcionalidades:** Suporte profundo a múltiplos canais se necessário (Instagram, Site), processamento de áudio (Whisper para transcrever áudios longos de pacientes).
* **Frontend:** Dashboards analíticos poderosos (Conversões, Tempo de Resposta Humano vs IA, Gargalos).
* **Segurança:** Implementação de controles completos de LGPD (Delete rights, anonimização de PatientFacts).
* **Critérios de Conclusão:** Plataforma madura, preparada para escala massiva, rodando operações de clínicas com dezenas de profissionais simultaneamente.
