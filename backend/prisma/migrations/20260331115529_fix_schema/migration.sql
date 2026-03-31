/*
  Warnings:

  - You are about to drop the column `appSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankNiftyInstrumentToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `redirectUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StrategyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "qty" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrategyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketDataConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'GLOBAL',
    "brokerName" TEXT NOT NULL DEFAULT 'Kite',
    "appKey" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "clientCode" TEXT,
    "redirectUrl" TEXT,
    "requestToken" TEXT,
    "accessToken" TEXT,
    "accessTokenUpdatedAt" DATETIME,
    "bankNiftyInstrumentToken" INTEGER NOT NULL DEFAULT 260105,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brokerName" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "clientCode" TEXT,
    "requestToken" TEXT,
    "accessToken" TEXT,
    "accessTokenUpdatedAt" DATETIME,
    "isPaperTrading" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("accessToken", "accessTokenUpdatedAt", "clientCode", "createdAt", "id", "passwordHash", "requestToken", "role", "username") SELECT "accessToken", "accessTokenUpdatedAt", "clientCode", "createdAt", "id", "passwordHash", "requestToken", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
