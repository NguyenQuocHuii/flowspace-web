# HƯỚNG DẪN DEPLOY HỆ THỐNG FLOWSPACE (DEPLOY GUIDE)

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng FlowSpace (bao gồm Frontend tĩnh, Backend .NET 9 API và SQL Server Database) lên máy chủ ảo VPS (Linux Ubuntu hoặc Windows Server) để vận hành thực tế.

---

## 1. Các phần mềm cần chuẩn bị trên VPS

* **Hệ điều hành**: Khuyên dùng **Ubuntu Server 22.04 LTS** (ổn định, tối ưu chi phí).
* **Runtime**: **.NET 9 Runtime / ASP.NET Core Hosting Bundle** để chạy file build của Backend.
* **Database**: **SQL Server for Linux** (hoặc kết nối qua các dịch vụ Database Cloud).
* **Cache**: **Redis Server** (để quản lý Cache phiên đăng nhập và SignalR).
* **Reverse Proxy**: **NGINX** (làm cổng chặn điều hướng traffic, xử lý SSL và phục vụ file tĩnh cho Frontend).
* **SSL Certificate**: **Certbot (Let's Encrypt)** để cấp chứng chỉ HTTPS miễn phí.

---

## 2. Các bước triển khai chi tiết

### BƯỚC 1: Xuất bản dự án Backend (Publish)
1. Ở máy phát triển cục bộ, chạy lệnh biên dịch xuất bản dự án tối ưu hóa:
   ```bash
   dotnet publish FlowSpace.Api/FlowSpace.Api.csproj -c Release -o ./publish
   ```
2. Nén toàn bộ tệp trong thư mục `./publish` thành `publish.zip` và upload lên VPS.

### BƯỚC 2: Cấu hình biến môi trường trên VPS (Environment Variables)
Để bảo mật thông tin nhạy cảm, không lưu mật khẩu Database hoặc JWT Secret trong file code. Ta sẽ cấu hình trực tiếp trong hệ thống VPS:

* **Ubuntu (systemd service)**: Tạo file dịch vụ `/etc/systemd/system/flowspace-api.service` và khai báo các biến:
  ```ini
  [Service]
  WorkingDirectory=/var/www/flowspace
  ExecStart=/usr/bin/dotnet FlowSpace.Api.dll
  Restart=always
  RestartSec=10
  Environment=ASPNETCORE_ENVIRONMENT=Production
  Environment=ConnectionStrings__DefaultConnection="Server=localhost;Database=FlowSpaceDb;User Id=sa;Password=Mật_Khẩu_Cực_Kỳ_Bảo_Mật;TrustServerCertificate=True;"
  Environment=JwtSettings__Secret="Khóa_Bí_Mật_JWT_Tối_Thiểu_32_Ký_Tự_Ngẫu_Nhiên!"
  Environment=CorsSettings__AllowedOrigins__0="https://flowspace.yourdomain.com"
  ```
* **Kích hoạt service**:
  ```bash
  sudo systemctl enable flowspace-api.service
  sudo systemctl start flowspace-api.service
  ```

### BƯỚC 3: Deploy Cơ sở dữ liệu (SQL Server)
1. Kết nối SSMS từ máy bạn tới SQL Server của VPS.
2. Tạo mới Database tên `FlowSpaceDb`.
3. Chạy toàn bộ lệnh trong file [DATABASE_SETUP.sql](file:///e:/flowspace-fe/DATABASE_SETUP.sql).
4. **Bắt buộc**: Băm mật khẩu tài khoản demo bằng mã BCrypt và cập nhật trực tiếp vào cột `PasswordHash` của bảng `Users` trên Production.

### BƯỚC 4: Deploy Frontend & Cấu hình NGINX Reverse Proxy
1. Upload toàn bộ code tĩnh trong thư mục `/app` lên thư mục `/var/www/flowspace-fe` của VPS.
2. Cấu hình NGINX điều hướng:
   - Các request thông thường trỏ tới thư mục `/var/www/flowspace-fe` (Frontend).
   - Các request chứa tiền tố `/api/` được proxy ngược (Proxy Pass) về máy chủ Backend đang chạy cục bộ tại `http://localhost:5000` (hoặc cổng HTTP đã định nghĩa).
3. Cài đặt SSL cho Domain thông qua Certbot:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 3. Nhật ký kiểm tra an ninh (Security Checks)

* **CORS**: Đã khóa an toàn. Dự án chỉ chấp nhận các Request có Origin nằm trong mảng `CorsSettings:AllowedOrigins` (cấu hình sang domain Frontend thật trên VPS).
* **Swagger**: Đã khóa trong môi trường Production (chỉ kích hoạt ở Development).
* **JWT**: JWT Secret Key được chuyển hoàn toàn sang biến môi trường hệ thống để chống lộ mã nguồn.
* **Logging**: Chế độ Production tự động hạ mức log xuống `Warning` để tiết kiệm tài nguyên đĩa cứng của VPS.
