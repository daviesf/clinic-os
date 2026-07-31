ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_log ON "AuditLog" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));
