using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Engine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMachineRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "machines",
                columns: table => new
                {
                    MachineId = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    Hostname = table.Column<string>(type: "TEXT", nullable: false),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: false),
                    Os = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    AlwaysOn = table.Column<bool>(type: "INTEGER", nullable: false),
                    SshConnection = table.Column<string>(type: "TEXT", nullable: true),
                    RdpConnection = table.Column<string>(type: "TEXT", nullable: true),
                    ServicesJson = table.Column<string>(type: "TEXT", nullable: false),
                    WorkerIdsJson = table.Column<string>(type: "TEXT", nullable: true),
                    DomainsJson = table.Column<string>(type: "TEXT", nullable: true),
                    ProjectPaths = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_machines", x => x.MachineId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_machines_IpAddress",
                table: "machines",
                column: "IpAddress");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "machines");
        }
    }
}
