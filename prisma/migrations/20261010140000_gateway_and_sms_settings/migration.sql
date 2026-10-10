-- CreateTable
CREATE TABLE `GatewaySetting` (
    `provider` VARCHAR(40) NOT NULL,
    `credentialEncrypted` TEXT NOT NULL,
    `credentialMasked` VARCHAR(80) NOT NULL,
    `isSandbox` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`provider`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `apiKeyEncrypted` TEXT NULL,
    `apiKeyMasked` VARCHAR(80) NULL,
    `lineNumber` VARCHAR(40) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsLog` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `phone` VARCHAR(11) NOT NULL,
    `text` VARCHAR(1000) NOT NULL,
    `ok` BOOLEAN NOT NULL,
    `error` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmsLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
