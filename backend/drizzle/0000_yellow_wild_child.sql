CREATE TABLE `attendance_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opened_by` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_days_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `attendance_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attendance_day_id` int NOT NULL,
	`student_id` int NOT NULL,
	`status` enum('HADIR','IZIN','SAKIT','ALPHA') NOT NULL DEFAULT 'HADIR',
	`reason` varchar(255),
	`special_note` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_details_attendance_day_id_student_id_unique` UNIQUE(`attendance_day_id`,`student_id`)
);
--> statement-breakpoint
CREATE TABLE `cash_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`period_id` int NOT NULL,
	`amount_paid` decimal(10,2) NOT NULL,
	`payment_date` date NOT NULL,
	`received_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `cash_payments_student_id_period_id_unique` UNIQUE(`student_id`,`period_id`)
);
--> statement-breakpoint
CREATE TABLE `cash_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`due_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `cash_periods_start_date_end_date_unique` UNIQUE(`start_date`,`end_date`)
);
--> statement-breakpoint
CREATE TABLE `cash_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('INCOME','EXPENSE') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(255) NOT NULL,
	`created_by` int NOT NULL,
	`reference_payment_id` int,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` enum('ADMIN','SEKRETARIS','BENDAHARA','SISWA') NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`full_name` varchar(100) NOT NULL,
	`gender` enum('L','P') NOT NULL,
	`phone` varchar(20),
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_id` int NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `attendance_days` ADD CONSTRAINT `attendance_days_opened_by_users_id_fk` FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_details` ADD CONSTRAINT `attendance_details_attendance_day_id_attendance_days_id_fk` FOREIGN KEY (`attendance_day_id`) REFERENCES `attendance_days`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_details` ADD CONSTRAINT `attendance_details_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_payments` ADD CONSTRAINT `cash_payments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_payments` ADD CONSTRAINT `cash_payments_period_id_cash_periods_id_fk` FOREIGN KEY (`period_id`) REFERENCES `cash_periods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_payments` ADD CONSTRAINT `cash_payments_received_by_users_id_fk` FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_reference_payment_id_cash_payments_id_fk` FOREIGN KEY (`reference_payment_id`) REFERENCES `cash_payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_student` ON `attendance_details` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_deleted_at` ON `cash_transactions` (`deleted_at`);