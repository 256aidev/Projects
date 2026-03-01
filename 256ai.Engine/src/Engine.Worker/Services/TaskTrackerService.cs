namespace Engine.Worker.Services;

/// <summary>
/// Tracks current task execution state for heartbeat reporting
/// </summary>
public class TaskTrackerService
{
    private int _currentInflight;
    private string? _lastTaskId;
    private readonly object _lock = new();

    public int CurrentInflight
    {
        get { lock (_lock) return _currentInflight; }
    }

    public string? LastTaskId
    {
        get { lock (_lock) return _lastTaskId; }
    }

    public void TaskStarted(string taskId)
    {
        lock (_lock)
        {
            _currentInflight++;
            _lastTaskId = taskId;
        }
    }

    public void TaskCompleted(string taskId)
    {
        lock (_lock)
        {
            _currentInflight = Math.Max(0, _currentInflight - 1);
            _lastTaskId = taskId;
        }
    }
}
