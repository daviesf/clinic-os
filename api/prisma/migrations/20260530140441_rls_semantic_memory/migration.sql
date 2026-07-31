ALTER TABLE "SemanticMemory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_semantic_memory ON "SemanticMemory" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));
