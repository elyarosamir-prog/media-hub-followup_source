CREATE TABLE `awards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`type` varchar(120) NOT NULL,
	`period` varchar(30) NOT NULL,
	`reason` text,
	`status` enum('draft','approved','issued') NOT NULL DEFAULT 'draft',
	`certificateUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `awards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `committees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`leadName` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `committees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`phone` varchar(32),
	`primaryCommitteeId` int,
	`secondaryCommitteeId` int,
	`role` varchar(100) NOT NULL DEFAULT 'عضو',
	`status` enum('active','review','unresponsive','paused','archived') NOT NULL DEFAULT 'active',
	`skills` text,
	`growthFocus` text,
	`points` int NOT NULL DEFAULT 0,
	`monthlyScore` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActivityAt` timestamp,
	`notes` text,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlyEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`month` varchar(20) NOT NULL,
	`commitment` int NOT NULL DEFAULT 0,
	`quality` int NOT NULL DEFAULT 0,
	`engagement` int NOT NULL DEFAULT 0,
	`growth` int NOT NULL DEFAULT 0,
	`teamwork` int NOT NULL DEFAULT 0,
	`totalScore` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthlyEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pointsLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`points` int NOT NULL,
	`activity` varchar(180) NOT NULL,
	`reason` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pointsLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`committeeId` int,
	`assigneeId` int,
	`reviewerId` int,
	`priority` enum('low','normal','high') NOT NULL DEFAULT 'normal',
	`status` enum('todo','in_progress','submitted','needs_revision','completed','late','cancelled') NOT NULL DEFAULT 'todo',
	`dueAt` timestamp,
	`submittedAt` timestamp,
	`fileUrl` varchar(500),
	`taskScore` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
