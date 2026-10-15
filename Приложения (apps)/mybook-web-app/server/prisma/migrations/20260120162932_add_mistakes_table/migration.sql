-- CreateTable
CREATE TABLE "mistakes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "currentText" TEXT NOT NULL,
    "correctText" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mistakes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
