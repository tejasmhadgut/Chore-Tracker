using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoreTrackerAPI.Models
{
    public enum NotificationType
    {
        ChoreReminder = 0,      // Chore is due soon
        ChoreOverdue = 1,       // Chore is overdue
        ChoreCompleted = 2,     // Someone completed a chore (team activity)
        ChoreAssigned = 3       // Future: Chore assigned to you
    }

    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }  // Who receives this notification

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }

        [Required]
        public NotificationType Type { get; set; }

        [Required]
        [StringLength(500)]
        public string Message { get; set; } = string.Empty;  // e.g., "John completed 'Clean Kitchen'"

        // Optional: Link to related entities
        public int? ChoreId { get; set; }

        [ForeignKey("ChoreId")]
        public virtual Chore? Chore { get; set; }

        public int GroupId { get; set; }

        [ForeignKey("GroupId")]
        public virtual Group Group { get; set; }

        // Optional: Who triggered this notification (e.g., who completed the chore)
        public string? ActorUserId { get; set; }

        [ForeignKey("ActorUserId")]
        public virtual ApplicationUser? Actor { get; set; }

        public bool IsRead { get; set; } = false;

        [Column(TypeName = "timestamp with time zone")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "timestamp with time zone")]
        public DateTime? ReadAt { get; set; }
    }
}
