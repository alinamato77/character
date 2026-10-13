CREATE TABLE `inbox_attempts` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`resets_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inbox_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`code_key` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `answers` ADD `visitor_name` text;