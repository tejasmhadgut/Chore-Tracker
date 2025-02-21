using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Models
{
    public class LoginModel
    {
        [Required]
        public string UserName {get; set;}

        [Required, MinLength(6)]
        public string Password {get; set;}
    }
}