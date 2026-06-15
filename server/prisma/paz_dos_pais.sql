-- ============================================================
-- Paz dos Pais — DDL gerado a partir do schema Prisma
-- MariaDB compatible
-- ============================================================

CREATE DATABASE IF NOT EXISTS paz_dos_pais
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE paz_dos_pais;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE `User` (
  `id`           VARCHAR(191) NOT NULL,
  `name`         VARCHAR(191) NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191),
  `googleId`     VARCHAR(191),
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_googleId_key` (`googleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Patients
-- ------------------------------------------------------------
CREATE TABLE `Patient` (
  `id`        VARCHAR(191) NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `birthDate` DATETIME(3),
  `allergies` LONGTEXT,
  `alerts`    LONGTEXT,
  `notes`     LONGTEXT,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------
CREATE TABLE `Permission` (
  `id`        VARCHAR(191) NOT NULL,
  `userId`    VARCHAR(191) NOT NULL,
  `patientId` VARCHAR(191) NOT NULL,
  `role`      ENUM('OWNER', 'CAREGIVER', 'VIEWER') NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `Permission_userId_patientId_key` (`userId`, `patientId`),
  CONSTRAINT `Permission_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Permission_patientId_fkey`
    FOREIGN KEY (`patientId`) REFERENCES `Patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Appointments
-- ------------------------------------------------------------
CREATE TABLE `Appointment` (
  `id`             VARCHAR(191) NOT NULL,
  `patientId`      VARCHAR(191) NOT NULL,
  `doctorName`     VARCHAR(191) NOT NULL,
  `specialty`      VARCHAR(191),
  `dateTime`       DATETIME(3)  NOT NULL,
  `status`         ENUM('SCHEDULED', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'SCHEDULED',
  `notes`          LONGTEXT,
  `reminderSentAt` DATETIME(3),
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  CONSTRAINT `Appointment_patientId_fkey`
    FOREIGN KEY (`patientId`) REFERENCES `Patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Medications
-- ------------------------------------------------------------
CREATE TABLE `Medication` (
  `id`            VARCHAR(191) NOT NULL,
  `patientId`     VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191),
  `name`          VARCHAR(191) NOT NULL,
  `dosage`        VARCHAR(191),
  `frequency`     VARCHAR(191),
  `times`         VARCHAR(191),
  `startDate`     DATETIME(3),
  `endDate`       DATETIME(3),
  `isActive`      TINYINT(1)   NOT NULL DEFAULT 1,
  `source`        ENUM('AI_EXTRACTION', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
  `receiptUrl`    VARCHAR(191),
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  CONSTRAINT `Medication_patientId_fkey`
    FOREIGN KEY (`patientId`) REFERENCES `Patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Medication_appointmentId_fkey`
    FOREIGN KEY (`appointmentId`) REFERENCES `Appointment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- MedicationLogs
-- ------------------------------------------------------------
CREATE TABLE `MedicationLog` (
  `id`           VARCHAR(191) NOT NULL,
  `medicationId` VARCHAR(191) NOT NULL,
  `scheduledFor` DATETIME(3)  NOT NULL,
  `takenAt`      DATETIME(3),
  `status`       ENUM('PENDING', 'TAKEN', 'MISSED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `MedicationLog_medicationId_scheduledFor_key` (`medicationId`, `scheduledFor`),
  CONSTRAINT `MedicationLog_medicationId_fkey`
    FOREIGN KEY (`medicationId`) REFERENCES `Medication` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Documents
-- ------------------------------------------------------------
CREATE TABLE `Document` (
  `id`            VARCHAR(191) NOT NULL,
  `patientId`     VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191),
  `title`         VARCHAR(191) NOT NULL,
  `fileUrl`       VARCHAR(191) NOT NULL,
  `fileKey`       VARCHAR(191) NOT NULL,
  `aiSummary`     LONGTEXT,
  `source`        ENUM('AI_EXTRACTION', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  CONSTRAINT `Document_patientId_fkey`
    FOREIGN KEY (`patientId`) REFERENCES `Patient` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Document_appointmentId_fkey`
    FOREIGN KEY (`appointmentId`) REFERENCES `Appointment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ShareTokens
-- ------------------------------------------------------------
CREATE TABLE `ShareToken` (
  `id`          VARCHAR(191) NOT NULL,
  `patientId`   VARCHAR(191) NOT NULL,
  `token`       VARCHAR(191) NOT NULL,
  `expiresAt`   DATETIME(3)  NOT NULL,
  `accessCount` INT          NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ShareToken_token_key` (`token`),
  CONSTRAINT `ShareToken_patientId_fkey`
    FOREIGN KEY (`patientId`) REFERENCES `Patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
