using Engine.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace Engine.Infrastructure.Data;

public class EngineDbContext : DbContext
{
    public EngineDbContext(DbContextOptions<EngineDbContext> options) : base(options)
    {
    }

    public DbSet<MessageEntity> Messages => Set<MessageEntity>();
    public DbSet<WorkerHeartbeatEntity> WorkerHeartbeats => Set<WorkerHeartbeatEntity>();
    public DbSet<AppHealthEntity> AppHealth => Set<AppHealthEntity>();
    public DbSet<SyntheticCheckEntity> SyntheticChecks => Set<SyntheticCheckEntity>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();
    public DbSet<EscalationEntity> Escalations => Set<EscalationEntity>();
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<MachineEntity> Machines => Set<MachineEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Messages table
        modelBuilder.Entity<MessageEntity>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MessageType).HasConversion<string>();
            entity.HasIndex(e => e.CorrelationId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.MessageType);
        });

        // Worker heartbeat - WorkerId is PK (latest state only)
        modelBuilder.Entity<WorkerHeartbeatEntity>(entity =>
        {
            entity.ToTable("worker_heartbeat");
            entity.HasKey(e => e.WorkerId);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.LastSeenAt);
        });

        // App health
        modelBuilder.Entity<AppHealthEntity>(entity =>
        {
            entity.ToTable("app_health");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OverallStatus).HasConversion<string>();
            entity.HasIndex(e => new { e.AppId, e.InstanceId }).IsUnique();
            entity.HasIndex(e => e.LastSeenAt);
        });

        // Synthetic checks
        modelBuilder.Entity<SyntheticCheckEntity>(entity =>
        {
            entity.ToTable("synthetic_check");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.ScenarioId);
            entity.HasIndex(e => e.CorrelationId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Tasks - TaskId is PK
        modelBuilder.Entity<TaskEntity>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.TaskId);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.ExecutionMode).HasDefaultValue("auto");
            entity.Property(e => e.RetryCount).HasDefaultValue(0);
            entity.Property(e => e.MaxRetries).HasDefaultValue(3);
            entity.HasIndex(e => e.AssignedWorkerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ParentTaskId);
            entity.HasIndex(e => e.ProjectId);
        });

        // Projects - ProjectId is PK
        modelBuilder.Entity<ProjectEntity>(entity =>
        {
            entity.ToTable("projects");
            entity.HasKey(e => e.ProjectId);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Domain);
        });

        // Escalations
        modelBuilder.Entity<EscalationEntity>(entity =>
        {
            entity.ToTable("escalations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Level).HasConversion<string>();
            entity.Property(e => e.SourceMessageType).HasConversion<string>();
            entity.Property(e => e.Disposition).HasConversion<string>();
            entity.HasIndex(e => e.Disposition);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Machines - connection registry for the swarm
        modelBuilder.Entity<MachineEntity>(entity =>
        {
            entity.ToTable("machines");
            entity.HasKey(e => e.MachineId);
            entity.HasIndex(e => e.IpAddress);
        });
    }
}
