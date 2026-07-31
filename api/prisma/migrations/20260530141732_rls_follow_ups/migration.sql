ALTER TABLE "FollowUp" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_follow_ups ON "FollowUp" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));
