# SECURITY STATUS

- **Auth & JWT:** Ativo. Rate limiting configurado (3 por hora em Register, 5 por min em Login).
- **Token Revocation:** Ativo via Redis (7 days TTL matching JTI).
- **Tenant Isolation (RLS):** Ativo e funcional (Postgres RLS).
- **Rate Limiting (Global):** Aplicado no Login/Register e ferramenta AI de Agendamento.
- **LGPD/Encryption at Rest:** `Message.content`, `EpisodicMemory.summary`, e `SemanticMemory.content` estão sendo criptografados em nível de aplicação usando `AES-256-GCM` na leitura e gravação no banco de dados.
- **AI Safety:** `MEDICAL_GUARDRAIL` rígido aplicado nas instruções do sistema para prevenir aconselhamento médico não supervisionado.
- **Vulnerabilidades Pendentes:** Nenhuma falha crítica iminente na lógica. Necessário apenas certificar o hardening em produção (TLS, WAF, etc).
