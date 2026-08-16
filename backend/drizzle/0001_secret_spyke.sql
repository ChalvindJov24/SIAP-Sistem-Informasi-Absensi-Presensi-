ALTER TABLE `users` ADD `password_changed_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `last_password_reset_by` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_last_password_reset_by_users_id_fk` FOREIGN KEY (`last_password_reset_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;