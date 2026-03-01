using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectSpecMarkdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SpecMarkdown",
                table: "projects",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpecMarkdown",
                table: "projects");
        }
    }
}
