-- AlterTable
ALTER TABLE `PurchaseRequest` ADD COLUMN `packageId` VARCHAR(191) NULL,
    MODIFY `featureKey` VARCHAR(64) NULL;

-- AddForeignKey
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

