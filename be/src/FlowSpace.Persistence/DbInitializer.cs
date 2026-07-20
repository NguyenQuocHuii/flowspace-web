using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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
            try
            {
                // Xóa sạch dữ liệu cũ để tránh trùng lặp email và tài khoản rác
                context.TimeLogs.ExecuteDelete();
                context.Subtasks.ExecuteDelete();
                context.Comments.ExecuteDelete();
                context.ChatMessages.ExecuteDelete();
                context.ChatChannels.ExecuteDelete();
                context.Approvals.ExecuteDelete();
                context.Requests.ExecuteDelete();
                context.Tasks.ExecuteDelete();
                context.Projects.ExecuteDelete();
                context.WorkflowRules.ExecuteDelete();
                
                // Xóa các Token liên quan
                context.EmailVerificationTokens.ExecuteDelete();
                context.PasswordResetTokens.ExecuteDelete();
                context.UserRefreshTokens.ExecuteDelete();
                context.AuditLogs.ExecuteDelete();
                context.Documents.ExecuteDelete();
                
                // Xóa Users
                context.Users.ExecuteDelete();
                context.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Lỗi dọn dẹp database trước khi seed: {ex.Message}");
            }

            try
            {
                // 1. Tạo 1 User Admin duy nhất bằng code ngắn gọn
                string defaultPasswordHash = "$2a$11$9Q0c4Y1wVp0d1HqLd5S8OeWzE1V0d1HqLd5S8OeWzE1V0d1HqLd5S"; // "123456"
                var admin = new User
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Phạm Thanh Dung",
                    Email = "admin@flowspace.demo",
                    PasswordHash = defaultPasswordHash,
                    Role = "director",
                    Avatar = "PD",
                    Color = "#e74c3c",
                    Department = "Ban giám đốc",
                    Position = "Giám đốc điều hành",
                    Active = true,
                    IsEmailVerified = true,
                    EmailVerifiedAt = DateTime.UtcNow,
                    JoinDate = DateTime.UtcNow
                };
                context.Users.Add(admin);
                context.SaveChanges();

                // 2. Tự sinh 5 dự án bằng vòng lặp ngắn gọn để dung lượng compile siêu nhỏ
                var projects = new List<Project>();
                for (int i = 1; i <= 5; i++)
                {
                    var proj = new Project
                    {
                        Id = Guid.Parse($"{i}0{i}0{i}0{i}0-{i}0{i}0-{i}0{i}0-{i}0{i}0-{i}0{i}0{i}0{i}0{i}0{i}0"),
                        Code = $"PROJ-00{i}",
                        Name = $"Dự án mẫu FlowSpace 0{i}",
                        Description = $"Mô tả ngắn gọn cho dự án mẫu số 0{i}.",
                        Status = ProjectStatus.Active,
                        Priority = ProjectPriority.High,
                        StartDate = DateTime.UtcNow.AddMonths(-1),
                        EndDate = DateTime.UtcNow.AddMonths(3),
                        OwnerId = admin.Id,
                        CreatedAt = DateTime.UtcNow.AddMonths(-1),
                        Progress = 30
                    };
                    projects.Add(proj);
                }
                context.Projects.AddRange(projects);
                context.SaveChanges();

                // 3. Tự sinh 30 tasks mẫu bằng vòng lặp ngắn gọn
                var tasks = new List<TaskItem>();
                var subtasks = new List<Subtask>();
                var timeLogs = new List<TimeLog>();

                int taskCounter = 1;
                foreach (var proj in projects)
                {
                    for (int j = 1; j <= 6; j++)
                    {
                        var status = (TaskStatus)(j % 4);
                        var task = new TaskItem
                        {
                            Id = Guid.NewGuid(),
                            Code = $"{proj.Code}-T{j}",
                            Title = $"Nhiệm vụ phát triển số {j} của {proj.Code}",
                            Description = $"Mô tả chi tiết cho nhiệm vụ phát triển số {j}.",
                            ProjectId = proj.Id,
                            AssigneeId = admin.Id,
                            Status = status,
                            Priority = TaskPriority.Medium,
                            StartDate = DateTime.UtcNow.AddDays(-10),
                            DueDate = DateTime.UtcNow.AddDays(10),
                            EstimatedHours = 16,
                            CreatedAt = DateTime.UtcNow.AddDays(-10)
                        };
                        tasks.Add(task);

                        subtasks.Add(new Subtask
                        {
                            Id = Guid.NewGuid(),
                            TaskId = task.Id,
                            Title = $"Yêu cầu kiểm thử phụ số {j}",
                            Done = status == TaskStatus.Done,
                            CreatedAt = DateTime.UtcNow
                        });

                        if (status == TaskStatus.InProgress || status == TaskStatus.Done)
                        {
                            timeLogs.Add(new TimeLog
                            {
                                Id = Guid.NewGuid(),
                                TaskId = task.Id,
                                UserId = admin.Id,
                                ProjectId = proj.Id,
                                Hours = 4,
                                Date = DateTime.UtcNow.AddDays(-1),
                                Note = "Ghi nhận giờ làm việc tự động",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                context.Tasks.AddRange(tasks);
                context.Subtasks.AddRange(subtasks);
                context.TimeLogs.AddRange(timeLogs);
                context.SaveChanges();

                // 4. Cập nhật LoggedHours & Progress
                foreach (var task in tasks)
                {
                    task.LoggedHours = timeLogs.Where(tl => tl.TaskId == task.Id).Sum(tl => tl.Hours);
                }
                foreach (var proj in projects)
                {
                    var projTasks = tasks.Where(t => t.ProjectId == proj.Id).ToList();
                    if (projTasks.Any())
                    {
                        var doneTasks = projTasks.Count(t => t.Status == TaskStatus.Done);
                        proj.Progress = (doneTasks * 100) / projTasks.Count;
                    }
                }
                context.SaveChanges();

                Console.WriteLine("=== SEED DATABASE GỌN NHẸ THÀNH CÔNG ===");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Lỗi seed database: {ex.Message}");
            }
        }
    }
}
