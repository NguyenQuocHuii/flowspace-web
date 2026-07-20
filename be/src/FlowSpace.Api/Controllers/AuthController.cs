using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
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
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FlowSpace.Api.Controllers
{
    [EnableRateLimiting("auth-api")]
    public class AuthController : BaseApiController
    {
        private readonly FlowSpaceDbContext _context;
        private readonly IJwtTokenGenerator _tokenGenerator;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUser;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _configuration;

        public AuthController(
            FlowSpaceDbContext context, 
            IJwtTokenGenerator tokenGenerator, 
            IMapper mapper,
            ICurrentUserService currentUser,
            IEmailSender emailSender,
            IConfiguration configuration)
        {
            _context = context;
            _tokenGenerator = tokenGenerator;
            _mapper = mapper;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        private string GenerateRandomToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        private async Task CreateAuditLogAsync(Guid? userId, string action, string detail)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Action = action,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                    Detail = detail,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.AuditLogs.AddAsync(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Failed to write audit log: {ex.Message}");
            }
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
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "employee",
                Avatar = request.Avatar,
                Color = request.Color,
                Department = request.Department,
                Position = request.Position,
                Phone = request.Phone,
                Active = true,
                IsEmailVerified = false,
                JoinDate = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);

            // Sinh EmailVerificationToken thật
            var tokenString = GenerateRandomToken();
            var verificationToken = new EmailVerificationToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            await _context.EmailVerificationTokens.AddAsync(verificationToken);
            await _context.SaveChangesAsync();

            // Ghi Audit Log thành công
            await CreateAuditLogAsync(user.Id, "Register", $"User registered successfully. Email: {user.Email}");

            // Gửi email thật
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5500";
            var verificationLink = $"{frontendUrl}/verify-email.html?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(tokenString)}";
            var subject = "Xác nhận tài khoản FlowSpace";
            var htmlBody = $@"
                <div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;'>
                    <h2 style='color: #6366F1;'>Chào mừng {user.Name} đến với FlowSpace!</h2>
                    <p>Vui lòng click vào nút bên dưới để xác nhận tài khoản email của bạn. Đường dẫn này sẽ hết hạn trong vòng 24 giờ.</p>
                    <div style='margin: 24px 0;'>
                        <a href='{verificationLink}' style='background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;'>Xác thực tài khoản</a>
                    </div>
                    <p style='color: #6b7280; font-size: 13px;'>Nếu nút trên không hoạt động, bạn có thể copy link sau dán vào trình duyệt:</p>
                    <p style='color: #6b7280; font-size: 13px; word-break: break-all;'>{verificationLink}</p>
                </div>";

            try
            {
                await _emailSender.SendAsync(user.Email, subject, htmlBody);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Failed to send registration verification email: {ex.Message}");
            }

            var userDto = _mapper.Map<UserDto>(user);
            return OkResponse(userDto, "Registration successful. Verification email has been sent.");
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null)
            {
                await CreateAuditLogAsync(null, "LoginFailed", $"Failed login attempt for non-existing email: {request.Email}");
                return FailResponse<AuthResponse>("Invalid email or password.");
            }

            // 1. Kiểm tra Lockout
            if (user.LockoutEndAt.HasValue && user.LockoutEndAt.Value > DateTime.UtcNow)
            {
                var remaining = user.LockoutEndAt.Value - DateTime.UtcNow;
                return FailResponse<AuthResponse>($"Tài khoản tạm khóa, thử lại sau {Math.Ceiling(remaining.TotalMinutes)} phút.");
            }

            // 2. Bắt buộc kiểm tra IsEmailVerified trước
            if (!user.IsEmailVerified)
            {
                await CreateAuditLogAsync(user.Id, "LoginFailed", $"Login blocked for unverified email: {user.Email}");
                return FailResponse<AuthResponse>("EMAIL_NOT_VERIFIED");
            }

            bool isValid = false;
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
                isValid = request.Password == user.PasswordHash;
            }

            // 3. Logic mật khẩu sai
            if (!isValid)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= 5)
                {
                    user.LockoutEndAt = DateTime.UtcNow.AddMinutes(15);
                    await CreateAuditLogAsync(user.Id, "LoginFailed", $"Account locked due to 5 failed password attempts.");
                }
                else
                {
                    await CreateAuditLogAsync(user.Id, "LoginFailed", $"Incorrect password. Failed attempt count: {user.FailedLoginCount}");
                }

                await _context.SaveChangesAsync();
                return FailResponse<AuthResponse>("Invalid email or password.");
            }

            if (!user.Active)
            {
                return FailResponse<AuthResponse>("Account is deactivated.");
            }

            // Đăng nhập đúng: reset
            user.FailedLoginCount = 0;
            user.LockoutEndAt = null;

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

            // Ghi AuditLog thành công
            await CreateAuditLogAsync(user.Id, "Login", $"User logged in successfully.");

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

            // Ghi AuditLog thành công
            await CreateAuditLogAsync(userId, "Logout", "User logged out.");

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

            savedRefreshToken.RevokedAt = DateTime.UtcNow;
            savedRefreshToken.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.Active)
            {
                return FailResponse<AuthResponse>("User not found or inactive.");
            }

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
                return OkResponse("Reset token has been sent to your email.");
            }

            var oldTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null)
                .ToListAsync();

            foreach (var t in oldTokens)
            {
                t.UsedAt = DateTime.UtcNow;
            }

            var tokenString = GenerateRandomToken();
            var resetToken = new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow
            };

            await _context.PasswordResetTokens.AddAsync(resetToken);
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5500";
            var resetLink = $"{frontendUrl}/reset-password.html?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(tokenString)}";
            var subject = "Đặt lại mật khẩu FlowSpace";
            var htmlBody = $@"
                <div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;'>
                    <h2 style='color: #6366F1;'>Đặt lại mật khẩu của bạn</h2>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản FlowSpace của bạn. Vui lòng click vào nút bên dưới để tiến hành đặt lại mật khẩu. Link này sẽ hết hạn trong vòng 1 giờ.</p>
                    <div style='margin: 24px 0;'>
                        <a href='{resetLink}' style='background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;'>Đặt lại mật khẩu</a>
                    </div>
                    <p style='color: #6b7280; font-size: 13px; word-break: break-all;'>{resetLink}</p>
                </div>";

            try
            {
                await _emailSender.SendAsync(user.Email, subject, htmlBody);
            }
            catch (Exception ex)
            {
                return FailResponse<string>($"Failed to send password reset email: {ex.Message}");
            }

            return OkResponse("Reset token has been sent to your email.");
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<string>>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User not found.");
            }

            var dbToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == request.Token && t.UserId == user.Id);

            if (dbToken == null)
            {
                return FailResponse<string>("Invalid password reset token.");
            }

            if (dbToken.UsedAt.HasValue)
            {
                return FailResponse<string>("This reset token has already been used.");
            }

            if (dbToken.ExpiresAt < DateTime.UtcNow)
            {
                return FailResponse<string>("This reset token has expired.");
            }

            dbToken.UsedAt = DateTime.UtcNow;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // Thu hồi phiên làm việc
            var activeRefreshTokens = await _context.UserRefreshTokens
                .Where(t => t.UserId == user.Id && t.RevokedAt == null)
                .ToListAsync();

            foreach (var token in activeRefreshTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            }

            await _context.SaveChangesAsync();

            // Ghi AuditLog thành công
            await CreateAuditLogAsync(user.Id, "PasswordReset", "User reset password successfully.");

            return OkResponse("Password has been reset successfully. All active sessions have been revoked.");
        }

        [HttpPost("verify-email")]
        public async Task<ActionResult<ApiResponse<string>>> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User not found.");
            }

            var dbToken = await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(t => t.Token == request.Token && t.UserId == user.Id);

            if (dbToken == null)
            {
                return FailResponse<string>("Invalid email verification token.");
            }

            if (dbToken.UsedAt.HasValue)
            {
                return FailResponse<string>("This verification token has already been used.");
            }

            if (dbToken.ExpiresAt < DateTime.UtcNow)
            {
                return FailResponse<string>("This verification token has expired.");
            }

            dbToken.UsedAt = DateTime.UtcNow;
            user.IsEmailVerified = true;
            user.EmailVerifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Ghi AuditLog thành công
            await CreateAuditLogAsync(user.Id, "EmailVerified", "User verified email successfully.");

            return OkResponse("Email verified successfully.");
        }

        [HttpPost("resend-verification")]
        public async Task<ActionResult<ApiResponse<string>>> ResendVerification([FromBody] ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return FailResponse<string>("User with this email does not exist.");
            }

            if (user.IsEmailVerified)
            {
                return FailResponse<string>("This email has already been verified.");
            }

            var oldTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null)
                .ToListAsync();

            foreach (var t in oldTokens)
            {
                t.UsedAt = DateTime.UtcNow;
            }

            var tokenString = GenerateRandomToken();
            var verificationToken = new EmailVerificationToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            await _context.EmailVerificationTokens.AddAsync(verificationToken);
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5500";
            var verificationLink = $"{frontendUrl}/verify-email.html?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(tokenString)}";
            var subject = "Xác nhận tài khoản FlowSpace (Gửi lại)";
            var htmlBody = $@"
                <div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;'>
                    <h2 style='color: #6366F1;'>Xác thực tài khoản email</h2>
                    <p>Bạn đã yêu cầu gửi lại link xác thực tài khoản FlowSpace. Link này hết hạn sau 24 giờ.</p>
                    <div style='margin: 24px 0;'>
                        <a href='{verificationLink}' style='background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;'>Xác thực tài khoản</a>
                    </div>
                    <p style='color: #6b7280; font-size: 13px; word-break: break-all;'>{verificationLink}</p>
                </div>";

            try
            {
                await _emailSender.SendAsync(user.Email, subject, htmlBody);
            }
            catch (Exception ex)
            {
                return FailResponse<string>($"Failed to send verification email: {ex.Message}");
            }

            return OkResponse("Verification email has been resent successfully.");
        }
    }
}
