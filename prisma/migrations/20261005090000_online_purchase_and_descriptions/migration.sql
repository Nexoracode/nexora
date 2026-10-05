-- AlterTable
ALTER TABLE `Feature` ADD COLUMN `description` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `OwnerSettings` ADD COLUMN `onlineMerchantId` VARCHAR(36) NULL,
    ADD COLUMN `onlineSandbox` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `PurchaseRequest` ADD COLUMN `amount` DECIMAL(14, 0) NULL,
    ADD COLUMN `authority` VARCHAR(64) NULL,
    ADD COLUMN `method` ENUM('CARD_TO_CARD', 'ONLINE') NOT NULL DEFAULT 'CARD_TO_CARD',
    ADD COLUMN `refId` VARCHAR(64) NULL,
    ADD COLUMN `returnUrl` VARCHAR(500) NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'AWAITING_PAYMENT', 'FAILED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX `PurchaseRequest_authority_key` ON `PurchaseRequest`(`authority`);

