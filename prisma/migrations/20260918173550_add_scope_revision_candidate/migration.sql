-- CreateTable
CREATE TABLE "ScopeRevisionCandidate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "baseBaselineId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "sourceType" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "extractedScope" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeRevisionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScopeRevisionCandidate_projectId_idx" ON "ScopeRevisionCandidate"("projectId");

-- CreateIndex
CREATE INDEX "ScopeRevisionCandidate_baseBaselineId_idx" ON "ScopeRevisionCandidate"("baseBaselineId");

-- CreateIndex
CREATE INDEX "ScopeRevisionCandidate_status_idx" ON "ScopeRevisionCandidate"("status");

-- AddForeignKey
ALTER TABLE "ScopeRevisionCandidate" ADD CONSTRAINT "ScopeRevisionCandidate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeRevisionCandidate" ADD CONSTRAINT "ScopeRevisionCandidate_baseBaselineId_fkey" FOREIGN KEY ("baseBaselineId") REFERENCES "ScopeBaseline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
