# PROJECT STATUS

## O que foi corrigido
- Imagem alterada para `pgvector/pgvector:pg16` em `api/docker-compose.yml`.
- Guardrails médicos restritos implementados no `AIOrchestrator`.
- Rate Limiting (`redis`) implementado no `/api/auth/login`.
- Migration `hnsw_indexes` criada para performance vetorial.
- Workers BullMQ separados no `server.ts` com processo `worker` no docker-compose.
- Testes unitários para `AIOrchestrator`, `AuthUseCase` e `jwtAuth` criados. Mock do Jest de Redis corrigido.
- Adicionado rate limit (3 por dia/telefone) para `book_appointment` evitando abusos/DoS da agenda.
- Refresh Token Revocation adicionado usando Redis.
- Criptografia PII para bancos de dados (`Message`, `EpisodicMemory`, `SemanticMemory`).

## O que ainda falta
- Maior cobertura de Testes end-to-end / integração. (Atualmente ~51% no core).
- Funcionalidades comerciais: Stripe (Billing abstraction) e Onboarding de clínica self-service.
- Avaliação e Profiling do BullMQ (Múltiplas Filas vs Única Fila).
- Finalização das páginas de Front-end para refletirem todas as funcionalidades com design responsivo.

## Riscos atuais
- A cobertura de testes ainda é insuficiente para segurança total e prevenção de regressão.

## Próximas ações
- Implementar testes E2E para a camada de WhatsApp Webhook e Appointment.
- Refinar e polir frontend Dashboard, adicionando páginas ausentes se necessário.
