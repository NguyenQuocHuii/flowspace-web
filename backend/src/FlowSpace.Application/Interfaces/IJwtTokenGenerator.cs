using System;
using System.Security.Claims;
using FlowSpace.Domain.Entities;

namespace FlowSpace.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    }
}
