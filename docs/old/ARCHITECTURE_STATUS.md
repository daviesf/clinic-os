# ARCHITECTURE STATUS

## Backend Stack
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL (com pgvector)
- Redis + BullMQ (separado em processo worker na configuração Docker)
- Clean Architecture (Camadas: Domain, Application/UseCases, Infrastructure, Interfaces/Controllers)

## Frontend Stack
- React + Vite
- TypeScript
- React Query para server state
- Zustand para local state
- Tailwind CSS / Radix / Shadcn

## Observabilidade e Infraestrutura
- O processo do server.ts carrega dependendo de `WORKER_ONLY=true`. Se for true, não levanta o servidor HTTP e apenas consome as filas do BullMQ, garantindo estabilidade e escalabilidade do Event Loop.
- Logs sendo realizados localmente, mas a integração de APM/Tracing ainda não está ativa.

## Integrações
- AI Provider abstraction implementada. Padrão atual usa OpenAI.
- WhatsApp Provider abstraction implementada. Suporta mock local e Cloud API oficial.

## Design
- Sistema focado em Multi-Tenant via RLS nativo do PostgreSQL. Middleware de autenticação injeta `tenantId` no escopo da requisição ou Socket.IO.
