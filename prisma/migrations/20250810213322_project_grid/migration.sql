-- CreateTable
CREATE TABLE "public"."ProjectGrid" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectGrid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGrid_projectId_key" ON "public"."ProjectGrid"("projectId");

-- AddForeignKey
ALTER TABLE "public"."ProjectGrid" ADD CONSTRAINT "ProjectGrid_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
