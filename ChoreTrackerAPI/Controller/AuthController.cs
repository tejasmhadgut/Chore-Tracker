using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/account")]
    [ApiController]
    public class AuthController: ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtTokenService _jwtTokenService;
        public AuthController(UserManager<ApplicationUser> userManager, 
        SignInManager<ApplicationUser> signInManager,
        JwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if(!ModelState.IsValid)
                return BadRequest(ModelState);
            Console.WriteLine("running til here");
            var user = new ApplicationUser{
                UserName = model.UserName.ToLower(), Email = model.Email, FirstName = model.FirstName, LastName = model.LastName
                };
            var result = await _userManager.CreateAsync(user, model.Password);
            if(!result.Succeeded)
                return BadRequest(result.Errors);
            var token = _jwtTokenService.GenerateJwtToken(user);

            // Store token in HttpOnly Cookie
            Response.Cookies.Append("authToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { message = "User registered successfully!"});
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName.ToLower());
            if(user == null)
                return Unauthorized(new {message = "Invalid username or password"});
            
            var result = await _signInManager.PasswordSignInAsync(user, model.Password, false, false);
            if(!result.Succeeded)
                return Unauthorized(new {message = "Invalid username or password"});

            var token = _jwtTokenService.GenerateJwtToken(user);

            Response.Cookies.Append("authToken", token, new CookieOptions{
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });
            return Ok(new { message = "Login successful" });
        }
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("authToken");
            return Ok(new {message = "Logged Out Successfully!"});
        }
        [Authorize]
        [HttpGet("users/{username}")]
        public async Task<IActionResult> GetUserInfo(string username)
        {
            // Get the authenticated user's username from claims
            var authenticatedUsername = User.Identity?.Name;
            if (authenticatedUsername == null) return Unauthorized();

            // Ensure the requested username matches the authenticated user
            if (!authenticatedUsername.Equals(username, StringComparison.OrdinalIgnoreCase))
                return Forbid(); // Return 403 Forbidden if users try to access someone else’s data

            // Fetch user info
            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound(new { message = "User not found" });

            return Ok(new { user.Id, user.UserName, user.Email });
        }

    }
}