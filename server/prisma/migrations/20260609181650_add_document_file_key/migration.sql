/*
  Warnings:

  - Added the required column `fileKey` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Document` ADD COLUMN `fileKey` VARCHAR(191) NOT NULL;
