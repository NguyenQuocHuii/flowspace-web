using FlowSpace.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Persistence.Contexts
{
    public class FlowSpaceDbContext : DbContext
    {
        public FlowSpaceDbContext(DbContextOptions<FlowSpaceDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(FlowSpaceDbContext).Assembly);
        }
    }
}
