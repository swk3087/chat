SET search_path = public;

DO $$ BEGIN
  CREATE TYPE "ReactionType" AS ENUM ('HEART');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT PRIMARY KEY,
  "email"        TEXT NOT NULL UNIQUE,
  "name"         TEXT,
  "image"        TEXT,
  "username"     TEXT NOT NULL UNIQUE,
  "displayName"  TEXT,
  "bio"          TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider","providerAccountId")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id"            TEXT PRIMARY KEY,
  "sessionToken"  TEXT NOT NULL UNIQUE,
  "userId"        TEXT NOT NULL,
  "expires"       TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMPTZ NOT NULL,
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier","token")
);

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id"          TEXT PRIMARY KEY,
  "aId"         TEXT NOT NULL,
  "bId"         TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "aLastSeenAt" TIMESTAMPTZ,
  "bLastSeenAt" TIMESTAMPTZ,
  CONSTRAINT "Conversation_aId_fkey" FOREIGN KEY ("aId") REFERENCES "User"("id"),
  CONSTRAINT "Conversation_bId_fkey" FOREIGN KEY ("bId") REFERENCES "User"("id"),
  CONSTRAINT "Conversation_aId_bId_key" UNIQUE ("aId","bId")
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id"             TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "editedAt"       TIMESTAMPTZ,
  "deletedAt"      TIMESTAMPTZ,
  "isDeleted"      BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id"),
  CONSTRAINT "Message_senderId_fkey"       FOREIGN KEY ("senderId")       REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "Reaction" (
  "id"        TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      "ReactionType" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE,
  CONSTRAINT "Reaction_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE CASCADE,
  CONSTRAINT "Reaction_messageId_userId_type_key" UNIQUE ("messageId","userId","type")
);

CREATE INDEX IF NOT EXISTS "Message_conversation_created_idx" ON "Message" ("conversationId","createdAt");
