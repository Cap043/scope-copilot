-- CreateTable
CREATE TABLE "RequestAnalysisRun" (
    "id" TEXT NOT NULL,
    "clientRequestItemId" TEXT NOT NULL,
    "scopeBaselineId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "analysisVersion" TEXT NOT NULL,
    "resultSnapshot" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestAnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestAnalysisRun_clientRequestItemId_createdAt_idx" ON "RequestAnalysisRun"("clientRequestItemId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestAnalysisRun_scopeBaselineId_idx" ON "RequestAnalysisRun"("scopeBaselineId");

-- CreateIndex
CREATE INDEX "RequestAnalysisRun_status_idx" ON "RequestAnalysisRun"("status");

-- AddForeignKey
ALTER TABLE "RequestAnalysisRun" ADD CONSTRAINT "RequestAnalysisRun_clientRequestItemId_fkey" FOREIGN KEY ("clientRequestItemId") REFERENCES "ClientRequestItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAnalysisRun" ADD CONSTRAINT "RequestAnalysisRun_scopeBaselineId_fkey" FOREIGN KEY ("scopeBaselineId") REFERENCES "ScopeBaseline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
