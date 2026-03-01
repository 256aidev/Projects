namespace Engine.Worker;

public class WorkerConfig
{
    // Identity
    public string WorkerId { get; set; } = $"worker-{Environment.MachineName.ToLower()}-001";
    public List<string> Domains { get; set; } = new() { "general" };
    public int MaxConcurrentTasks { get; set; } = 5;
    public int HeartbeatIntervalSeconds { get; set; } = 20;

    // Functional role: what this worker does in the swarm (e.g. "coder", "lead", "ios-frontend")
    public string Role { get; set; } = "general";

    // Execution provider: "claude-code" | "claude-api" | "ollama"
    public string Provider { get; set; } = "claude-code";

    // Claude Code CLI settings (Provider = "claude-code")
    // If ClaudeCodePath is "claude", it's called directly (Linux/Mac or PATH setup)
    // If ClaudeCodePath is a path to cli.js, NodePath is used to run it
    public string ClaudeCodePath { get; set; } = "claude";
    public string NodePath { get; set; } = "";  // e.g. "C:\Program Files\nodejs\node.exe" (Windows only)
    public int MaxTurns { get; set; } = 50;

    // Ollama settings (Provider = "ollama")
    public string OllamaUrl { get; set; } = "http://localhost:11434";
    public string OllamaModel { get; set; } = "qwen2.5-coder:32b-instruct-q8_0";

    // Sound generation settings (Provider = "sound-gen")
    public string SoundApiUrl { get; set; } = "http://localhost:5200";

    // General execution settings
    public string DefaultWorkingDirectory { get; set; } = "";
    public int DefaultTimeoutSeconds { get; set; } = 300;
}

public class ClaudeConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "claude-sonnet-4-20250514";
}
