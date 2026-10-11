-- CreateTable
CREATE TABLE `AiConversation` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
