using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Models
{
    public class Group
    {
        [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(32)]
    public string InviteCode { get; set; } = Guid.NewGuid().ToString("N");

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime createdAt { get; set; } = DateTime.UtcNow;  // PascalCase

    [Required]
    public string CreatorId { get; set; } = string.Empty; // User ID of the group creator

    [ForeignKey("CreatorId")]
    public virtual ApplicationUser? Creator { get; set; }

    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<Chore> Chores { get; set; } = new List<Chore>();
    }
}