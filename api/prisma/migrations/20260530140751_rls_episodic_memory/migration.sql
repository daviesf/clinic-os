ALTER TABLE "EpisodicMemory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_episodic_memory ON "EpisodicMemory" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));
