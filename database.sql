CREATE DATABASE IF NOT EXISTS `gradingsystem` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gradingsystem`;

CREATE TABLE IF NOT EXISTS `sections` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `section_name` VARCHAR(100) NOT NULL,
    `year_level` VARCHAR(50) NOT NULL,
    `adviser` VARCHAR(120) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_section_year` (`section_name`, `year_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subjects` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `subject_code` VARCHAR(50) NOT NULL,
    `subject_name` VARCHAR(150) NOT NULL,
    `units` DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    `description` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_subject_code` (`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `section_subjects` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `section_id` INT UNSIGNED NOT NULL,
    `subject_id` INT UNSIGNED NOT NULL,
    `schedule` VARCHAR(120) DEFAULT NULL,
    `instructor` VARCHAR(120) DEFAULT NULL,
    `teacher_id` INT UNSIGNED DEFAULT NULL,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_section_subject` (`section_id`, `subject_id`),
    CONSTRAINT `fk_ss_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ss_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `students` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_no` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `middle_name` VARCHAR(100) DEFAULT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `gender` ENUM('Female', 'Male') NOT NULL DEFAULT 'Female',
    `year_level` VARCHAR(50) NOT NULL,
    `section_id` INT UNSIGNED NOT NULL,
    `status` ENUM('Active', 'Irregular', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_student_no` (`student_no`),
    CONSTRAINT `fk_student_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_grades` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT UNSIGNED NOT NULL,
    `section_id` INT UNSIGNED NOT NULL,
    `subject_id` INT UNSIGNED NOT NULL,
    `quarter` ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL DEFAULT 'Q1',
    `grade` DECIMAL(5,2) NOT NULL,
    `remarks` VARCHAR(100) DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_student_subject_quarter` (`student_id`, `subject_id`, `quarter`),
    CONSTRAINT `fk_sg_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sg_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sg_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(60) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `role` ENUM('admin', 'teacher') NOT NULL DEFAULT 'teacher',
    `can_add_student` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `grade_locks` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `section_id` INT UNSIGNED NOT NULL,
    `subject_id` INT UNSIGNED NOT NULL,
    `quarter` ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL DEFAULT 'Q1',
    `is_locked` TINYINT(1) NOT NULL DEFAULT 1,
    `locked_by_user_id` INT UNSIGNED DEFAULT NULL,
    `locked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `unlock_requested` TINYINT(1) NOT NULL DEFAULT 0,
    `unlock_reason` TEXT DEFAULT NULL,
    `unlock_requested_by` INT UNSIGNED DEFAULT NULL,
    `unlock_requested_at` DATETIME DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_section_subject_quarter_lock` (`section_id`, `subject_id`, `quarter`),
    CONSTRAINT `fk_gl_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gl_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default administrator (admin / admin123)
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `can_add_student`, `is_active`)
VALUES ('admin', '$2y$10$o8k4i3XWv10i2zP/8p0c3u5AwhGzSjSvhB7K2G7zYm7s0T7f5/k1G', 'System Administrator', 'admin', 1, 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Default teachers (password: teacher123)
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `can_add_student`, `is_active`) VALUES
('jpdaguman', '$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'Jan Paul Daguman', 'teacher', 0, 1),
('kcortes',   '$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'Kim Cortes', 'teacher', 0, 1),
('prabina',   '$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'Peter Rabina', 'teacher', 0, 1),
('cmagbago',  '$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'Casey Magbago', 'teacher', 0, 1),
('rggabule',  '$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'RG Gabule', 'teacher', 0, 1),
('dantiquina','$2y$10$qV9g1yv8D/tXv2A17I3xUu7aG/N2u3hB7K2G7zYm7s0T7f5/k1G.', 'Danica Antiquina', 'teacher', 0, 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);
