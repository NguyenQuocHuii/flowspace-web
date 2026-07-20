using System.Reflection;
using FlowSpace.Application.Behaviors;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace FlowSpace.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            services.AddAutoMapper(Assembly.GetExecutingAssembly());
            services.AddScoped<FlowSpace.Application.Interfaces.IProjectService, FlowSpace.Application.Services.ProjectService>();
            services.AddScoped<FlowSpace.Application.Interfaces.ITaskService, FlowSpace.Application.Services.TaskService>();
            services.AddScoped<FlowSpace.Application.Interfaces.ITimeLogService, FlowSpace.Application.Services.TimeLogService>();
            services.AddScoped<FlowSpace.Application.Interfaces.IWorkflowService, FlowSpace.Application.Services.WorkflowService>();
            services.AddScoped<FlowSpace.Application.Interfaces.IDashboardService, FlowSpace.Application.Services.DashboardService>();
            return services;
        }
    }
}
