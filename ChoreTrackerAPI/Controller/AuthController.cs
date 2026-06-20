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
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/account")]
    [ApiController]
    public class AuthController: ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtTokenService _jwtTokenService;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _env;

        public AuthController(UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        JwtTokenService jwtTokenService,
        ILogger<AuthController> logger,
        IWebHostEnvironment env)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _logger = logger;
            _env = env;
        }

        // Helper method to get cookie options for current environment
        private CookieOptions GetCookieOptions()
        {
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // Only require HTTPS in production
                SameSite = SameSiteMode.Lax, // Lax allows same-origin and top-level navigation
                Expires = DateTime.UtcNow.AddDays(7)
            };
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if(!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Registration attempt for username: {Username}", model.UserName);

            var user = new ApplicationUser{
                UserName = model.UserName.ToLower(), Email = model.Email, FirstName = model.FirstName, LastName = model.LastName
                };
            var result = await _userManager.CreateAsync(user, model.Password);
            if(!result.Succeeded)
            {
                _logger.LogWarning("User registration failed for {Username}: {Errors}", model.UserName, string.Join(", ", result.Errors.Select(e => e.Description)));
                return BadRequest(result.Errors);
            }

            var token = _jwtTokenService.GenerateJwtToken(user);

            // Store token in HttpOnly Cookie
            Response.Cookies.Append("authToken", token, GetCookieOptions());

            _logger.LogInformation("User registered successfully: {Username}", user.UserName);

            return Ok(new { message = "User registered successfully!",
                user = new
                {
                    user.FirstName,
                    user.LastName,
                    user.UserName,
                    user.Email
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (string.IsNullOrEmpty(model.UserName))
            {
                return BadRequest(new { message = "Username is required." });
            }

            if (string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { message = "Password is required." });
            }

            try{
                _logger.LogInformation("Login attempt for username: {Username}", model.UserName);

                var user = await _userManager.FindByNameAsync(model.UserName.ToLower());
                if(user == null)
                {
                    _logger.LogWarning("Login failed: User not found - {Username}", model.UserName);
                    return Unauthorized(new {message = "Invalid username or password"});
                }

                var result = await _signInManager.PasswordSignInAsync(user, model.Password, false, false);
                if(!result.Succeeded)
                {
                    _logger.LogWarning("Login failed: Invalid password for {Username}", model.UserName);
                    return Unauthorized(new {message = "Invalid username or password"});
                }

                var token = _jwtTokenService.GenerateJwtToken(user);

                Response.Cookies.Append("authToken", token, GetCookieOptions());

                _logger.LogInformation("User logged in successfully: {Username}", user.UserName);

                return Ok(new { message = "Login successful",
                    user = new
                    {
                        user.FirstName,
                        user.LastName,
                        user.UserName,
                        user.Email,
                        user.ProfilePictureUrl
                    }
                });
            } catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during login for username: {Username}", model.UserName);
                return StatusCode(500, new {message = "An error occurred. Please try again later."});
            }
        }
        
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var username = User.Identity?.Name;
                _logger.LogInformation("Logout attempt for user: {Username}", username);

                // Sign out the user (clears Identity cookies and sessions)
                await _signInManager.SignOutAsync();

                // Delete the JWT token cookie with explicit options to ensure it's deleted
                var cookieOptions = GetCookieOptions();
                cookieOptions.Expires = DateTime.UtcNow.AddDays(-1); // Set to past date to delete
                Response.Cookies.Append("authToken", "", cookieOptions);

                _logger.LogInformation("User logged out successfully: {Username}", username);

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during logout for user: {Username}", User.Identity?.Name);
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
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
                return Forbid(); // Return 403 Forbidden if users try to access someone else's data

            // Fetch user info
            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound(new { message = "User not found" });

            return Ok(new { user.Id,  user.UserName, user.FirstName, user.LastName, user.Email, user.ProfilePictureUrl });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Get the authenticated user's username from claims
            var authenticatedUsername = User.Identity?.Name;
            if (authenticatedUsername == null) return Unauthorized();

            // Fetch user info
            var user = await _userManager.FindByNameAsync(authenticatedUsername);
            if (user == null) return NotFound(new { message = "User not found" });

            return Ok(new
            {
                user.Id,
                user.UserName,
                user.FirstName,
                user.LastName,
                user.Email,
                user.ProfilePictureUrl
            });
        }

    }
}
