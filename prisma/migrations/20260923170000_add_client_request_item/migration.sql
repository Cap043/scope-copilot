-- CreateTable
CREATE TABLE "ClientRequestItem" (
    "id" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientRequestItem_clientRequestId_position_key" ON "ClientRequestItem"("clientRequestId", "position");

-- CreateIndex
CREATE INDEX "ClientRequestItem_clientRequestId_idx" ON "ClientRequestItem"("clientRequestId");

-- AddForeignKey
ALTER TABLE "ClientRequestItem" ADD CONSTRAINT "ClientRequestItem_clientRequestId_fkey" FOREIGN KEY ("clientRequestId") REFERENCES "ClientRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
