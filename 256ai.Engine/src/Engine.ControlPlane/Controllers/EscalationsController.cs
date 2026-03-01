using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Escalation management per 07_ESCALATION_PROTOCOL
/// Every escalation must receive a disposition: Accepted, Rejected (with reason), Deferred (with review date)
/// </summary>
[ApiController]
[Route("escalations")]
public class EscalationsController : ControllerBase
{
    private readonly EngineDbContext _db;

    public EscalationsController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// GET /escalations - List escalations
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListEscalations([FromQuery] string? disposition = null, [FromQuery] int limit = 50)
    {
        var query = _db.Escalations.AsQueryable();

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
            .ToListAsync();

        return Ok(escalations);
    }

    /// <summary>
    /// GET /escalations/{id} - Get escalation details
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEscalation(Guid id)
    {
        var escalation = await _db.Escalations.FirstOrDefaultAsync(e => e.Id == id);

        if (escalation == null)
            return NotFound(new { Error = "Escalation not found", Id = id });

        return Ok(new
        {
            escalation.Id,
            Level = escalation.Level.ToString(),
            SourceMessageType = escalation.SourceMessageType.ToString(),
            escalation.EvidenceJson,
            escalation.Impact,
            escalation.Recommendation,
            Disposition = escalation.Disposition.ToString(),
            escalation.DispositionReason,
            escalation.ReviewDate,
            escalation.CreatedAt
        });
    }

    /// <summary>
    /// PUT /escalations/{id} - Disposition escalation
    /// Per spec: Every escalation must receive a disposition
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> DispositionEscalation(Guid id, [FromBody] DispositionRequest request)
    {
        var escalation = await _db.Escalations.FirstOrDefaultAsync(e => e.Id == id);

        if (escalation == null)
            return NotFound(new { Error = "Escalation not found", Id = id });

        if (!Enum.TryParse<EscalationDisposition>(request.Disposition, true, out var disposition))
        {
            return BadRequest(new { Error = "Invalid disposition. Use: Accepted, Rejected, Deferred" });
        }

        // Rejected requires reason, Deferred requires review date
        if (disposition == EscalationDisposition.Rejected && string.IsNullOrEmpty(request.Reason))
        {
            return BadRequest(new { Error = "Rejected disposition requires a reason" });
        }

        if (disposition == EscalationDisposition.Deferred && !request.ReviewDate.HasValue)
        {
            return BadRequest(new { Error = "Deferred disposition requires a review date" });
        }

        escalation.Disposition = disposition;
        escalation.DispositionReason = request.Reason;
        escalation.ReviewDate = request.ReviewDate;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            escalation.Id,
            Disposition = escalation.Disposition.ToString(),
            escalation.DispositionReason,
            escalation.ReviewDate
        });
    }
}

public record DispositionRequest
{
    public required string Disposition { get; init; }
    public string? Reason { get; init; }
    public DateTimeOffset? ReviewDate { get; init; }
}
