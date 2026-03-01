using System.Net;
using System.Net.Sockets;
using Engine.Core.Enums;
using Engine.Core.Interfaces;
using Engine.Core.Messages;
using Engine.Core.Segments;
using Microsoft.Extensions.Options;

namespace Engine.Worker.Services;

/// <summary>
/// Emits AHE (Agent Heartbeat) messages on a fixed interval per spec
/// "This worker/process is alive and here is its current capacity."
/// </summary>
public class HeartbeatService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly WorkerConfig _config;
    private readonly ClaudeConfig _claudeConfig;
    private readonly ILogger<HeartbeatService> _logger;
    private readonly TaskTrackerService _taskTracker;
    private readonly DateTime _startTime = DateTime.UtcNow;
    private readonly string? _lanIpAddress;
    private readonly string _providerDisplay;

    public HeartbeatService(
        IServiceScopeFactory scopeFactory,
        IOptions<WorkerConfig> config,
        IOptions<ClaudeConfig> claudeConfig,
        ILogger<HeartbeatService> logger,
        TaskTrackerService taskTracker)
    {
        _scopeFactory = scopeFactory;
        _config = config.Value;
        _claudeConfig = claudeConfig.Value;
        _logger = logger;
        _taskTracker = taskTracker;
        _lanIpAddress = ResolveLanIp();
        _providerDisplay = BuildProviderDisplay();
    }

    private string BuildProviderDisplay()
    {
        var provider = _config.Provider;
        if (provider == "ollama")
        {
            // "qwen2.5-coder:32b-instruct-q8_0" → "qwen-code 32b"
            var model = _config.OllamaModel ?? "unknown";
            var friendly = model.Contains("qwen") ? "qwen-code" :
                           model.Contains("llama") ? "llama" :
                           model.Split(':')[0];
            if (model.Contains("32b")) friendly += " 32b";
            else if (model.Contains("14b")) friendly += " 14b";
            else if (model.Contains("7b")) friendly += " 7b";
            return friendly;
        }
        else if (provider == "claude-code" || provider == "claude-api")
        {
            // "claude-sonnet-4-5-20250929" → "sonnet-4.5"
            var model = _claudeConfig.Model ?? "";
            if (model.Contains("sonnet-4-5")) return "sonnet-4.5";
            if (model.Contains("sonnet-4-2")) return "sonnet-4";
            if (model.Contains("opus-4-6")) return "opus-4.6";
            if (model.Contains("haiku-4-5")) return "haiku-4.5";
            if (model.Contains("sonnet")) return "sonnet";
            if (model.Contains("opus")) return "opus";
            return provider;
        }
        else if (provider == "sound-gen")
        {
            return "sound-engine";
        }
        return provider;
    }

    private static string? ResolveLanIp()
    {
        try
        {
            using var socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            socket.Connect("8.8.8.8", 80);
            return (socket.LocalEndPoint as IPEndPoint)?.Address.ToString();
        }
        catch
        {
            return null;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Heartbeat service started for worker {WorkerId}", _config.WorkerId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EmitHeartbeat();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to emit heartbeat");
            }

            await Task.Delay(TimeSpan.FromSeconds(_config.HeartbeatIntervalSeconds), stoppingToken);
        }
    }

    private async Task EmitHeartbeat()
    {
        using var scope = _scopeFactory.CreateScope();
        var publisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

        var now = DateTimeOffset.UtcNow;
        var uptimeSeconds = (long)(DateTime.UtcNow - _startTime).TotalSeconds;

        var heartbeat = new AgentHeartbeat
        {
            Header = new HDR
            {
                MessageId = Guid.NewGuid(),
                MessageType = MessageType.AHE,
                Timestamp = now
            },
            Context = new CTX
            {
                Source = _config.WorkerId,
                Destination = "controlplane",
                Domain = string.Join(",", _config.Domains)
            },
            Audit = new AUD
            {
                CreatedBy = _config.WorkerId,
                CreatedAt = now
            },
            Status = new STA
            {
                Status = Status.OK,
                Reason = "Operational"
            },
            Capacity = new CAP
            {
                MaxConcurrentTasks = _config.MaxConcurrentTasks,
                CurrentInflight = _taskTracker.CurrentInflight,
                DomainCapabilities = _config.Domains
            },
            Version = new VER
            {
                WorkerVersion = "1.0.0",
                ModelId = "claude-sonnet-4-20250514",
                UptimeSeconds = uptimeSeconds
            },
            WorkerId = _config.WorkerId,
            LastTaskId = _taskTracker.LastTaskId,
            Role = _config.Role,
            Provider = _providerDisplay,
            IpAddress = _lanIpAddress,
            EmittedAt = now
        };

        await publisher.PublishHeartbeatAsync(heartbeat);
        _logger.LogDebug("Heartbeat emitted: {WorkerId} - {Inflight}/{Max} tasks",
            _config.WorkerId, _taskTracker.CurrentInflight, _config.MaxConcurrentTasks);
    }
}
