-- CreateEnum: MessageStatus
CREATE TYPE "public"."MessageStatus" AS ENUM ('sent', 'delivered', 'read');

-- CreateEnum: NotificationType
CREATE TYPE "public"."NotificationType" AS ENUM ('follow', 'like', 'comment', 'mention');

-- AlterTable: Message.status TEXT → MessageStatus enum
-- Step 1: Drop default so we can alter type
ALTER TABLE "public"."Message" ALTER COLUMN "status" DROP DEFAULT;
-- Step 2: Cast existing values to enum using USING clause
ALTER TABLE "public"."Message"
  ALTER COLUMN "status" TYPE "public"."MessageStatus"
    USING "status"::"public"."MessageStatus";
-- Step 3: Restore default
ALTER TABLE "public"."Message" ALTER COLUMN "status" SET DEFAULT 'sent'::"public"."MessageStatus";

-- AlterTable: Notification.type TEXT → NotificationType enum
ALTER TABLE "public"."Notification"
  ALTER COLUMN "type" TYPE "public"."NotificationType"
    USING "type"::"public"."NotificationType";
