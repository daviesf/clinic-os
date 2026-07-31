# ClinicOS - Diagnóstico Completo do Estado Atual

## A. Resumo Executivo
O ClinicOS encontra-se em estágio de MVP/Prova de Conceito (PoC). A arquitetura base do backend foi bem desenhada, utilizando princípios de Clean Architecture e DDD, com boa separação de responsabilidades e injeção de dependências. O banco de dados já suporta multi-tenancy básico e as integrações primárias (WhatsApp, Redis, BullMQ) estão estruturadas. No entanto, o sistema carece de implementações críticas: o motor de Inteligência Artificial está mockado, o frontend utiliza polling em vez de realtime (WebSockets/SSE), não há sistema de memória vetorial para o contexto da IA e módulos inteiros do produto (agenda avançada, auth UI, transcrição) ainda não existem. O projeto tem uma fundação sólida para escalar, mas exige desenvolvimento substancial nas camadas de IA e Realtime para atingir os objetivos do produto.

---

## B. Score Geral
* **Arquitetura**: 8/10
* **Backend**: 6/10
* **Frontend**: 4/10
* **Segurança**: 7/10
* **IA**: 2/10
* **Infra**: 6/10
* **Produto**: 3/10

---

## C. O Que Está Pronto
* **Estrutura Arquitetural Backend**: Separação clara de camadas (Domain, Application, Infrastructure, Interfaces) e configuração do servidor com `express`.
* **Banco de Dados Base (Prisma)**: Models essenciais (Tenant, User, Conversation, Message, Appointment, Log) com índices e isolamento inicial (multi-tenancy via `tenantId`).
* **Segurança Básica**: Middleware de autenticação JWT, Rate Limiting com Redis e validação de assinatura de Webhook do WhatsApp.
* **Mensageria Assíncrona**: Configuração de filas com BullMQ e workers para processamento de mensagens inbound/outbound.
* **Infraestrutura Local**: `docker-compose.yml` para banco de dados e Redis, `Dockerfile` para a API.

---

## D. O Que Está Parcialmente Pronto
* **Integração WhatsApp**: Estruturada com interface provider, porém o provedor Cloud API e o gerenciamento de templates necessitam de evolução para produção.
* **Frontend (Inbox)**: Setup com React, Vite, Tailwind e Zustand feito. A página de Inbox existe, mas utiliza polling (React Query a cada 15s) em vez de uma conexão persistente em realtime.
* **Sistema de Prompts**: Arquivos de prompt (`classify.txt`, `respond.txt`, etc.) foram criados, mas a execução real contra um LLM não está implementada.
* **Agenda**: O model do banco e o `SchedulingService` existem, mas a interface com a IA e os fluxos de agendamento não estão conectados de forma inteligente.
* **Observabilidade**: Logging com `pino` implementado, mas falta telemetria, tracing e métricas mais avançadas.

---

## E. O Que Está Faltando
* **Integração com LLM (OpenAI/Anthropic)**: O sistema atual de IA apenas retorna intenções mockadas/default.
* **Sistema de Memória Vetorial**: Inexistência de Vector DB (ex: pgvector, Pinecone), embeddings, e memória de curto/longo prazo para dar contexto às respostas da IA.
* **Realtime Server**: Ausência de Socket.IO, WebSocket ou SSE no backend e frontend para atualização de tela em tempo real.
* **Módulos de Produto (Frontend)**: Faltam páginas de Login, Gestão de Pacientes/Contatos, Configurações de Tenant, e visualização de Agenda.
* **Transcrição de Consultas & Memória Longitudinal**: Recursos ainda não iniciados no core ou na base de dados.
* **Fluxos de Erro e Retentativa Inteligente**: Para quedas da API do WhatsApp ou do LLM.

---

## F. Riscos Arquiteturais
* **Gargalo de Polling no Frontend**: O uso de polling de 15 segundos para buscar conversas vai causar sobrecarga no banco de dados e na rede à medida que o número de tenants e usuários ativos crescer.
* **Isolamento de Tenant**: Atualmente depende apenas do repasse correto do `tenantId` nas consultas do Prisma. A falta de RLS (Row Level Security) no PostgreSQL ou validação estrita nos Repositories pode gerar vazamento de dados se um programador esquecer o filtro.
* **Ausência de Vector DB no Core**: Projetar um sistema genérico de IA com memória contextual exigirá uma arquitetura vetorial que não foi planejada no schema atual. Adaptar isso tardiamente pode gerar refatorações profundas.

---

## G. Dívida Técnica
* **Realtime**: A substituição do polling (`useConversations`) por WebSockets precisa ser feita antes de qualquer escala de usuários.
* **Mock de IA**: O `classifier.ts` e o `IntentResolver` que estão retornando valores estáticos precisarão ser totalmente reescritos para integrar chamadas assíncronas a APIs de LLM.
* **Falta de Testes**: Não há evidência forte de uma suite de testes unitários/e2e nas pastas críticas de domínio e aplicação.

---

## H. Próximas 20 Implementações Prioritárias
1. **Implementar WebSockets (Backend e Frontend)** para eliminar o polling do Inbox.
2. **Integrar Provedor de LLM (ex: OpenAI)** para substituir os mocks no `classifier.ts` e `aiRouter`.
3. **Configurar Vector DB (pgvector ou similar)** na infraestrutura.
4. **Criar Modelagem de Banco para Memória Vetorial** (Embeddings) no Prisma.
5. **Implementar Fluxo Completo de Autenticação** (Login/Register/Recovery) na API e Web.
6. **Implementar Sistema de Context Retrieval (RAG)** para buscar histórico de mensagens antes de gerar a resposta.
7. **Aplicar Row Level Security (RLS)** ou middleware robusto no Prisma para garantir tenant isolation absoluto.
8. **Criar UI da Agenda / Calendário** no frontend.
9. **Finalizar Fluxos Reais do WhatsApp Cloud API** e setup de webhooks de status de entrega (SENT, DELIVERED, READ).
10. **Implementar Handlers Reais de Intenção (IntentHandlers)** para agendamento, dúvidas, e chitchat.
11. **Criar UI de Configuração do Tenant** (horários de atendimento, nome da clínica, prompt base).
12. **Módulo de Human Handoff (Transbordo)** no frontend (botão de assumir conversa e pausar IA).
13. **Suite de Testes Unitários** para os Use Cases e Services do Backend.
14. **Implementar Logs de Auditoria** (quem alterou o status da conversa, quem enviou a mensagem).
15. **Sistema de Tratamento e Retentativa (Retry Policies)** para as requisições de LLM via filas.
16. **Criação de Webhooks para Integrações Externas** (notificar CRMs de terceiros quando um agendamento ocorrer).
17. **Melhorias de UI/UX no ChatWindow** (exibição de status da mensagem, loading indicators reais).
18. **Implementar Upload/Download de Mídia no WhatsApp** (imagens, áudios).
19. **Estruturar Funcionalidade de Follow-up Ativo** (agendamento de mensagens para o futuro).
20. **Configurar Tracing/Métricas (OpenTelemetry)** para monitorar latência do LLM e API.

---

## I. Percentual de Conclusão (Estimativa)
* **Backend**: 35%
* **Frontend**: 15%
* **IA**: 5%
* **Produto**: 15%
* **Projeto Total**: ~17.5%

---

## J. Roadmap Recomendado

**Fase Atual (Fundação IA & Realtime)**
* Substituição do Polling por WebSockets/Socket.io.
* Integração base com LLM (OpenAI) para testes reais de classificação e resposta.
* Finalização do pipeline de autenticação JWT e UI de login.

**Próxima Fase (Memória & Especialidades)**
* Implantação de banco vetorial e estratégia de RAG (Retrieval-Augmented Generation).
* Criação da memória de curto e longo prazo (sumarização periódica de conversas).
* Aprimoramento da engine de agendamento conectada à memória (verificar disponibilidade e regras da clínica dinamicamente).
* Módulo de configuração de Tenant (para não ter hardcode de especialidades).

**Fase Seguinte (Operação & Escalabilidade)**
* UI completa de Calendário/Agenda.
* Dashboard analítico (conversas resolvidas por IA vs Humanos).
* Handlers especializados por intenção, permitindo que a clínica parametrize respostas específicas.
* Funcionalidades completas de mídia (áudio e imagem).

**Até Produção**
* Testes de carga na infraestrutura (Workers, Redis e DB).
* Monitoramento avançado (DataDog/Prometheus + Grafana).
* Conformidade LGPD (anonimização e exclusão de dados do paciente).
* Implementação final do fluxo de transcrição de consultas com memória longitudinal.
