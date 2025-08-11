/*
  Warnings:

  - You are about to drop the column `projectId` on the `BarDatum` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ChartType" AS ENUM ('BAR');

-- DropForeignKey
ALTER TABLE "public"."BarDatum" DROP CONSTRAINT "BarDatum_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."BarDatum" DROP COLUMN "projectId",
ADD COLUMN     "chartId" TEXT;

-- CreateTable
CREATE TABLE "public"."Chart" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ChartType" NOT NULL DEFAULT 'BAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Chart" ADD CONSTRAINT "Chart_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BarDatum" ADD CONSTRAINT "BarDatum_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "public"."Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
