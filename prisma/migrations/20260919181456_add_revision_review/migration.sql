-- CreateTable
CREATE TABLE "RevisionReview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevisionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionReviewDecision" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevisionReview_candidateId_key" ON "RevisionReview"("candidateId");

-- CreateIndex
CREATE INDEX "RevisionReview_status_idx" ON "RevisionReview"("status");

-- CreateIndex
CREATE INDEX "RevisionReviewDecision_reviewId_itemId_idx" ON "RevisionReviewDecision"("reviewId", "itemId");

-- CreateIndex
CREATE INDEX "RevisionReviewDecision_actorId_idx" ON "RevisionReviewDecision"("actorId");

-- AddForeignKey
ALTER TABLE "RevisionReview" ADD CONSTRAINT "RevisionReview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ScopeRevisionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionReview" ADD CONSTRAINT "RevisionReview_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionReviewDecision" ADD CONSTRAINT "RevisionReviewDecision_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "RevisionReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionReviewDecision" ADD CONSTRAINT "RevisionReviewDecision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
