using System.ComponentModel;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Engine.ControlPlane.McpTools;

[McpServerToolType]
public class EscalationTools
{
    [McpServerTool(Name = "list_escalations", ReadOnly = true), Description("List escalations requiring human disposition. Filter by status: Pending, Accepted, Rejected, Deferred.")]
    public static async Task<string> ListEscalations(
        EngineDbContext db,
        [Description("Filter by disposition: Pending, Accepted, Rejected, Deferred")] string? disposition = null,
        [Description("Maximum number of escalations to return (default 20)")] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var query = db.Escalations.AsQueryable();

        if (!string.IsNullOrEmpty(disposition) && Enum.TryParse<EscalationDisposition>(disposition, true, out var dispEnum))
        {
            query = query.Where(e => e.Disposition == dispEnum);
        }

        var escalations = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .Select(e => new
            {
                e.Id,
                Level = e.Level.ToString(),
                SourceMessageType = e.SourceMessageType.ToString(),
                e.Impact,
                e.Recommendation,
                Disposition = e.Disposition.ToString(),
                e.DispositionReason,
                e.ReviewDate,
                e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return JsonSerializer.Serialize(escalations);
    }

    [McpServerTool(Name = "dispose_escalation"), Description("Set the disposition of an escalation: Accepted, Rejected (requires reason), or Deferred (requires reviewDate).")]
    public static async Task<string> DisposeEscalation(
        EngineDbContext db,
        [Description("The escalation ID (GUID)")] string escalationId,
        [Description("Disposition: Accepted, Rejected, or Deferred")] string disposition,
        [Description("Reason for the disposition (required if Rejected)")] string? reason = null,
        [Description("Review date in ISO format (required if Deferred)")] string? reviewDate = null,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(escalationId, out var id))
            return JsonSerializer.Serialize(new { error = "Invalid escalation ID format" });

        var escalation = await db.Escalations.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (escalation == null)
            return JsonSerializer.Serialize(new { error = "Escalation not found", escalationId });

        if (!Enum.TryParse<EscalationDisposition>(disposition, true, out var dispEnum))
            return JsonSerializer.Serialize(new { error = "Invalid disposition. Use: Accepted, Rejected, Deferred" });

        if (dispEnum == EscalationDisposition.Rejected && string.IsNullOrEmpty(reason))
            return JsonSerializer.Serialize(new { error = "Rejected disposition requires a reason" });

        if (dispEnum == EscalationDisposition.Deferred && string.IsNullOrEmpty(reviewDate))
            return JsonSerializer.Serialize(new { error = "Deferred disposition requires a reviewDate" });

        escalation.Disposition = dispEnum;
        escalation.DispositionReason = reason;
        if (!string.IsNullOrEmpty(reviewDate) && DateTimeOffset.TryParse(reviewDate, out var rd))
            escalation.ReviewDate = rd;

        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new
        {
            escalation.Id,
            Disposition = escalation.Disposition.ToString(),
            escalation.DispositionReason,
            escalation.ReviewDate
        });
    }
}
