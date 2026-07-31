# TODO

## Must Fix / Implement (High Priority)
- [ ] Criar testes E2E para webhook de WhatsApp (`ProcessIncomingMessageUseCase`, `AIOrchestrator` real-world flow).
- [ ] Criar testes E2E para marcação de consultas e fluxo de agendamento (Appointments).
- [ ] Integração com Stripe para billing automático em nível de Tenant.
- [ ] Painel Onboarding Self-Service (página do Frontend para criar clínica e pagar pelo SaaS).

## Nice to Have (Medium Priority)
- [ ] Padronizar chamadas na web (migrar views do Dashboard que usam Axios+useEffect para React Query puro).
- [ ] Adicionar suporte a múltiplos providers de IA concretos (atualmente a abstração existe mas só OpenAIProvider está implementado de fato).
- [ ] Adicionar suporte a papéis e permissões (RBAC) mais finos para recepcionistas vs. médicos vs. administradores da clínica.

## Debt / Chores (Low Priority)
- [ ] Melhorar a cobertura de testes para ficar acima de 80% (Core já em ~51%).
- [ ] Adicionar E2E Tests no Frontend (Cypress ou Playwright).
