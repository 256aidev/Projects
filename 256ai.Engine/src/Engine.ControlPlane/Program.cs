using System.Text.Json;
using Engine.ControlPlane.Services;
using Engine.Infrastructure;
using Engine.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ModelContextProtocol;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for dashboard access from any machine
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Engine infrastructure (DB + HTTP-based messaging, no RabbitMQ required)
builder.Services.AddEngineInfrastructureHttp(builder.Configuration);

// MCP Server — exposes engine tools via SSE for Claude Code and other MCP clients
builder.Services
    .AddMcpServer(options =>
    {
        options.ServerInfo = new()
        {
            Name = "256ai-engine",
            Version = "1.0.0"
        };
    })
    .WithHttpTransport()
    .WithToolsFromAssembly();

// RabbitMQ background services disabled - using HTTP polling instead
// builder.Services.AddHostedService<HealthConsumerService>();
// builder.Services.AddHostedService<TaskResultConsumerService>();

// Auto-retry failed tasks (checks every 30s, excludes workers that already failed)
builder.Services.AddHostedService<Engine.ControlPlane.Services.TaskAutoRetryService>();

// Recover stale tasks stuck in LEASED/ACKED/RUNNING (checks every 60s)
builder.Services.AddHostedService<Engine.ControlPlane.Services.StaleTaskCleanupService>();

var app = builder.Build();

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<Engine.Infrastructure.Data.EngineDbContext>();

    // If DB exists with tables but no migration history (created via EnsureCreated),
    // seed the history table so Migrate() only applies new migrations.
    // Only do this if the machines table already exists (meaning EnsureCreated was used before).
    try
    {
        // Check if machines table exists — if it does, DB was created via EnsureCreated
        var tableExists = db.Database.ExecuteSqlRaw(@"SELECT 1 FROM ""machines"" LIMIT 1");
        // If we got here, tables exist but might lack migration history — seed it
        db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (""MigrationId"" TEXT NOT NULL PRIMARY KEY, ""ProductVersion"" TEXT NOT NULL)");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260130004957_InitialCreate', '8.0.11')");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260216050254_AddWorkerIpAddress', '8.0.11')");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260216052003_AddSubagentFields', '8.0.11')");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260216063607_AddWorkerProviderAndRole', '8.0.11')");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260216065313_AddProjectEntity', '8.0.11')");
        db.Database.ExecuteSqlRaw(@"INSERT OR IGNORE INTO ""__EFMigrationsHistory"" VALUES ('20260216073705_AddProjectSpecMarkdown', '8.0.11')");
    }
    catch
    {
        // DB is fresh or tables don't exist — Migrate will create everything from scratch
    }

    db.Database.Migrate();

    // Seed machines if table is empty
    if (!db.Machines.Any())
    {
        db.Machines.AddRange(
            new MachineEntity
            {
                MachineId = "dragon",
                DisplayName = "256AI (Dragon)",
                Hostname = "256AI",
                IpAddress = "10.0.1.147",
                Os = "Windows 11",
                Role = "coordinator+worker",
                AlwaysOn = true,
                ServicesJson = JsonSerializer.Serialize(new[]
                {
                    new { name = "Control Plane", port = 5100, url = "http://10.0.1.147:5100" },
                    new { name = "MCP SSE", port = 5100, url = "http://10.0.1.147:5100/sse" },
                    new { name = "Dashboard", port = 8080, url = "http://10.0.1.147:8080" },
                    new { name = "Sound Engine", port = 5200, url = "http://10.0.1.147:5200" },
                    new { name = "Ollama", port = 11434, url = "http://10.0.1.147:11434" }
                }),
                WorkerIdsJson = JsonSerializer.Serialize(new[] { "worker-dragon-001", "worker-dragon-sound-001" }),
                DomainsJson = JsonSerializer.Serialize(new[] { "general", "infrastructure" }),
                ProjectPaths = @"I:\2026CodeProjects\256ai.Engine",
                Notes = "Coordinator + light worker. Ollama is for APPS ONLY (BaZi production), NOT for dev. SSH broken — use RDP.",
                UpdatedAt = DateTimeOffset.UtcNow
            },
            new MachineEntity
            {
                MachineId = "mainwin",
                DisplayName = "MainWin (Dev Win11)",
                Hostname = "Dev Win11 Box",
                IpAddress = "10.0.1.235",
                Os = "Windows 11",
                Role = "worker",
                AlwaysOn = false,
                ServicesJson = JsonSerializer.Serialize(new[]
                {
                    new { name = "Claude Code", port = 0, url = "" }
                }),
                WorkerIdsJson = JsonSerializer.Serialize(new[] { "worker-mainwin-001" }),
                DomainsJson = JsonSerializer.Serialize(new[] { "general", "code", "docs" }),
                ProjectPaths = @"I:\2026CodeProjects\256ai.Engine",
                Notes = "Primary human dev machine. NOT always on. Swarm Lead runs here. Connects to Dragon at http://10.0.1.147:5100.",
                UpdatedAt = DateTimeOffset.UtcNow
            },
            new MachineEntity
            {
                MachineId = "ai02",
                DisplayName = "AI02 (NucBox)",
                Hostname = "NucBox_EVO-X2",
                IpAddress = "10.0.1.178",
                Os = "Windows",
                Role = "worker",
                AlwaysOn = true,
                RdpConnection = "mark@10.0.1.178",
                ServicesJson = JsonSerializer.Serialize(new[]
                {
                    new { name = "Claude Code", port = 0, url = "" },
                    new { name = "Ollama (dev)", port = 11434, url = "http://10.0.1.178:11434" }
                }),
                WorkerIdsJson = JsonSerializer.Serialize(new[] { "worker-aipc2-001", "worker-ai02-coder-001", "worker-ai02-coder-002" }),
                DomainsJson = JsonSerializer.Serialize(new[] { "general", "code", "dev" }),
                Notes = "3 workers: Claude Code + 2x Ollama coders. Ollama on this machine is for DEV/testing only. RDP: mark@10.0.1.178.",
                UpdatedAt = DateTimeOffset.UtcNow
            },
            new MachineEntity
            {
                MachineId = "mac",
                DisplayName = "Mac (Build Box)",
                Hostname = "Mac Build Box",
                IpAddress = "10.0.1.237",
                Os = "macOS",
                Role = "worker",
                AlwaysOn = true,
                SshConnection = "marklombardi@10.0.1.237",
                ServicesJson = JsonSerializer.Serialize(new[]
                {
                    new { name = "Claude Code", port = 0, url = "" }
                }),
                WorkerIdsJson = JsonSerializer.Serialize(new[] { "worker-mac-001" }),
                DomainsJson = JsonSerializer.Serialize(new[] { "frontend", "ui", "mobile" }),
                ProjectPaths = "~/Projects/BaZi/",
                Notes = "Frontend/UI/mobile worker. SSH: marklombardi@10.0.1.237. Sync file: ~/Projects/BaZi/Docs/CLAUDE_SYNC.md (capital D). Claude Code v2.1.29 at /opt/homebrew/bin/claude.",
                UpdatedAt = DateTimeOffset.UtcNow
            }
        );
        db.SaveChanges();
    }
}

// Enable CORS
app.UseCors("AllowAll");

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

// MCP SSE endpoint — clients connect at /sse
app.MapMcp();

app.Run();
