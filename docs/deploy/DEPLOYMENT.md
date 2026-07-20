# HƯỚNG DẪN TRIỂN KHAI PRODUCTION (DEPLOYMENT GUIDE)

Tài liệu này cung cấp quy trình từng bước triển khai hệ thống **FlowSpace Platform** lên môi trường Production (Docker, Render, Microsoft IIS, Azure App Service & Vercel/Netlify cho Frontend).

---

## 1. Yêu cầu Trước khi Triển khai (Pre-deployment Checklist)

1. **Chuỗi kết nối SQL Server**: Chuẩn bị Connection String kết nối SQL Server Production.
2. **Khóa bảo mật JWT**: Tạo khóa JWT Secret ngẫu nhiên có độ dài tối thiểu 32 ký tự (chứa chữ hoa, chữ thường, số và ký tự đặc biệt).
3. **Cấu hình CORS**: Đăng ký domain công khai của Frontend vào danh sách `CorsSettings:AllowedOrigins`.
4. **Quyền hạn Thư mục**: Đảm bảo Process dịch vụ có quyền Write vào thư mục `wwwroot/uploads/`.

---

## 2. Triển khai Backend Web API qua Docker Container

### 2.1. Dockerfile
FlowSpace Backend đã được sẵn sàng với Dockerfile đa tầng (Multi-stage build):

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/FlowSpace.Api/FlowSpace.Api.csproj", "FlowSpace.Api/"]
COPY ["src/FlowSpace.Application/FlowSpace.Application.csproj", "FlowSpace.Application/"]
COPY ["src/FlowSpace.Domain/FlowSpace.Domain.csproj", "FlowSpace.Domain/"]
COPY ["src/FlowSpace.Infrastructure/FlowSpace.Infrastructure.csproj", "FlowSpace.Infrastructure/"]
COPY ["src/FlowSpace.Persistence/FlowSpace.Persistence.csproj", "FlowSpace.Persistence/"]
RUN dotnet restore "FlowSpace.Api/FlowSpace.Api.csproj"
COPY src/ .
WORKDIR "/src/FlowSpace.Api"
RUN dotnet build "FlowSpace.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FlowSpace.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FlowSpace.Api.dll"]
```

### 2.2. Lệnh Build & Chạy Container

```bash
# Build Docker image
docker build -t flowspace-api:latest -f backend/Dockerfile backend/

# Chạy Container
docker run -d \
  -p 5000:80 \
  -e "ConnectionStrings__DefaultConnection=Server=your_sql_server;Database=FlowSpaceDb;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;" \
  -e "JwtSettings__Secret=YourProductionSuperSecretKeyMinimum32CharsLong!" \
  -e "JwtSettings__Issuer=FlowSpaceApi" \
  -e "JwtSettings__Audience=FlowSpaceClient" \
  --name flowspace-backend \
  flowspace-api:latest
```

---

## 3. Triển khai Cloud PaaS (Render.com)

Dự án hỗ trợ file `render.yaml` để deploy tự động lên Render PaaS:

```yaml
services:
  - type: web
    name: flowspace-api
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: JwtSettings__Secret
        sync: false
      - key: ConnectionStrings__DefaultConnection
        sync: false
```

---

## 4. Triển khai trên Microsoft IIS (Windows Server)

1. Tải và cài đặt **.NET 8 Hosting Bundle** trên máy chủ Windows Server.
2. Publish dự án từ terminal:
   ```bash
   dotnet publish backend/src/FlowSpace.Api/FlowSpace.Api.csproj -c Release -o C:\inetpub\wwwroot\flowspace-api
   ```
3. Tạo Website mới trong IIS Manager trỏ tới `C:\inetpub\wwwroot\flowspace-api`.
4. Đảm bảo Application Pool cài đặt **.NET CLR Version: No Managed Code**.

---

## 5. Triển khai Frontend SPA (Vercel / Netlify / Nginx)

Vì Frontend FlowSpace được thiết kế dạng Single Page Application (SPA) tối giản bằng HTML5/JS:
1. Đổi `FS.API_BASE` trong `app/js/core/utils.js` trỏ về địa chỉ Web API Production của bạn.
2. Đẩy thư mục `app/` lên **Vercel**, **Netlify**, hoặc hosting tĩnh bất kỳ.
3. Hoặc cấu hình Nginx phục vụ thư mục tĩnh `app/`:

```nginx
server {
    listen 80;
    server_name flowspace.yourdomain.com;

    location / {
        root /var/www/flowspace/app;
        index login.html app.html;
        try_files $uri $uri/ /app.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $http_connection;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Kiểm tra & Giám sát Sau Triển khai

1. Kiểm tra tài liệu Swagger tại: `https://your-api-domain.com/swagger`.
2. Kiểm tra log ứng dụng trong thư mục `logs/log-YYYYMMDD.txt` (được ghi bởi Serilog).
3. Đăng nhập ứng dụng Frontend với các tài khoản demo để kiểm tra luồng end-to-end.
