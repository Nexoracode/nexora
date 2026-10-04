-- CreateTable
CREATE TABLE `Feature` (
    `key` VARCHAR(64) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `group` VARCHAR(80) NOT NULL,
    `price` DECIMAL(14, 0) NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Package` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `price` DECIMAL(14, 0) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackageFeature` (
    `packageId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`packageId`, `featureKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Client_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Site` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `licenseKeyHash` VARCHAR(64) NOT NULL,
    `keyPrefix` VARCHAR(16) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `contractPrice` DECIMAL(14, 0) NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `notes` VARCHAR(1000) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Site_domain_key`(`domain`),
    UNIQUE INDEX `Site_licenseKeyHash_key`(`licenseKeyHash`),
    INDEX `Site_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteFeature` (
    `siteId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`siteId`, `featureKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LicenseEvent` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `type` ENUM('SITE_CREATED', 'FEATURES_CHANGED', 'STATUS_CHANGED', 'KEY_ROTATED', 'CHECK_REJECTED') NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LicenseEvent_siteId_createdAt_idx`(`siteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PackageFeature` ADD CONSTRAINT `PackageFeature_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackageFeature` ADD CONSTRAINT `PackageFeature_featureKey_fkey` FOREIGN KEY (`featureKey`) REFERENCES `Feature`(`key`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Site` ADD CONSTRAINT `Site_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteFeature` ADD CONSTRAINT `SiteFeature_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteFeature` ADD CONSTRAINT `SiteFeature_featureKey_fkey` FOREIGN KEY (`featureKey`) REFERENCES `Feature`(`key`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LicenseEvent` ADD CONSTRAINT `LicenseEvent_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

