-- CreateTable
CREATE TABLE `user` (
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('RECRUITER', 'APPLICANT') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiter` (
    `user_id` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applicant` (
    `user_id` VARCHAR(191) NOT NULL,
    `resume_url` VARCHAR(191) NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_description` (
    `job_id` VARCHAR(191) NOT NULL,
    `recruiter_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `salary` DECIMAL(65, 30) NULL,
    `description` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `posted_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ACTIVE', 'CLOSED', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_qualification` (
    `job_id` VARCHAR(191) NOT NULL,
    `qualification` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`job_id`, `qualification`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_skill` (
    `job_id` VARCHAR(191) NOT NULL,
    `skill` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`job_id`, `skill`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv` (
    `cv_id` VARCHAR(191) NOT NULL,
    `applicant_id` VARCHAR(191) NOT NULL,
    `job_id` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NULL,
    `file_name` VARCHAR(191) NULL,
    `file_url` VARCHAR(191) NULL,
    `submitted_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`cv_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `result` (
    `result_id` VARCHAR(191) NOT NULL,
    `cv_id` VARCHAR(191) NOT NULL,
    `processed_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comment` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `score` INTEGER NULL,

    UNIQUE INDEX `result_cv_id_key`(`cv_id`),
    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recruiter` ADD CONSTRAINT `recruiter_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_description` ADD CONSTRAINT `job_description_recruiter_id_fkey` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiter`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_qualification` ADD CONSTRAINT `job_qualification_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job_description`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_skill` ADD CONSTRAINT `job_skill_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job_description`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv` ADD CONSTRAINT `cv_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `applicant`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv` ADD CONSTRAINT `cv_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job_description`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_cv_id_fkey` FOREIGN KEY (`cv_id`) REFERENCES `cv`(`cv_id`) ON DELETE CASCADE ON UPDATE CASCADE;
