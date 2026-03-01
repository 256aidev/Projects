using Engine.Infrastructure;
using Engine.Worker;
using Engine.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

// Support --config <path> to load a custom appsettings file (for multi-worker machines)
var configArg = args.SkipWhile(a => a != "--config").Skip(1).FirstOrDefault();
if (configArg != null && File.Exists(configArg))
{
    builder.Configuration.AddJsonFile(Path.GetFullPath(configArg), optional: false, reloadOnChange: false);
    Console.WriteLine($"Loaded config: {configArg}");
}

// Configure worker settings
builder.Services.Configure<WorkerConfig>(builder.Configuration.GetSection("Worker"));
builder.Services.Configure<ClaudeConfig>(builder.Configuration.GetSection("Claude"));

// Add Engine infrastructure with HTTP (no RabbitMQ required)
builder.Services.AddEngineInfrastructureHttp(builder.Configuration);

// Add HttpClient for API calls
builder.Services.AddHttpClient();

// Add worker services
builder.Services.AddSingleton<TaskTrackerService>();
builder.Services.AddHostedService<HeartbeatService>();
builder.Services.AddHostedService<TaskPollingService>(); // Poll for tasks and execute via configured provider

var host = builder.Build();

Console.WriteLine("Worker starting with HTTP-based messaging...");
Console.WriteLine("Control Plane: " + (builder.Configuration["ControlPlane:ControlPlaneUrl"] ?? "http://localhost:5100"));

host.Run();
