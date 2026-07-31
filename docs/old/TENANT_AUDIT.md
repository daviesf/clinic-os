# TENANT AUDIT

## Objetivo
Auditoria de contenção e isolamento multilocatário (Multi-Tenant) no ClinicOS. Foi assumida a tentativa de roubo ou vazamento de dados entre "Clínica A" e "Clínica B".

## Vetores e Testes

1. **Acessar Dados Cruzados**
   - **Mecanismo**: Todos os controllers extraem `tenantId` da requisição autenticada, não do payload do corpo da requisição.
   - **Tentativa de quebra**: Enviar `tenantId` de outra clínica no corpo da requisição em chamadas a API (como em POST `/appointments`).
   - **Resultado**: Rejeitado/Ignorado. O `req.auth.tenantId` vindo do token é absoluto. Se Clínica A envia uma request com body alterado buscando conversas do tenant B, o `Prisma` usa o `where: { tenantId: req.auth.tenantId }` que forçará a query para a Clínica A resultando em nulo ou "Forbidden" (403) na camada de serviço.

2. **Burlar `tenantId` via Headers**
   - Tentativa de injetar um Header `X-Tenant-Id`.
   - **Resultado**: Falho. O backend não lê headers arbitrários para locação, confia exclusivamente na extração decodificada segura do `jwtAuth.ts` via Bearer Token.

3. **Quebrar RLS**
   - Row-Level Security no Postgres está ativado nas memórias vetoriais. 
   - A configuração local injeta o ID antes de varrer, operando nas políticas `SET LOCAL app.current_tenant = ...` nos métodos cruciais, e o ORM aplica filters `where { tenantId }` mandatórios nas demais estruturas relacionais. 

4. **Falsificar JWT**
   - O JWT é assinado usando `jsonwebtoken` com a chave local no arquivo de ambiente `.env` (`JWT_SECRET`). 
   - Assinaturas de terceiros falham imediatamente na verificação. O UUID dinâmico de `jti` garante a revogabilidade forte caso seja necessário matar a sessão da clínica inteira.

## Verdict FASE 5:
O isolamento em duas camadas (Token Decoding + Query Isolation no Prisma, com RLS nas views Vetoriais) é considerado **robusto** para o estágio de lançamento. Sem evidência de leakage possível a nível da aplicação construída.

**Fase 5 - Multi-Tenant Audit Concluída.**
