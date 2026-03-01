using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkerProviderAndRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "worker_heartbeat",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "worker_heartbeat",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Provider",
                table: "worker_heartbeat");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "worker_heartbeat");
        }
    }
}
