using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubagentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DependsOnJson",
                table: "tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExecutionMode",
                table: "tasks",
                type: "TEXT",
                nullable: false,
                defaultValue: "auto");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastProgressAt",
                table: "tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxRetries",
                table: "tasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<string>(
                name: "ParentTaskId",
                table: "tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProgressJson",
                table: "tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                table: "tasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_ParentTaskId",
                table: "tasks",
                column: "ParentTaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_ParentTaskId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "DependsOnJson",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ExecutionMode",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "LastProgressAt",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "MaxRetries",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ProgressJson",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                table: "tasks");
        }
    }
}
