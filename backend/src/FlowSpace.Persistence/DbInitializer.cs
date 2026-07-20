using System;
using System.Collections.Generic;
using System.Linq;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Enums;
using FlowSpace.Persistence.Contexts;
using TaskStatus = FlowSpace.Domain.Enums.TaskStatus;

namespace FlowSpace.Persistence
{
    public static class DbInitializer
    {
        public static void Initialize(FlowSpaceDbContext context)
        {
            context.Database.Migrate();

            if (context.Users.Any())
            {
                return; // DB has been seeded
            }

            // 1. Seed Users
            var director = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Phạm Thanh Dung",
                Email = "admin@flowspace.demo",
                PasswordHash = "123456",
                Role = "director",
                Avatar = "PD",
                Color = "#e74c3c",
                Department = "Ban giám đốc",
                Position = "Giám đốc",
                Active = true,
                JoinDate = DateTime.UtcNow.AddYears(-3)
            };

            var manager = new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Lê Minh Cường",
                Email = "truongphong@flowspace.demo",
                PasswordHash = "123456",
                Role = "manager",
                Avatar = "LC",
                Color = "#e67e22",
                Department = "Kỹ thuật",
                Position = "Trưởng phòng",
                Active = true,
                JoinDate = DateTime.UtcNow.AddYears(-2)
            };

            var teamLead = new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "Trần Thị Bình",
                Email = "truongnhom@flowspace.demo",
                PasswordHash = "123456",
                Role = "team_lead",
                Avatar = "TB",
                Color = "#9b59b6",
                Department = "Kỹ thuật",
                Position = "Trưởng nhóm",
                Active = true,
                JoinDate = DateTime.UtcNow.AddYears(-1)
            };

            var employee = new User
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "Nguyễn Văn An",
                Email = "nhanvien@flowspace.demo",
                PasswordHash = "123456",
                Role = "employee",
                Avatar = "NV",
                Color = "#2ecc71",
                Department = "Kỹ thuật",
                Position = "Nhân viên",
                Active = true,
                JoinDate = DateTime.UtcNow.AddMonths(-6)
            };

            context.Users.AddRange(director, manager, teamLead, employee);
            context.SaveChanges();

            // 2. Seed Project "FlowSpace Platform v2" (FS-001)
            var project = new Project
            {
                Id = Guid.Parse("a1111111-a111-a111-a111-a11111111111"),
                Code = "FS-001",
                Name = "FlowSpace Platform v2",
                Description = "Nâng cấp toàn diện nền tảng FlowSpace lên phiên bản 2.0 với giao diện Notion-style và tính năng real-time.",
                Status = ProjectStatus.Active,
                Priority = ProjectPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(60),
                Progress = 45,
                OwnerId = manager.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            project.Members.Add(director);
            project.Members.Add(manager);
            project.Members.Add(teamLead);
            project.Members.Add(employee);

            context.Projects.Add(project);
            context.SaveChanges();

            // 3. Seed Tasks for Kanban Columns (Todo, InProgress, Review, Done)
            var taskDone = new TaskItem
            {
                Id = Guid.Parse("b1111111-b111-b111-b111-b11111111111"),
                Code = "T-001",
                Title = "Thiết kế UI Dashboard mới",
                Description = "Thiết kế lại toàn bộ giao diện dashboard theo Notion-Style Design System.",
                ProjectId = project.Id,
                AssigneeId = teamLead.Id,
                Status = TaskStatus.Done,
                Priority = TaskPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-25),
                DueDate = DateTime.UtcNow.AddDays(-10),
                CompletedAt = DateTime.UtcNow.AddDays(-11),
                EstimatedHours = 16,
                LoggedHours = 14,
                CreatedBy = manager.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            };

            var taskInProgress1 = new TaskItem
            {
                Id = Guid.Parse("b2222222-b222-b222-b222-b22222222222"),
                Code = "T-002",
                Title = "Implement Chart.js Dashboard",
                Description = "Code phần biểu đồ dashboard dùng Chart.js 4.x tích hợp AJAX API.",
                ProjectId = project.Id,
                AssigneeId = employee.Id,
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-8),
                DueDate = DateTime.UtcNow.AddDays(5),
                EstimatedHours = 12,
                LoggedHours = 7,
                CreatedBy = teamLead.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            };

            var taskInProgress2 = new TaskItem
            {
                Id = Guid.Parse("b3333333-b333-b333-b333-b33333333333"),
                Code = "T-003",
                Title = "Xây dựng module Kanban",
                Description = "Phát triển trang Kanban với tính năng kéo thả SortableJS.",
                ProjectId = project.Id,
                AssigneeId = employee.Id,
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-5),
                DueDate = DateTime.UtcNow.AddDays(8),
                EstimatedHours = 20,
                LoggedHours = 8,
                CreatedBy = teamLead.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            };

            var taskTodo1 = new TaskItem
            {
                Id = Guid.Parse("b4444444-b444-b444-b444-b44444444444"),
                Code = "T-004",
                Title = "Code trang Chat nội bộ",
                Description = "Xây dựng giao diện chat với channels và Direct Messaging.",
                ProjectId = project.Id,
                AssigneeId = employee.Id,
                Status = TaskStatus.Todo,
                Priority = TaskPriority.Medium,
                StartDate = DateTime.UtcNow.AddDays(5),
                DueDate = DateTime.UtcNow.AddDays(15),
                EstimatedHours = 14,
                LoggedHours = 0,
                CreatedBy = teamLead.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            };

            var taskTodo2 = new TaskItem
            {
                Id = Guid.Parse("b5555555-b555-b555-b555-b55555555555"),
                Code = "T-005",
                Title = "Viết tài liệu API v2",
                Description = "Cập nhật tài liệu OpenAPI/Swagger cho phiên bản v2.",
                ProjectId = project.Id,
                AssigneeId = teamLead.Id,
                Status = TaskStatus.Todo,
                Priority = TaskPriority.Low,
                StartDate = DateTime.UtcNow.AddDays(10),
                DueDate = DateTime.UtcNow.AddDays(20),
                EstimatedHours = 8,
                LoggedHours = 0,
                CreatedBy = manager.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            var taskReview = new TaskItem
            {
                Id = Guid.Parse("b6666666-b666-b666-b666-b66666666666"),
                Code = "T-006",
                Title = "Review code Pull Request #42",
                Description = "Review PR về tính năng Time Tracking và SignalR integration.",
                ProjectId = project.Id,
                AssigneeId = teamLead.Id,
                Status = TaskStatus.Review,
                Priority = TaskPriority.Medium,
                StartDate = DateTime.UtcNow.AddDays(-1),
                DueDate = DateTime.UtcNow.AddDays(1),
                EstimatedHours = 3,
                LoggedHours = 2,
                CreatedBy = employee.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            context.Tasks.AddRange(taskDone, taskInProgress1, taskInProgress2, taskTodo1, taskTodo2, taskReview);
            context.SaveChanges();

            // 4. Seed Subtasks & Comments
            var subtasks = new[]
            {
                new Subtask { Id = Guid.NewGuid(), TaskId = taskDone.Id, Title = "Wireframe dashboard", Done = true, CreatedAt = DateTime.UtcNow.AddDays(-25) },
                new Subtask { Id = Guid.NewGuid(), TaskId = taskDone.Id, Title = "Mockup high-fidelity", Done = true, CreatedAt = DateTime.UtcNow.AddDays(-20) },
                new Subtask { Id = Guid.NewGuid(), TaskId = taskDone.Id, Title = "Export UI assets", Done = true, CreatedAt = DateTime.UtcNow.AddDays(-15) },
                new Subtask { Id = Guid.NewGuid(), TaskId = taskInProgress1.Id, Title = "Biểu đồ tròn trạng thái task", Done = true, CreatedAt = DateTime.UtcNow.AddDays(-7) },
                new Subtask { Id = Guid.NewGuid(), TaskId = taskInProgress1.Id, Title = "Biểu đồ cột activity", Done = false, CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new Subtask { Id = Guid.NewGuid(), TaskId = taskInProgress1.Id, Title = "Kết nối API Backend", Done = false, CreatedAt = DateTime.UtcNow.AddDays(-3) }
            };
            context.Subtasks.AddRange(subtasks);

            var comments = new[]
            {
                new Comment { Id = Guid.NewGuid(), TaskId = taskDone.Id, UserId = manager.Id, Text = "Thiết kế mượt và đúng chuẩn Notion, approve nhé!", CreatedAt = DateTime.UtcNow.AddDays(-12) },
                new Comment { Id = Guid.NewGuid(), TaskId = taskDone.Id, UserId = teamLead.Id, Text = "Cảm ơn anh, em đã bàn giao asset cho team dev.", CreatedAt = DateTime.UtcNow.AddDays(-11) }
            };
            context.Comments.AddRange(comments);
            context.SaveChanges();

            // 5. Seed Request & 4-Level Approval Chain
            var request = new Request
            {
                Id = Guid.Parse("c1111111-c111-c111-c111-c11111111111"),
                Type = RequestType.Leave,
                Title = "Xin nghỉ phép 2 ngày",
                Description = "Nghỉ phép cá nhân từ 15/7 đến 16/7/2026 theo kế hoạch gia đình.",
                RequesterId = employee.Id,
                Status = RequestStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            };
            context.Requests.Add(request);
            context.SaveChanges();

            var approvals = new[]
            {
                new Approval
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    Level = 1,
                    Role = "team_lead",
                    ApproverId = teamLead.Id,
                    Status = ApprovalStatus.Approved,
                    Note = "Đã sắp xếp người thay thế công việc, đồng ý.",
                    UpdatedAt = DateTime.UtcNow.AddDays(-6)
                },
                new Approval
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    Level = 2,
                    Role = "manager",
                    ApproverId = manager.Id,
                    Status = ApprovalStatus.Approved,
                    Note = "Duyệt theo hạn mức phòng ban.",
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Approval
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    Level = 3,
                    Role = "manager",
                    ApproverId = manager.Id,
                    Status = ApprovalStatus.Approved,
                    Note = "Xác nhận duyệt cấp 3.",
                    UpdatedAt = DateTime.UtcNow.AddDays(-4)
                },
                new Approval
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    Level = 4,
                    Role = "director",
                    ApproverId = director.Id,
                    Status = ApprovalStatus.Approved,
                    Note = "Ban giám đốc phê duyệt cấp cuối.",
                    UpdatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };
            context.Approvals.AddRange(approvals);
            context.SaveChanges();
        }
    }
}
