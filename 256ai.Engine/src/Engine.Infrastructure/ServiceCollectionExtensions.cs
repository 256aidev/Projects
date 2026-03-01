using Engine.Core.Interfaces;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Engine.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEngineInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database - SQLite for simplicity
        var connectionString = configuration.GetConnectionString("EngineDb") ?? "Data Source=engine.db";
        services.AddDbContext<EngineDbContext>(options =>
            options.UseSqlite(connectionString));

        // RabbitMQ (optional - will gracefully degrade if not available)
        services.Configure<RabbitMqConfig>(configuration.GetSection("RabbitMQ"));
        services.AddSingleton<RabbitMqConnectionFactory>();
        services.AddSingleton<RabbitMqSetup>();
        services.AddScoped<IMessagePublisher, RabbitMqPublisher>();
        services.AddScoped<IMessageConsumer, RabbitMqConsumer>();

        return services;
    }

    /// <summary>
    /// Add infrastructure with HTTP-based publisher (no RabbitMQ required)
    /// </summary>
    public static IServiceCollection AddEngineInfrastructureHttp(this IServiceCollection services, IConfiguration configuration)
    {
        // Database - SQLite for simplicity
        var connectionString = configuration.GetConnectionString("EngineDb") ?? "Data Source=engine.db";
        services.AddDbContext<EngineDbContext>(options =>
            options.UseSqlite(connectionString));

        // HTTP Publisher configuration
        services.Configure<HttpPublisherConfig>(configuration.GetSection("ControlPlane"));

        // Register HttpClient for the publisher
        services.AddHttpClient<IMessagePublisher, HttpMessagePublisher>();

        return services;
    }

    public static void InitializeRabbitMq(this IServiceProvider serviceProvider)
    {
        var setup = serviceProvider.GetRequiredService<RabbitMqSetup>();
        setup.Initialize();
    }
}
