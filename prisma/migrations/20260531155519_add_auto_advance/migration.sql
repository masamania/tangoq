-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "autoAdvance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoAdvanceDelay" INTEGER NOT NULL DEFAULT 3;
