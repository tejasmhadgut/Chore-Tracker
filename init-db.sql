-- Create all tables needed for ChoreTrack
CREATE TABLE IF NOT EXISTS "AspNetRoles" (
    "Id" text NOT NULL,
    "Name" character varying(256),
    "NormalizedName" character varying(256),
    "ConcurrencyStamp" text,
    CONSTRAINT "PK_AspNetRoles" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "AspNetUsers" (
    "Id" text NOT NULL,
    "UserName" character varying(256),
    "NormalizedUserName" character varying(256),
    "Email" character varying(256),
    "NormalizedEmail" character varying(256),
    "EmailConfirmed" boolean NOT NULL,
    "PasswordHash" text,
    "SecurityStamp" text,
    "ConcurrencyStamp" text,
    "PhoneNumber" text,
    "PhoneNumberConfirmed" boolean NOT NULL,
    "TwoFactorEnabled" boolean NOT NULL,
    "LockoutEnd" timestamp with time zone,
    "LockoutEnabled" boolean NOT NULL,
    "AccessFailedCount" integer NOT NULL,
    "FirstName" character varying(100),
    "LastName" character varying(100),
    "ProfilePictureUrl" text,
    CONSTRAINT "PK_AspNetUsers" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
    "Id" integer NOT NULL,
    "RoleId" text NOT NULL,
    "ClaimType" text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserClaims" (
    "Id" integer NOT NULL,
    "UserId" text NOT NULL,
    "ClaimType" text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserLogins" (
    "LoginProvider" character varying(128) NOT NULL,
    "ProviderKey" character varying(128) NOT NULL,
    "ProviderDisplayName" text,
    "UserId" text NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserTokens" (
    "UserId" text NOT NULL,
    "LoginProvider" character varying(128) NOT NULL,
    "Name" character varying(128) NOT NULL,
    "Value" text,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" text NOT NULL,
    "Name" character varying(255) NOT NULL,
    "Description" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Groups" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Chores" (
    "Id" text NOT NULL,
    "Title" character varying(255) NOT NULL,
    "Description" text,
    "GroupId" text NOT NULL,
    "AssignedUserId" text,
    "Status" integer NOT NULL,
    "Priority" integer NOT NULL,
    "DueDate" timestamp with time zone,
    "Frequency" integer NOT NULL,
    "NextOccurence" timestamp with time zone,
    "IsRecurring" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "Difficulty" integer NOT NULL DEFAULT 1,
    CONSTRAINT "PK_Chores" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Chores_AspNetUsers_AssignedUserId" FOREIGN KEY ("AssignedUserId") REFERENCES "AspNetUsers" ("Id"),
    CONSTRAINT "FK_Chores_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "GroupMembers" (
    "Id" text NOT NULL,
    "GroupId" text NOT NULL,
    "UserId" text NOT NULL,
    "JoinedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_GroupMembers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupMembers_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GroupMembers_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChoreCompletion" (
    "Id" text NOT NULL,
    "ChoreId" text NOT NULL,
    "CompletedBy" text NOT NULL,
    "CompletedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ChoreCompletion" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ChoreCompletion_AspNetUsers_CompletedBy" FOREIGN KEY ("CompletedBy") REFERENCES "AspNetUsers" ("Id"),
    CONSTRAINT "FK_ChoreCompletion_Chores_ChoreId" FOREIGN KEY ("ChoreId") REFERENCES "Chores" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" text NOT NULL,
    "UserId" text NOT NULL,
    "Type" integer NOT NULL,
    "Message" text NOT NULL,
    "ChoreId" text,
    "GroupId" text,
    "ActorUserId" text,
    "IsRead" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ReadAt" timestamp with time zone,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_AspNetUsers_ActorUserId" FOREIGN KEY ("ActorUserId") REFERENCES "AspNetUsers" ("Id"),
    CONSTRAINT "FK_Notifications_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id"),
    CONSTRAINT "FK_Notifications_Chores_ChoreId" FOREIGN KEY ("ChoreId") REFERENCES "Chores" ("Id"),
    CONSTRAINT "FK_Notifications_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");
CREATE INDEX IF NOT EXISTS "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Chore_GroupId" ON "Chores" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Chore_NextOccurence" ON "Chores" ("NextOccurence");
CREATE INDEX IF NOT EXISTS "IX_Chore_Status" ON "Chores" ("Status");
CREATE INDEX IF NOT EXISTS "IX_GroupMember_UserId" ON "GroupMembers" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_GroupMember_GroupId" ON "GroupMembers" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Notification_UserId" ON "Notifications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notification_UserId_IsRead" ON "Notifications" ("UserId", "IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notification_CreatedAt" ON "Notifications" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notification_UserId_CreatedAt" ON "Notifications" ("UserId", "CreatedAt");

-- Mark migrations as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250323010114_FixRecurrenceEndDateType', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260203_AddJoinedAtToGroupMember', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260203162018_UpdateChoreModel', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260203162743_FixTimestampType', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260206042328_AddDifficultyToChore', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260206042403_SetDefaultDifficultyToMedium', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260206054135_AddNotificationSystem', '9.0.2')
ON CONFLICT ("MigrationId") DO NOTHING;
