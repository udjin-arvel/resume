-- AlterTable
ALTER TABLE "fragments" ADD COLUMN     "authorNote" TEXT;

-- CreateTable
CREATE TABLE "audios" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "userId" INTEGER NOT NULL,
    "fragmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_fragmentId_fkey" FOREIGN KEY ("fragmentId") REFERENCES "fragments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
