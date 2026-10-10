-- AlterTable
ALTER TABLE `OwnerSettings` ADD COLUMN `ticketPrice` DECIMAL(14, 0) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Site` ADD COLUMN `supportFreeMonths` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `supportFreeUntil` DATETIME(3) NULL,
    ADD COLUMN `walletBalance` DECIMAL(14, 0) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` ENUM('AWAITING_PAYMENT', 'OPEN', 'ANSWERED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `charge` ENUM('FREE', 'WALLET', 'ONLINE') NOT NULL DEFAULT 'FREE',
    `fee` DECIMAL(14, 0) NOT NULL DEFAULT 0,
    `authority` VARCHAR(64) NULL,
    `refId` VARCHAR(64) NULL,
    `returnUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `SupportTicket_authority_key`(`authority`),
    INDEX `SupportTicket_siteId_createdAt_idx`(`siteId`, `createdAt`),
    INDEX `SupportTicket_status_updatedAt_idx`(`status`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `fromOwner` BOOLEAN NOT NULL DEFAULT false,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletEntry` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 0) NOT NULL,
    `balanceAfter` DECIMAL(14, 0) NOT NULL,
    `type` ENUM('TOPUP', 'TICKET_FEE', 'ADMIN_CREDIT', 'ADMIN_DEBIT') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NULL,
    `topupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WalletEntry_siteId_createdAt_idx`(`siteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletTopup` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 0) NOT NULL,
    `method` ENUM('CARD_TO_CARD', 'ONLINE') NOT NULL,
    `status` ENUM('AWAITING_PAYMENT', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED') NOT NULL,
    `trackingCode` VARCHAR(60) NULL,
    `rejectReason` VARCHAR(500) NULL,
    `authority` VARCHAR(64) NULL,
    `refId` VARCHAR(64) NULL,
    `returnUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WalletTopup_authority_key`(`authority`),
    INDEX `WalletTopup_siteId_createdAt_idx`(`siteId`, `createdAt`),
    INDEX `WalletTopup_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletEntry` ADD CONSTRAINT `WalletEntry_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTopup` ADD CONSTRAINT `WalletTopup_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
