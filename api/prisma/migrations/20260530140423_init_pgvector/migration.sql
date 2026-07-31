-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "promptConfig" TEXT,
ADD COLUMN     "specialty" TEXT;

-- CreateTable
CREATE TABLE "SemanticMemory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemanticMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SemanticMemory_tenantId_patientId_idx" ON "SemanticMemory"("tenantId", "patientId");

-- AddForeignKey
ALTER TABLE "SemanticMemory" ADD CONSTRAINT "SemanticMemory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticMemory" ADD CONSTRAINT "SemanticMemory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
