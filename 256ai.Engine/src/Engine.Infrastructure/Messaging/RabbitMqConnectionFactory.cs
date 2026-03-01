using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Engine.Infrastructure.Messaging;

/// <summary>
/// Manages RabbitMQ connection lifecycle
/// </summary>
public class RabbitMqConnectionFactory : IDisposable
{
    private readonly RabbitMqConfig _config;
    private IConnection? _connection;
    private readonly object _lock = new();

    public RabbitMqConnectionFactory(IOptions<RabbitMqConfig> config)
    {
        _config = config.Value;
    }

    public IConnection GetConnection()
    {
        if (_connection is { IsOpen: true })
            return _connection;

        lock (_lock)
        {
            if (_connection is { IsOpen: true })
                return _connection;

            var factory = new ConnectionFactory
            {
                HostName = _config.HostName,
                Port = _config.Port,
                UserName = _config.UserName,
                Password = _config.Password,
                VirtualHost = _config.VirtualHost,
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
            };

            _connection = factory.CreateConnection();
            return _connection;
        }
    }

    public IModel CreateChannel()
    {
        return GetConnection().CreateModel();
    }

    public void Dispose()
    {
        _connection?.Close();
        _connection?.Dispose();
    }
}
