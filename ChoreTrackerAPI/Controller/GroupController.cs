using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SendGrid;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/groups")]
    [ApiController]
    public class GroupController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly  IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        public GroupController(ApplicationDbContext context, IEmailService emailService, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _emailService = emailService;
            _userManager = userManager;
        }
        
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] GroupCreateRequest request)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            Console.WriteLine("Is this email?");
            Console.WriteLine(userEmail);
            if(string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User not authenticated");
            }
            var creator = await _userManager.FindByEmailAsync(userEmail);
            if(creator == null)
            {
                return Unauthorized("User not found");
            }
            var group = new Group{
                Name = request.Name,
                InviteCode = Guid.NewGuid().ToString("N"),
            };
            _context.Groups.Add(group);

            var groupMember = new GroupMember
            {
                User = creator,
                Group = group
            };
            _context.GroupMember.Add(groupMember);
            await _context.SaveChangesAsync();
            foreach(var email in request.MemberEmails)
            {
                await _emailService.SendInviteEmailAsync(creator,email,group.InviteCode);
            }
            
            return Ok(new {GroupId = group.Id, InviteCode = group.InviteCode});
            
        }
        [Authorize]
        [HttpPost("get-group")]
        public async Task<IActionResult> GetGroupByInviteCode([FromBody] GetGroupDto request)
        {
            Console.WriteLine(request.InviteCode);

            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                Console.WriteLine("User not authenticated");
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return Unauthorized("User not found");
            }

            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)  // Ensure User is included
                .FirstOrDefaultAsync(g => g.InviteCode == request.InviteCode);

            if (group == null)
            {
                Console.WriteLine("Group not found");
                return NotFound("Group not found");
            }

            var existingUser = await _context.GroupMember
                .FirstOrDefaultAsync(gm => gm.UserId == user.Id && gm.GroupId == group.Id);
    
            if (existingUser != null)
            {
                Console.WriteLine($"User {existingUser.UserId} is already a member of group {existingUser.GroupId}");
                return BadRequest("User is already a member of this group");
            }

            // Ensure Members and Users are not null
            var memberNames = group.Members
            .Where(m => m.User != null)  // Avoid null User
            .Select(m => $"{m.User.FirstName} {m.User.LastName}")
            .ToList();

            return Ok(new
            {
                group.Id,
                group.Name,
                group.Description,
                group.createdAt,
                MemberNames = memberNames
            });
        }

        [Authorize]
        [HttpPost("join")]
        public async Task<IActionResult> JoinGroup([FromBody] GroupJoinRequest request)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if(string.IsNullOrEmpty(userEmail))
            {
                 Console.WriteLine("User not authenticated");
                return Unauthorized("User not authenticated");
            }
            var user = await _userManager.FindByEmailAsync(userEmail);
            if(user==null)
            {
                Console.WriteLine("User not found");
                return Unauthorized("User not found");
            }
            var group = await _context.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == request.groupId);
            if(group == null)
            {
                Console.WriteLine("We dont have group");
                return NotFound("Group not found");
            }
            Console.WriteLine("already in now group");
            var existingUser = await _context.GroupMember.FirstOrDefaultAsync(gm => gm.UserId == user.Id && gm.GroupId == group.Id);
            if(existingUser != null)
            {
                Console.WriteLine("already in group");
                return BadRequest("User is already a member of this group");
            }
            var groupMember = new GroupMember {User = user, Group = group};
            _context.GroupMember.Add(groupMember);
            await _context.SaveChangesAsync();

            return Ok(new {GroupId = group.Id});
        }
        [Authorize]
        [HttpGet("my-groups")]
        public async Task<IActionResult> GetUserGroups()
        {
            var token = Request.Cookies["authToken"];
            
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized("User not authenticated. Token is missing.");
            }
            
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            //var userEmail = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            Console.WriteLine(userEmail);
            if(string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User not authenticated");
            }
            Console.WriteLine("email here"+userEmail);

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {   
                return Unauthorized("User not found");
            }
            var groups = await _context.GroupMember.Where(gm => gm.UserId == user.Id).Include(gm => gm.Group).ThenInclude(g=>g.Members).Select(gm=>
            new GroupDto 
            {
                Id = gm.Group.Id,
                Name = gm.Group.Name,
                Description = gm.Group.Description,
                CreatedAt = gm.Group.createdAt,
                MemberNames = gm.Group.Members.Select(m=>$"{m.User.FirstName} {m.User.LastName}").ToList()
            }
            ).ToListAsync();
            Console.WriteLine(groups);
            return Ok(groups);
        }

        [Authorize]
        [HttpGet("group-details/{groupId}")]
        public async Task<IActionResult> GetGroupDetails(int groupId)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                return Unauthorized("User not found");
            }

            var group = await _context.Groups
                .Include(g => g.Members).ThenInclude(gm => gm.User)
                .Include(g => g.Chores)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                return NotFound("Group not found");
            }

            var isMember = group.Members.Any(m => m.UserId == user.Id);
            if (!isMember)
            {
                return Forbid("User is not a member of this group");
            }

            var response = new
            {
                GroupId = group.Id,
                Name = group.Name,
                InviteCode = group.InviteCode,
                Members = group.Members.Select(m => new
                {
                    Id = m.User.Id,
                    Email = m.User.Email,
                    Name = m.User.UserName // or any other member properties you want
                }),
                Chores = group.Chores.Select(c => new
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    status = c.status,
                    RecurrenceType = c.Recurrence,
                    IntervalTypes = c.IntervalDays,
                    NextOccurence = c.NextOccurence
                    
            })
            };

            return Ok(response); // Fixed this to use the correct object reference
        }

        [Authorize]
        [HttpPost("leave/{groupId}")]
        public async Task<IActionResult> LeaveGroup(int groupId)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                return Unauthorized("User not found");
            }

            var groupMember = await _context.GroupMember.FirstOrDefaultAsync(gm => gm.UserId == user.Id && gm.GroupId == groupId);
            if (groupMember == null)
            {
                return NotFound("You are not a member of this group");
            }

            _context.GroupMember.Remove(groupMember);
            await _context.SaveChangesAsync();

            return Ok("Successfully left the group");
        }
        [Authorize]
        [HttpDelete("delete/{groupId}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                return Unauthorized("User not found");
            }
            var group = await _context.Groups.Include(g=>g.Members).Include(g=>g.Chores).FirstOrDefaultAsync(g=>g.Id==groupId);
            if(group==null)
            {
                return NotFound("Group not found");
            }
            var isCreator = group.Members.Any(m=>m.UserId == user.Id);
            if(!isCreator)
            {
                return Unauthorized("Only the creator can delete this group");
            }
            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();
            return Ok("Group deleted successfully");
        }

        [Authorize]
        [HttpGet("{groupId}/leaderboard")]
        public async Task<IActionResult> GetLeaderboard(int groupId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Validate date range
            if (endDate < startDate)
            {
                return BadRequest("Invalid date range");
            }

            // Get all chore completions in the given time period for the group
            var completions = await _context.ChoreCompletion
                .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                .Include(cc => cc.Chore)  // Include chore details
                .Include(cc => cc.User)   // Include user details
                .ToListAsync();

            // Total completions in the group
            int totalCompletions = completions.Count;

            if (totalCompletions == 0)
            {
                return Ok(new { message = "No chore completions in this period", leaderboard = new List<object>(), completedChores = new List<object>() });
            }

            // Count completions per user
            var userCompletionCounts = completions
                .GroupBy(cc => cc.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    UserName = g.First().User.UserName, // Assuming User has a UserName property
                    CompletionCount = g.Count(),
                    ContributionPercentage = Math.Round((g.Count() / (double)totalCompletions) * 100, 2) // Percentage
                })
                .OrderByDescending(g => g.CompletionCount)
                .ToList();

            // List of all completed chores
            var completedChores = completions
                .GroupBy(cc => cc.ChoreId)
                .Select(g => new
                {
                    ChoreName = g.First().Chore.Name,
                    ChoreDescription = g.First().Chore.Description,
                    CompletedBy = g.Select(cc => new { cc.User.UserName, cc.CompletedOn }).ToList()
                })
                .ToList();

            return Ok(new
            {
                leaderboard = userCompletionCounts,
                completedChores = completedChores
            });
        }


        
    }

}