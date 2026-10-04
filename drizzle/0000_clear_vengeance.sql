CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`visitor` text NOT NULL,
	`week` integer NOT NULL,
	`question_index` integer NOT NULL,
	`question` text NOT NULL,
	`answer_type` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `answers_created_idx` ON `answers` (`created_at`);--> statement-breakpoint
CREATE INDEX `answers_session_idx` ON `answers` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`csrf` text NOT NULL,
	`tag` text NOT NULL,
	`created_at` integer NOT NULL
);
