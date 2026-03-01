using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_health",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AppId = table.Column<string>(type: "TEXT", nullable: false),
                    InstanceId = table.Column<string>(type: "TEXT", nullable: false),
                    Environment = table.Column<string>(type: "TEXT", nullable: false),
                    OverallStatus = table.Column<string>(type: "TEXT", nullable: false),
                    ChecksJson = table.Column<string>(type: "TEXT", nullable: false),
                    LatencyP95 = table.Column<int>(type: "INTEGER", nullable: true),
                    ErrorRate = table.Column<double>(type: "REAL", nullable: true),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_health", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "escalations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Level = table.Column<string>(type: "TEXT", nullable: false),
                    SourceMessageType = table.Column<string>(type: "TEXT", nullable: false),
                    EvidenceJson = table.Column<string>(type: "TEXT", nullable: false),
                    Impact = table.Column<string>(type: "TEXT", nullable: false),
                    Recommendation = table.Column<string>(type: "TEXT", nullable: false),
                    Disposition = table.Column<string>(type: "TEXT", nullable: false),
                    DispositionReason = table.Column<string>(type: "TEXT", nullable: true),
                    ReviewDate = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escalations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MessageType = table.Column<string>(type: "TEXT", nullable: false),
                    PayloadJson = table.Column<string>(type: "TEXT", nullable: false),
                    CorrelationId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "synthetic_check",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ScenarioId = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    TimingsJson = table.Column<string>(type: "TEXT", nullable: false),
                    FailureReason = table.Column<string>(type: "TEXT", nullable: true),
                    CorrelationId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_synthetic_check", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    TaskId = table.Column<string>(type: "TEXT", nullable: false),
                    Objective = table.Column<string>(type: "TEXT", nullable: false),
                    Domain = table.Column<string>(type: "TEXT", nullable: false),
                    ConstraintsJson = table.Column<string>(type: "TEXT", nullable: true),
                    InputsJson = table.Column<string>(type: "TEXT", nullable: true),
                    ExpectedOutputs = table.Column<string>(type: "TEXT", nullable: false),
                    ValidationCriteria = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedWorkerId = table.Column<string>(type: "TEXT", nullable: true),
                    ResultJson = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.TaskId);
                });

            migrationBuilder.CreateTable(
                name: "worker_heartbeat",
                columns: table => new
                {
                    WorkerId = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CapacityJson = table.Column<string>(type: "TEXT", nullable: false),
                    LastTaskId = table.Column<string>(type: "TEXT", nullable: true),
                    Version = table.Column<string>(type: "TEXT", nullable: false),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_worker_heartbeat", x => x.WorkerId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app_health_AppId_InstanceId",
                table: "app_health",
                columns: new[] { "AppId", "InstanceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_health_LastSeenAt",
                table: "app_health",
                column: "LastSeenAt");

            migrationBuilder.CreateIndex(
                name: "IX_escalations_CreatedAt",
                table: "escalations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_escalations_Disposition",
                table: "escalations",
                column: "Disposition");

            migrationBuilder.CreateIndex(
                name: "IX_messages_CorrelationId",
                table: "messages",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_messages_CreatedAt",
                table: "messages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_messages_MessageType",
                table: "messages",
                column: "MessageType");

            migrationBuilder.CreateIndex(
                name: "IX_synthetic_check_CorrelationId",
                table: "synthetic_check",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_synthetic_check_CreatedAt",
                table: "synthetic_check",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_synthetic_check_ScenarioId",
                table: "synthetic_check",
                column: "ScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_AssignedWorkerId",
                table: "tasks",
                column: "AssignedWorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_CreatedAt",
                table: "tasks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_Status",
                table: "tasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_worker_heartbeat_LastSeenAt",
                table: "worker_heartbeat",
                column: "LastSeenAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_health");

            migrationBuilder.DropTable(
                name: "escalations");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "synthetic_check");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "worker_heartbeat");
        }
    }
}
