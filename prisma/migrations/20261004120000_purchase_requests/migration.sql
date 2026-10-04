-- AlterTable
ALTER TABLE `LicenseEvent` MODIFY `type` ENUM('SITE_CREATED', 'FEATURES_CHANGED', 'STATUS_CHANGED', 'KEY_ROTATED', 'CHECK_REJECTED', 'PURCHASE_REQUESTED', 'PURCHASE_RESOLVED') NOT NULL;

-- CreateTable
CREATE TABLE `OwnerSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `holderName` VARCHAR(120) NULL,
    `cardNumber` VARCHAR(16) NULL,
    `sheba` VARCHAR(26) NULL,
    `bankName` VARCHAR(60) NULL,
    `contactPhone` VARCHAR(11) NULL,
    `note` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseRequest` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(64) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `trackingCode` VARCHAR(60) NOT NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `PurchaseRequest_siteId_status_idx`(`siteId`, `status`),
    INDEX `PurchaseRequest_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_featureKey_fkey` FOREIGN KEY (`featureKey`) REFERENCES `Feature`(`key`) ON DELETE CASCADE ON UPDATE CASCADE;

