-- AlterEnum
ALTER TYPE "ConversationStatus" ADD VALUE 'CLOSED';

-- CreateTable
CREATE TABLE "EpisodicMemory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodicMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EpisodicMemory_conversationId_key" ON "EpisodicMemory"("conversationId");

-- CreateIndex
CREATE INDEX "EpisodicMemory_tenantId_patientId_idx" ON "EpisodicMemory"("tenantId", "patientId");

-- AddForeignKey
ALTER TABLE "EpisodicMemory" ADD CONSTRAINT "EpisodicMemory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodicMemory" ADD CONSTRAINT "EpisodicMemory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodicMemory" ADD CONSTRAINT "EpisodicMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
