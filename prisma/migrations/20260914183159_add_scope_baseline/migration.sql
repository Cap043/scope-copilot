-- AlterTable
ALTER TABLE "organization" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ScopeBaseline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "structuredScope" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScopeBaseline_projectId_idx" ON "ScopeBaseline"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ScopeBaseline_projectId_version_key" ON "ScopeBaseline"("projectId", "version");

-- AddForeignKey
ALTER TABLE "ScopeBaseline" ADD CONSTRAINT "ScopeBaseline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
