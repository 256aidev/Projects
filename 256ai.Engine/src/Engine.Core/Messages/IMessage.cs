using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// Base interface for all messages
/// </summary>
public interface IMessage
{
    HDR Header { get; }
    CTX Context { get; }
    AUD Audit { get; }
}
