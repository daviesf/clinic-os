ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_user ON "User" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient ON "Patient" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_conversation ON "Conversation" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_appointment ON "Appointment" FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_message ON "Message" FOR ALL USING (
  "conversationId" IN (
    SELECT id FROM "Conversation" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  )
);