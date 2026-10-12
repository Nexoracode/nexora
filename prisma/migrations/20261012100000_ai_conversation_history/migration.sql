-- AlterTable
ALTER TABLE `AiConversation` MODIFY `id` VARCHAR(64) NOT NULL,
    ADD COLUMN `title` VARCHAR(120) NOT NULL DEFAULT 'گفتگوی جدید',
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `AiConversation_updatedAt_idx` ON `AiConversation`(`updatedAt`);
