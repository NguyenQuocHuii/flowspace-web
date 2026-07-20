using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using FlowSpace.Domain.Interfaces;
using FlowSpace.Persistence.Contexts;
using Microsoft.EntityFrameworkCore.Storage;

namespace FlowSpace.Persistence.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly FlowSpaceDbContext _context;
        private IDbContextTransaction? _transaction;
        private readonly ConcurrentDictionary<string, object> _repositories;

        public UnitOfWork(FlowSpaceDbContext context)
        {
            _context = context;
            _repositories = new ConcurrentDictionary<string, object>();
        }

        public IGenericRepository<T> Repository<T>() where T : class
        {
            var type = typeof(T).Name;
            return (IGenericRepository<T>)_repositories.GetOrAdd(type, _ => new GenericRepository<T>(_context));
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
