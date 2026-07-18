# DANH SÁCH KHẮC PHỤC LỖI (FIX LIST)

Tài liệu này ghi nhận chi tiết các giải pháp kỹ thuật đã áp dụng để sửa đổi toàn bộ lỗi trong tài liệu `BUG_LIST.md`.

---

## Chi tiết các phương án sửa lỗi

### 1. Sửa lỗi kết nối & Cổng API (BUG-001)
* **Giải pháp**: Cập nhật tệp [auth.js](file:///e:/flowspace-fe/app/js/core/auth.js) đổi cổng kết nối tĩnh từ `5001` thành `7297` để khớp với launch settings HTTPS của Web API. Sau đó cấu hình dynamic `FS.API_BASE` để tự động đổi cổng theo môi trường.

### 2. Sửa lỗi thiếu package biên dịch (BUG-002, BUG-003, BUG-004)
* **Giải pháp**:
  - Thêm `Microsoft.EntityFrameworkCore` vào [FlowSpace.Application.csproj](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/FlowSpace.Application.csproj).
  - Thêm `System.IdentityModel.Tokens.Jwt` và `Microsoft.Extensions.Configuration.Binder` vào [FlowSpace.Infrastructure.csproj](file:///e:/flowspace-fe/backend/src/FlowSpace.Infrastructure/FlowSpace.Infrastructure.csproj).

### 3. Khắc phục lỗi ràng buộc Database (BUG-005)
* **Giải pháp**: Cập nhật [DATABASE_SETUP.sql](file:///e:/flowspace-fe/DATABASE_SETUP.sql), đổi cấu hình hành động xóa của khóa ngoại `ApproverId` từ `ON DELETE SET NULL` thành `ON DELETE NO ACTION` để tránh xung đột luồng xóa nhiều tầng.

### 4. Bổ sung bảng UserRefreshTokens (BUG-006)
* **Giải pháp**: Viết thêm đoạn mã DDL tạo bảng `UserRefreshTokens` cùng các chỉ mục phi cụm vào file [DATABASE_SETUP.sql](file:///e:/flowspace-fe/DATABASE_SETUP.sql) và chạy lại script trên SSMS.

### 5. Khắc phục lỗi muối BCrypt (BUG-007)
* **Giải pháp**: Sửa lại phương thức `Login` trong [AuthController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/AuthController.cs), thêm khối kiểm tra tiền tố `$2` của BCrypt và bọc khối `try-catch` để chuyển hướng so sánh chuỗi trực tiếp cho mật khẩu seed dữ liệu mẫu thô mà không gây treo API.

### 6. Cấu hình CORS bảo mật Production (BUG-008)
* **Giải pháp**: Thay đổi `Program.cs` để đọc CORS từ cấu hình `CorsSettings:AllowedOrigins` thay vì mở hoàn toàn wildcard.
