using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace ChoreTrackerAPI.Models
{
    public class ApplicationUser: IdentityUser
    {
    
    [Required]
    [ProtectedPersonalData]
    public string FirstName { get; set; }

    [Required]
    [ProtectedPersonalData]
    public string LastName { get; set; }

    public string? ProfilePictureUrl {get; set;}
    }
}