<?php
declare(strict_types=1);

define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_NAME', 'gradingsystem');

function getDBConnection(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // Connect to MySQL server first to ensure the database exists
        $serverDsn = 'mysql:host=' . DB_HOST . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($serverDsn, DB_USER, DB_PASS, $options);
        $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $pdo->exec('USE `' . DB_NAME . '`');

        ensureSchema($pdo);

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage(),
        ]);
        exit;
    }
}

function getDatabaseStatus(): array
{
    try {
        $serverDsn = 'mysql:host=' . DB_HOST . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($serverDsn, DB_USER, DB_PASS, $options);
        $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $pdo->exec('USE `' . DB_NAME . '`');

        ensureSchema($pdo);

        return [
            'connected' => true,
            'database'  => DB_NAME,
            'error'     => null,
        ];
    } catch (PDOException $e) {
        return [
            'connected' => false,
            'database'  => DB_NAME,
            'error'     => $e->getMessage(),
        ];
    }
}

function ensureSchema(PDO $pdo): void
{
    $pdo->exec("
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
    ");

    // Ensure `gender` column exists on existing `students` table
    $colCheck = $pdo->query("SHOW COLUMNS FROM `students` LIKE 'gender'");
    if ($colCheck && $colCheck->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `students` ADD COLUMN `gender` ENUM('Female', 'Male') NOT NULL DEFAULT 'Female' AFTER `full_name`");
    }

    // ==================== MULTI-USER ACCOUNTS (Admin & Teachers) ====================
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(60) NOT NULL,
            `password_hash` VARCHAR(255) NOT NULL,
            `full_name` VARCHAR(120) NOT NULL,
            `role` ENUM('admin', 'teacher') NOT NULL DEFAULT 'teacher',
            `is_active` TINYINT(1) NOT NULL DEFAULT 1,
            `last_login_at` DATETIME DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_username` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Each subject load in a section can be handled by one teacher account
    $teacherColCheck = $pdo->query("SHOW COLUMNS FROM `section_subjects` LIKE 'teacher_id'");
    if ($teacherColCheck && $teacherColCheck->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `section_subjects` ADD COLUMN `teacher_id` INT UNSIGNED DEFAULT NULL AFTER `instructor`");
        $pdo->exec("ALTER TABLE `section_subjects` ADD CONSTRAINT `fk_ss_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL");
    }

    // Seed a default administrator account on first run (username: admin / password: admin123)
    $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    if ($userCount === 0) {
        $seedAdmin = $pdo->prepare("INSERT INTO `users` (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')");
        $seedAdmin->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT), 'System Administrator']);
    }

    // Seed initial teacher accounts if not present (default password: teacher123)
    $initialTeachers = [
        ['jpdaguman',  'Jan Paul Daguman'],
        ['kcortes',     'Kim Cortes'],
        ['prabina',     'Peter Rabina'],
        ['cmagbago',    'Casey Magbago'],
        ['rggabule',    'RG Gabule'],
        ['dantiquina',  'Danica Antiquina'],
    ];
    $teacherCheck = $pdo->prepare("SELECT id FROM `users` WHERE `username` = ?");
    $teacherInsert = $pdo->prepare("INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `can_add_student`, `is_active`) VALUES (?, ?, ?, 'teacher', 0, 1)");
    foreach ($initialTeachers as [$uname, $fullName]) {
        $teacherCheck->execute([$uname]);
        if (!$teacherCheck->fetch()) {
            $teacherInsert->execute([$uname, password_hash('teacher123', PASSWORD_DEFAULT), $fullName]);
        }
    }

    // Ensure `sort_order` column exists on existing `section_subjects` table
    $orderCheck = $pdo->query("SHOW COLUMNS FROM `section_subjects` LIKE 'sort_order'");
    if ($orderCheck && $orderCheck->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `section_subjects` ADD COLUMN `sort_order` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `instructor`");
    }

    // Ensure `can_add_student` permission column exists on `users` table
    $permCheck = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'can_add_student'");
    if ($permCheck && $permCheck->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `can_add_student` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`");
    }

    // ==================== GRADE LOCKS & UNLOCK REQUESTS ====================
    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}
