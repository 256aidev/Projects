using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFailedWorkersJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FailedWorkersJson",
                table: "tasks",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedWorkersJson",
                table: "tasks");
        }
    }
}
