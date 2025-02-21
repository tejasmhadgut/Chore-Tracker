using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/Chores")]
    [ApiController]
    public class ChoreController: ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        public ChoreController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateChore([FromBody] CreateChoreDto choreDto)
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

            var group = await _context.Groups.Include(g => g.Members)
                                            .FirstOrDefaultAsync(g => g.Id == choreDto.GroupId);
            if (group == null)
            {
                return NotFound("Group not found");
            }

            // Check if the user is a member of the group
            if (!group.Members.Any(m => m.UserId == user.Id))
            {
                return Forbid("You are not a member of this group");
            }

            var chore = new Chore
            {
                Name = choreDto.Name,
                Description = choreDto.Description,
                DueDate = choreDto.DueDate,
                Group = group
            };

            _context.Chores.Add(chore);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Chore created successfully", ChoreId = chore.Id });
        }
        [Authorize]
        [HttpGet("group/{groupId}")]
        public async Task<IActionResult> GetChoresByGroup(int groupId)
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

            var group = await _context.Groups.Include(g => g.Members)
                                            .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                return NotFound("Group not found");
            }

            // Check if the user is a member of the group
            if (!group.Members.Any(m => m.UserId == user.Id))
            {
                return Forbid("You are not a member of this group");
            }

            var chores = await _context.Chores.Where(c => c.Group.Id == groupId)
                                            .Select(c => new
                                            {
                                                c.Id,
                                                c.Name,
                                                c.Description,
                                                c.DueDate
                                            }).ToListAsync();

            return Ok(chores);
        }

        [Authorize]
        [HttpGet("{choreId}")]
        public async Task<IActionResult> GetChoreById(int choreId)
        {
            var chore = await _context.Chores.Include(c => c.Group)
                                            .FirstOrDefaultAsync(c => c.Id == choreId);
            if (chore == null)
            {
                return NotFound("Chore not found");
            }

            var response = new
            {
                chore.Id,
                chore.Name,
                chore.Description,
                chore.DueDate,
                GroupId = chore.Group.Id
            };

            return Ok(response);
        }
        [Authorize]
        [HttpPut("update/{choreId}")]
        public async Task<IActionResult> UpdateChore(int choreId, [FromBody] UpdateChoreDto choreDto)
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

            var chore = await _context.Chores.Include(c => c.Group)
                                            .ThenInclude(g => g.Members)
                                            .FirstOrDefaultAsync(c => c.Id == choreId);

            if (chore == null)
            {
                return NotFound("Chore not found");
            }

            // Check if the user is a member of the group
            if (!chore.Group.Members.Any(m => m.UserId == user.Id))
            {
                return Forbid("You are not a member of this group");
            }

            chore.Name = choreDto.Name;
            chore.Description = choreDto.Description;
            chore.DueDate = choreDto.DueDate;

            _context.Chores.Update(chore);
            await _context.SaveChangesAsync();

            return Ok("Chore updated successfully");
        }

        [Authorize]
        [HttpDelete("delete/{choreId}")]
        public async Task<IActionResult> DeleteChore(int choreId)
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

            var chore = await _context.Chores.Include(c => c.Group)
                                            .ThenInclude(g => g.Members)
                                            .FirstOrDefaultAsync(c => c.Id == choreId);
            if (chore == null)
            {
                return NotFound("Chore not found");
            }

            // Check if the user is a member of the group
            if (!chore.Group.Members.Any(m => m.UserId == user.Id))
            {
                return Forbid("You are not a member of this group");
            }

            _context.Chores.Remove(chore);
            await _context.SaveChangesAsync();

            return Ok("Chore deleted successfully");
        }
        [Authorize]
        [HttpPost("complete/{choreId}")]
        public async Task<IActionResult> CompleteChore(int choreId)
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

            var chore = await _context.Chores.Include(c => c.Group)
                                            .ThenInclude(g => g.Members)
                                            .FirstOrDefaultAsync(c => c.Id == choreId);
            if (chore == null)
            {
                return NotFound("Chore not found");
            }

            if (!chore.Group.Members.Any(m => m.UserId == user.Id))
            {
                return Forbid("You are not a member of this group");
            }

            var completion = new ChoreCompletion
            {
                UserId = user.Id,
                ChoreId = choreId,
                CompletedOn = DateTime.UtcNow,
                GroupId = chore.Group.Id
            };

            _context.ChoreCompletion.Add(completion);
            await _context.SaveChangesAsync();

            return Ok("Chore marked as completed");
        }

        [Authorize]
        [HttpGet("{groupId}/completed-chores")]
        public async Task<IActionResult> GetCompletedChores(int groupId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
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

            // If no completions found in this range
            if (!completions.Any())
            {
                return Ok(new { message = "No completed chores in this period" });
            }

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

            return Ok(completedChores);
        }

    }
}