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
    "isPaperTrading" BOOLEAN NOT NULL DEFAULT true,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activeStrategyId" TEXT,
    "engineState" TEXT
);
INSERT INTO "new_User" ("accessToken", "accessTokenUpdatedAt", "apiKey", "apiSecret", "brokerName", "clientCode", "createdAt", "id", "isPaperTrading", "passwordHash", "requestToken", "role", "username") SELECT "accessToken", "accessTokenUpdatedAt", "apiKey", "apiSecret", "brokerName", "clientCode", "createdAt", "id", "isPaperTrading", "passwordHash", "requestToken", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
