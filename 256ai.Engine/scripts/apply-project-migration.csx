// Quick script to apply the AddProjectEntity migration manually
// Run via: dotnet run --project src/Engine.ControlPlane -- migrate
// Or execute the SQL below directly

// SQL to create the __EFMigrationsHistory table if it doesn't exist,
// insert existing migration records, then apply the new ProjectEntity migration.

/*
-- Step 1: Create migration history table if needed
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);

-- Step 2: Record existing migrations (so EF doesn't re-run them)
INSERT OR IGNORE INTO "__EFMigrationsHistory" VALUES ('20260130004957_InitialCreate', '8.0.11');
INSERT OR IGNORE INTO "__EFMigrationsHistory" VALUES ('20260216050254_AddWorkerIpAddress', '8.0.11');
INSERT OR IGNORE INTO "__EFMigrationsHistory" VALUES ('20260216052003_AddSubagentFields', '8.0.11');
INSERT OR IGNORE INTO "__EFMigrationsHistory" VALUES ('20260216063607_AddWorkerProviderAndRole', '8.0.11');

-- Step 3: Apply the new migration
ALTER TABLE "tasks" ADD "ProjectId" TEXT;
CREATE INDEX "IX_tasks_ProjectId" ON "tasks" ("ProjectId");

CREATE TABLE "projects" (
    "ProjectId" TEXT NOT NULL CONSTRAINT "PK_projects" PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Domain" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "TemplateId" TEXT,
    "ConfigJson" TEXT,
    "WorkingDirectory" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "CompletedAt" TEXT
);
CREATE INDEX "IX_projects_CreatedAt" ON "projects" ("CreatedAt");
CREATE INDEX "IX_projects_Domain" ON "projects" ("Domain");
CREATE INDEX "IX_projects_Status" ON "projects" ("Status");

-- Step 4: Record the new migration
INSERT INTO "__EFMigrationsHistory" VALUES ('20260216065313_AddProjectEntity', '8.0.11');
*/
