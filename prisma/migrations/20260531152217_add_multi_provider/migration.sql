-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "encryptedGoogleKey" TEXT,
ADD COLUMN     "encryptedOpenAiKey" TEXT,
ADD COLUMN     "preferredProvider" TEXT NOT NULL DEFAULT 'anthropic';
