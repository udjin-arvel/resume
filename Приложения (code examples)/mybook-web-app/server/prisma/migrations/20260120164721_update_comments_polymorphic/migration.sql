/*
  Warnings:

  - You are about to drop the column `storyId` on the `comments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('STORY', 'NOTION', 'LORE', 'COMPOSITION');

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_storyId_fkey";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "storyId",
ADD COLUMN     "contentId" INTEGER,
ADD COLUMN     "contentType" "ContentType";
