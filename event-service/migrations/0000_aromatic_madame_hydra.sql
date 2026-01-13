CREATE TABLE `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`registered_at` text DEFAULT (datetime('now')) NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_event_idx` ON `event_registrations` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`body` text NOT NULL,
	`location` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`category` text NOT NULL,
	`event_type` text NOT NULL,
	`organizer_id` text NOT NULL,
	`max_attendees` integer,
	`current_attendees` integer DEFAULT 0 NOT NULL,
	`tags` text,
	`event_url` text,
	`contact_email` text,
	`contact_phone` text,
	`requirements` text,
	`refund_policy` text,
	`age_restriction` integer,
	`registration_deadline` text,
	`allow_waitlist` integer DEFAULT false NOT NULL,
	`send_reminders` integer DEFAULT true NOT NULL,
	`allow_guest_registration` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`image_url` text,
	`video_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`registration_id` text NOT NULL,
	`ticket_code` text NOT NULL,
	`ticket_image_url` text,
	`status` text DEFAULT 'valid' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_ticket_code_unique` ON `tickets` (`ticket_code`);