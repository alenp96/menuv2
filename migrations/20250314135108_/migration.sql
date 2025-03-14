-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "currencyPosition" TEXT NOT NULL DEFAULT 'prefix',
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT '$';
