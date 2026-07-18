using System;
using System.Linq;
using FlowSpace.Domain.Entities;
using FlowSpace.Persistence.Contexts;

namespace FlowSpace.Persistence
{
    public static class DbInitializer
    {
        public static void Initialize(FlowSpaceDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any())
            {
                return; // DB has been seeded
            }

            var users = new[]
            {
                new User
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Phạm Thanh Dung",
                    Email = "admin@flowspace.demo",
                    PasswordHash = "123456",
                    Role = "director",
                    Avatar = "PD",
                    Color = "var(--fs-accent)",
                    Department = "Ban giám đốc",
                    Position = "Giám đốc",
                    Active = true,
                    JoinDate = DateTime.UtcNow
                },
                new User
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
                    JoinDate = DateTime.UtcNow
                },
                new User
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
                    JoinDate = DateTime.UtcNow
                },
                new User
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
                    JoinDate = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}
