using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Models
{
    public class GroupMember
    {
        [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }  // Primary key
    public int GroupId { get; set; }
    public string UserId { get; set; }
    
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; }
    
    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}