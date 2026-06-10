/*
  Warnings:

  - A unique constraint covering the columns `[medicationId,scheduledFor]` on the table `MedicationLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `reminderSentAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Medication` ADD COLUMN `times` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `MedicationLog` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('PENDING', 'TAKEN', 'MISSED', 'SKIPPED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX `MedicationLog_medicationId_scheduledFor_key` ON `MedicationLog`(`medicationId`, `scheduledFor`);
