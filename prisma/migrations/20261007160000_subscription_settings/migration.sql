-- AlterTable
ALTER TABLE `Package` ADD COLUMN `monthlyPrice` DECIMAL(14, 0) NULL;

-- CreateTable
CREATE TABLE `SubscriptionSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `quarterlyDiscountPercent` INTEGER NOT NULL DEFAULT 10,
    `yearlyDiscountPercent` INTEGER NOT NULL DEFAULT 20,
    `graceDays` INTEGER NOT NULL DEFAULT 7,
    `retentionDays` INTEGER NOT NULL DEFAULT 90,
    `lockAfterGrace` ENUM('OPTIONAL_FEATURES', 'ADMIN_PANEL', 'FULL') NOT NULL DEFAULT 'ADMIN_PANEL',
    `reminderDays` VARCHAR(40) NOT NULL DEFAULT '7,3,1',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
