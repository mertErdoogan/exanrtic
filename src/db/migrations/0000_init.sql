CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`catalog_id` text,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`technology` text NOT NULL,
	`frequencies` text,
	`coil` text,
	`serial` text,
	`purchased_at` integer,
	`warranty_months` integer,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dig_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`dig_id` text NOT NULL,
	`uri` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`dig_id`) REFERENCES `digs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `digs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`site_id` text NOT NULL,
	`ts` integer NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real,
	`result` text DEFAULT 'unknown' NOT NULL,
	`target_id` integer,
	`depth_cm` integer,
	`title` text,
	`note` text,
	`voice_uri` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `digs_session_idx` ON `digs` (`session_id`);--> statement-breakpoint
CREATE INDEX `digs_site_idx` ON `digs` (`site_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`device_id` text,
	`status` text NOT NULL,
	`target` text DEFAULT 'general' NOT NULL,
	`sweep_width_m` real NOT NULL,
	`distance_m` real DEFAULT 0 NOT NULL,
	`covered_m2` real DEFAULT 0 NOT NULL,
	`segment` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`notes` text,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `sessions_site_idx` ON `sessions` (`site_id`);--> statement-breakpoint
CREATE INDEX `sessions_status_idx` ON `sessions` (`status`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`notes` text,
	`owner_name` text,
	`owner_contact` text,
	`permit_from` integer,
	`permit_until` integer,
	`permit_photo_uri` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `track_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`segment` integer DEFAULT 0 NOT NULL,
	`ts` integer NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `track_points_session_idx` ON `track_points` (`session_id`,`ts`);