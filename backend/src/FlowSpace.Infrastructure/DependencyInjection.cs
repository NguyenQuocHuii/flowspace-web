using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FlowSpace.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Redis cache setup
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Redis");
            });

            services.AddTransient<FlowSpace.Application.Interfaces.IJwtTokenGenerator, FlowSpace.Infrastructure.Services.JwtTokenGenerator>();

            return services;
        }
    }
}
