-- AlterTable
ALTER TABLE `SupportTicket` ADD COLUMN `number` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `category` ENUM('TECHNICAL', 'BILLING', 'LICENSE', 'FEATURE_REQUEST', 'OTHER') NOT NULL DEFAULT 'OTHER',
    ADD COLUMN `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    ADD UNIQUE INDEX `SupportTicket_number_key`(`number`);

-- CreateIndex
CREATE INDEX `SupportTicket_priority_status_idx` ON `SupportTicket`(`priority`, `status`);
