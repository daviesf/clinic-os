# Relatório de Auditoria Técnica - ClinicOS

**Data:** 10/02/2026
**Versão Auditada:** 1.0.0 (Initial Setup)
**Maturidade Geral:** 2/10 (Protótipo Inicial)

## 1. Arquitetura Geral
**Status:** ⚠️ Incompleta

- **Isolamento:** Os módulos (`whatsapp`, `conversations`, `scheduling`) estão em pastas separadas, o que é bom.
- **Integração:** **Crítico.** Os módulos existem mas **não estão conectados**. O arquivo `server.ts` apenas inicia o Express, mas não instancia o `WhatsAppManager` nem o `SchedulingService`. O sistema, como está, não faz nada ao iniciar.
- **Rotas:** Nenhuma rota API foi definida. Não há como criar tenants, consultar agendamentos ou iniciar sessões externamente.

## 2. Multi-Tenancy
**Status:** ⚠️ Funcional (Lógica) / 🔴 Risco (Arquitetura)

- **Dados:** O Schema do Prisma utiliza corretamente `tenantId` em todas as tabelas relevantes (`User`, `Tenant`, `Appointment`, `Conversation`).
- **Isolamento de Sessão:** O `WhatsAppManager` usa `clientId` para separar sessões do navegador. Isso funciona para isolamento de dados.
- **Escalabilidade (Grave):** O uso de `whatsapp-web.js` (baseado em Puppeteer/Chromium) é **inviável** para um sistema multi-tenant na mesma máquina.
    - *Estimativa:* Cada tenant consome ~300MB-500MB de RAM.
    - *Limite:* Um servidor com 8GB de RAM suportaria no máximo ~15 clínicas simultâneas antes de travar.

## 3. WhatsApp Manager
**Status:** ⚠️ Básico

- **Reconexão:** O código trata o evento `disconnected` apenas removendo o cliente do Map. Não há lógica de "auto-reconnect" robusta. Se o WhatsApp cair, a clínica fica offline até reinicialização manual.
- **QR Code:** O código usa `qrcode-terminal`. Isso imprime o QR no console do servidor. Em produção, isso é inútil, pois o usuário final não tem acesso ao terminal do servidor. O QR code precisa ser exposto via API/WebSocket para o frontend.
- **Start-up:** Não há rotina para restaurar sessões salvas na pasta `sessions/` ao reiniciar o servidor. O sistema começa "zerado" a cada deploy, exigindo re-scan ou lógica de restauração explícita (que falta no `createClient` ao iniciar).

## 4. Engine Conversacional
**Status:** ✅ Lógica Correta / ⚠️ Simplificado

- **Regra AUTO/HUMAN:** Implementada corretamente. O bot verifica o status e executa `return` se for HUMAN.
- **Friction Score:** Campo existe no banco, mas é **ignorado** pelo código. Não há lógica para incrementar esse score ou transbordar para humano automaticamente.
- **Intent Mock:** A detecção de intenção é via `status === "schedule"`. Funcional para teste, mas frágil para produção.

## 5. Scheduling
**Status:** ⚠️ Risco Operacional

- **Duplicação de Jobs:** O `node-cron` roda na instância da aplicação. Se você escalar o backend para 2 containers (para aguentar a carga do Puppeteer, por exemplo), o cron rodará em *ambos*, enviando mensagens duplicadas para os pacientes.
- **Timezone:** O código usa `new Date()` (hora do sistema). Se o servidor estiver em UTC e a clínica no Brasil, os lembretes de "manhã às 08:00" serão enviados no horário errado (ex: 05:00 da manhã ou 11:00 da manhã).
- **Conflito:** A verificação `count > 0` é funcional para MVP.

## 6. Segurança
**Status:** 🔴 Crítico

- **Senhas:** O modelo `User` existe, mas não há código de cadastro (Sign Up) implementado, logo não há hashing de senha ativo.
- **Logs:** `console.log` está imprimindo o objeto `qr` e mensagens.
- **API:** Como não há rotas, não há autenticação (JWT) protegendo endpoints. Qualquer um com acesso à rede poderia (futuramente) controlar qualquer tenant se não for implementado corretamente.

## 7. Recomendações Prioritárias (Roadmap para Produção)

1.  **Arquitetura WhatsApp (Urgente):**
    -   Substituir `whatsapp-web.js` por uma API externa (ex: Evolution API, Baileys em worker threads isolados) OU limitar drasticamente o número de tenants por servidor.
    -   Expor QR Code via API (JSON/Base64) e não no terminal.

2.  **Core do Server:**
    -   Implementar `http/api/routes.ts`.
    -   Instanciar `WhatsAppManager` no startup do `server.ts`.
    -   Restaurar sessões existentes ao bootar.

3.  **Segurança:**
    -   Implementar Middleware de Auth (JWT).
    -   Criar rotas de Login/Register com `bcrypt`.

4.  **Resiliência:**
    -   Mover o CRON para um serviço separado ou usar uma flag de "Leader Election" (ex: Redis lock) para evitar duplicação em cluster.
    -   Configurar Timezone explicitamente (ex: `moment-timezone` ou configuração do env).

## 8. Conclusão

O projeto atual é um **esqueleto funcional** de lógica de negócios, mas **não é um sistema rodável**. Ele contém as peças (modelos, serviços), mas falta a "cola" (API, Inicialização) e a infraestrutura necessária para suportar múltiplos clientes WhatsApp sem colapso de memória.

**Nota:** 2/10
