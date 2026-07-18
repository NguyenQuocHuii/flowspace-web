using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Interfaces;
using FlowSpace.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Api.Controllers
{
    public class AuthController : BaseApiController
    {
        private readonly FlowSpaceDbContext _context;
        private readonly IJwtTokenGenerator _tokenGenerator;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUser;

        public AuthController(
            FlowSpaceDbContext context, 
            IJwtTokenGenerator tokenGenerator, 
            IMapper mapper,
            ICurrentUserService currentUser)
        {
            _context = context;
            _tokenGenerator = tokenGenerator;
            _mapper = mapper;
            _currentUser = currentUser;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return FailResponse<UserDto>("Email already exists.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Using BCrypt or raw string for simplicity, here we hash it.
                Role = "employee", // Default role
                Avatar = request.Avatar,
                Color = request.Color,
                Department = request.Department,
                Position = request.Position,
                Phone = request.Phone,
                Active = true,
                JoinDate = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            return OkResponse(userDto, "Registration successful.");
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            bool isValid = false;

            if (user != null)
            {
                if (user.PasswordHash.StartsWith("$2"))
                {
                    try
                    {
                        isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                    }
                    catch
                    {
                        isValid = false;
                    }
                }
                else
                {
                    // Fallback for plain-text seed passwords
                    isValid = request.Password == user.PasswordHash;
                }
            }

            if (!isValid || user == null)
            {
                return FailResponse<AuthResponse>("Invalid email or password.");
            }

            if (!user.Active)
            {
                return FailResponse<AuthResponse>("Account is deactivated.");
            }

            var accessToken = _tokenGenerator.GenerateAccessToken(user);
            var refreshToken = _tokenGenerator.GenerateRefreshToken();

            var userRefreshToken = new UserRefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            await _context.UserRefreshTokens.AddAsync(userRefreshToken);
            await _context.SaveChangesAsync();

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresInMinutes = 15,
                User = _mapper.Map<UserDto>(user)
            };

            return OkResponse(response, "Login successful.");
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult<ApiResponse<string>>> Logout()
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<string>("Invalid user context.");
            }

            var tokens = await _context.UserRefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            }

            await _context.SaveChangesAsync();
            return OkResponse("Logout successful.");
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] TokenRefreshRequest request)
        {
            var principal = _tokenGenerator.GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal == null)
            {
                return FailResponse<AuthResponse>("Invalid access token.");
            }

            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<AuthResponse>("Invalid token claims.");
            }

            var savedRefreshToken = await _context.UserRefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && t.UserId == userId);

            if (savedRefreshToken == null || !savedRefreshToken.IsActive)
            {
                return FailResponse<AuthResponse>("Invalid or expired refresh token.");
            }

            // Revoke old token
            savedRefreshToken.RevokedAt = DateTime.UtcNow;
            savedRefreshToken.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.Active)
            {
                return FailResponse<AuthResponse>("User not found or inactive.");
            }

            // Generate new pair
            var newAccessToken = _tokenGenerator.GenerateAccessToken(user);
            var newRefreshToken = _tokenGenerator.GenerateRefreshToken();

            var newUserRefreshToken = new UserRefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            await _context.UserRefreshTokens.AddAsync(newUserRefreshToken);
            await _context.SaveChangesAsync();

            var response = new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresInMinutes = 15,
                User = _mapper.Map<UserDto>(user)
            };

            return OkResponse(response, "Token refreshed successfully.");
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<string>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User with this email does not exist.");
            }

            // In a real system, generate a token, save it, and send an email.
            // For now, return a mock token success message.
            return OkResponse("Reset token has been sent to your email (Mock token: RESET_TOKEN_123).");
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<string>>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User not found.");
            }

            if (request.Token != "RESET_TOKEN_123")
            {
                return FailResponse<string>("Invalid or expired password reset token.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return OkResponse("Password has been reset successfully.");
        }

        [HttpPost("verify-email")]
        public async Task<ActionResult<ApiResponse<string>>> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User not found.");
            }

            if (request.Token != "VERIFY_TOKEN_123")
            {
                return FailResponse<string>("Invalid email verification token.");
            }

            // Set user verification if fields exist. Since we don't have IsEmailVerified in the basic User schema,
            // we just return a success result.
            return OkResponse("Email verified successfully.");
        }
    }
}
