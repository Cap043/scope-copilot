-- CreateTable
CREATE TABLE "ClientRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analyzedAgainstBaselineId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRequest_projectId_createdAt_idx" ON "ClientRequest"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientRequest_analyzedAgainstBaselineId_idx" ON "ClientRequest"("analyzedAgainstBaselineId");

-- CreateIndex
CREATE INDEX "ClientRequest_status_idx" ON "ClientRequest"("status");

-- AddForeignKey
ALTER TABLE "ClientRequest" ADD CONSTRAINT "ClientRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequest" ADD CONSTRAINT "ClientRequest_analyzedAgainstBaselineId_fkey" FOREIGN KEY ("analyzedAgainstBaselineId") REFERENCES "ScopeBaseline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
