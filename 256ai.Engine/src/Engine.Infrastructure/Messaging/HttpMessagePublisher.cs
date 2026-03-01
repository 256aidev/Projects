using System.Net.Http.Json;
using System.Text.Json;
using Engine.Core.Interfaces;
using Engine.Core.Messages;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Engine.Infrastructure.Messaging;

/// <summary>
/// HTTP-based message publisher - calls Control Plane API directly
/// Use this when RabbitMQ is not available
/// </summary>
public class HttpMessagePublisher : IMessagePublisher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HttpMessagePublisher> _logger;
    private readonly HttpPublisherConfig _config;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public HttpMessagePublisher(
        HttpClient httpClient,
        IOptions<HttpPublisherConfig> config,
        ILogger<HttpMessagePublisher> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _logger = logger;

        _httpClient.BaseAddress = new Uri(_config.ControlPlaneUrl);
    }

    public Task PublishAsync<T>(T message, string routingKey, CancellationToken cancellationToken = default) where T : IMessage
    {
        _logger.LogDebug("HTTP Publisher: {MessageType} would route to {RoutingKey}",
            message.Header.MessageType, routingKey);
        return Task.CompletedTask;
    }

    public Task PublishTaskAsync(TaskMessage task, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("PublishTaskAsync not implemented for HTTP publisher");
        return Task.CompletedTask;
    }

    public Task PublishTaskResultAsync(TaskResultMessage result, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("PublishTaskResultAsync not implemented for HTTP publisher");
        return Task.CompletedTask;
    }

    public async Task PublishHeartbeatAsync(AgentHeartbeat heartbeat, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            workerId = heartbeat.WorkerId,
            status = heartbeat.Status?.Status.ToString() ?? "OK",
            lastTaskId = heartbeat.LastTaskId,
            version = heartbeat.Version?.WorkerVersion ?? "1.0.0",
            role = heartbeat.Role,
            provider = heartbeat.Provider,
            ipAddress = heartbeat.IpAddress,
            capacity = new
            {
                maxConcurrent = heartbeat.Capacity?.MaxConcurrentTasks ?? 5,
                currentInflight = heartbeat.Capacity?.CurrentInflight ?? 0,
                domains = heartbeat.Capacity?.DomainCapabilities ?? new List<string> { "general" }
            }
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/health/heartbeat", payload, _jsonOptions, cancellationToken);
            response.EnsureSuccessStatusCode();

            _logger.LogDebug("Heartbeat sent for {WorkerId}", heartbeat.WorkerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send heartbeat for {WorkerId}", heartbeat.WorkerId);
            throw;
        }
    }

    public Task PublishAppHealthAsync(AppHealthStatus health, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("PublishAppHealthAsync not implemented for HTTP publisher");
        return Task.CompletedTask;
    }

    public Task PublishSyntheticCheckAsync(SyntheticCheckResult check, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("PublishSyntheticCheckAsync not implemented for HTTP publisher");
        return Task.CompletedTask;
    }

    public Task PublishEscalationAsync(EscalationMessage escalation, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("PublishEscalationAsync not implemented for HTTP publisher");
        return Task.CompletedTask;
    }
}

/// <summary>
/// Configuration for HTTP-based publisher
/// </summary>
public class HttpPublisherConfig
{
    public string ControlPlaneUrl { get; set; } = "http://localhost:5100";
}
