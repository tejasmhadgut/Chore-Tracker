using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Models
{
    public class RegisterModel
    {
        [Required]
        public string UserName {get; set;}

        [Required]
        public string Email {get; set;}

        [Required, MinLength(6)]
        public string Password {get; set;}
        [Required]
        public string FirstName {get;set;}
        [Required]
        public string LastName {get; set;}
    }
}