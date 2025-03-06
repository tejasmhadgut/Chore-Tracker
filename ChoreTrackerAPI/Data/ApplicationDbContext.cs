using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Data
{
    public class ApplicationDbContext: IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
            
        }
        
        public DbSet<Chore> Chores {get;set;}
        public DbSet<ChoreCompletion> ChoreCompletion {get;set;}
        public DbSet<Group> Groups {get;set;}
        public DbSet<GroupMember> GroupMember {get;set;}
    }
}