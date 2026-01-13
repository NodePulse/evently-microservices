/*
  Warnings:

  - You are about to drop the column `message` on the `NotificationLog` table. All the data in the column will be lost.
  - You are about to drop the column `sendTo` on the `NotificationLog` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `NotificationLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationLog" DROP COLUMN "message",
DROP COLUMN "sendTo",
DROP COLUMN "subject";
