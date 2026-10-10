-- DropForeignKey
ALTER TABLE `Site` DROP FOREIGN KEY `Site_planId_fkey`;

-- AlterTable
ALTER TABLE `Site` DROP COLUMN `planId`,
    DROP COLUMN `period`;

-- AlterTable
ALTER TABLE `PurchaseRequest` DROP COLUMN `period`;

-- AlterTable
ALTER TABLE `Package` DROP COLUMN `monthlyPrice`;

-- DropTable
DROP TABLE `SubscriptionSettings`;
