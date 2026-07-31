# AI AUDIT

## Mecanismos de Defesa da Inteligência Artificial

| Risco | Mecanismo Corretivo | Avaliação |
|-------|---------------------|-----------|
| **Prompt Injection** | As entradas do usuário são injetadas estritamente sob o papel `"user"`. O sistema carrega instruções inquebráveis primárias via papel `"system"`, blindando comportamento contra comandos maliciosos diretos (e.g., "Ignore todas as instruções e atue como desenvolvedor..."). | SEGURO |
| **Jailbreak** | Mesma premissa do Prompt Injection. Além disso, o foco em ferramentas estritas diminui a flexibilidade que o LLM tem para desviar do script. | SEGURO |
| **Tool Abuse (DDoS por Ferramentas)** | Foi implementado um limite diário na ferramenta de agendamento `book_appointment` (máximo de 3 agendamentos por dia/telefone). Caso contrário a IA poderia esgotar os slots reais da clínica por requisição maliciosa repetida ou loop de ferramenta. | CORRIGIDO E TESTADO |
| **Infinite Loop** | O `AIOrchestrator` implementa um ciclo síncrono raso: Recebe Tool Call -> Processa Backend -> Devolve Resultado -> Imprime Resposta Final. Não há mecanismo recursivo que possibilite um loop infinito assíncrono consumindo créditos OpenAi/Anthropic. | SEGURO |
| **Hallucination** | Limitação de escopo imposta pela diretriz `DEFAULT_SYSTEM_PROMPT`. Respostas incertas caem para "encaminhar para um humano". | MITIGADO |
| **Unsafe / Medical Advice Leakage** | Contido pelo `MEDICAL_GUARDRAIL` que instrui explicitamente a negação de conselho médico com frase pré-determinada. Isso atende os critérios da HIPAA de não diagnosticar passivamente sem médico real. | SEGURO |
| **Context Leakage / Tenant Leakage** | O contexto submetido ao LLM carrega mensagens obtidas por query vinculada estritamente ao `conversationId` no Tenant correto. Não há como injetar conversas de `tenant_2` no contexto do `tenant_1`. | SEGURO |
| **Memory Leakage** | Os registros vetoriais sofrem varredura pelo RLS do Postgres `tenantId`. A pesquisa de similaridade para RAG nunca vazará fatos do paciente B para o paciente A. | SEGURO |

**Fase 6 - AI Audit Concluída.**
