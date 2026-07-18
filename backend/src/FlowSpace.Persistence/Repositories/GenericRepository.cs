using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlowSpace.Domain.Interfaces;
using FlowSpace.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Persistence.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly FlowSpaceDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public GenericRepository(FlowSpaceDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task<T?> GetByIdAsync(object id) => await _dbSet.FindAsync(id);

        public async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();

        public IQueryable<T> GetQueryable() => _dbSet.AsQueryable();

        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

        public void Update(T entity) => _dbSet.Update(entity);

        public void Delete(T entity) => _dbSet.Remove(entity);
    }
}
