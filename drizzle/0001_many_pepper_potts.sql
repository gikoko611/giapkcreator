CREATE TABLE `gi_ai_tasks` (
	`id` varchar(64) NOT NULL,
	`ownerHash` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`providerId` varchar(32) NOT NULL,
	`model` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`stage` varchar(100) NOT NULL DEFAULT 'queued',
	`progress` int NOT NULL DEFAULT 0,
	`result` text,
	`error` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gi_ai_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gi_projects` (
	`id` varchar(64) NOT NULL,
	`ownerHash` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`packageName` varchar(255) NOT NULL,
	`description` text,
	`status` enum('Draft','Generating','Needs review','Imported','Ready to build','Building','Build failed') NOT NULL DEFAULT 'Draft',
	`archiveKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gi_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gi_ai_tasks` ADD CONSTRAINT `gi_ai_tasks_projectId_gi_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `gi_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `gi_ai_tasks_owner_created_idx` ON `gi_ai_tasks` (`ownerHash`,`createdAt`);--> statement-breakpoint
CREATE INDEX `gi_ai_tasks_project_idx` ON `gi_ai_tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `gi_projects_owner_idx` ON `gi_projects` (`ownerHash`);