using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowSpace.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGanttScheduleHistoryAndDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationDays",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsMilestoneTask",
                table: "Tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "TaskScheduleHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    OldStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OldDueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NewStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NewDueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskScheduleHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskScheduleHistories_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskScheduleHistories_Users_ChangedBy",
                        column: x => x.ChangedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskScheduleHistories_ChangedBy",
                table: "TaskScheduleHistories",
                column: "ChangedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TaskScheduleHistories_TaskId_ChangedAt",
                table: "TaskScheduleHistories",
                columns: new[] { "TaskId", "ChangedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskScheduleHistories");

            migrationBuilder.DropColumn(
                name: "DurationDays",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "IsMilestoneTask",
                table: "Tasks");
        }
    }
}
