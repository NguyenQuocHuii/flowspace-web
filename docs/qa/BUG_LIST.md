# DANH SÁCH LỖI HỆ THỐNG (BUG LIST)

Tài liệu này ghi nhận toàn bộ các lỗi phát hiện trong quá trình phát triển và kiểm thử tích hợp hệ thống FlowSpace.

---

## Danh sách Lỗi ghi nhận

| ID | Phân hệ | Chi tiết lỗi | Trạng thái | Mức độ |
|---|---|---|---|---|
| **BUG-001** | Cấu hình | Cổng kết nối API trong `auth.js` bị sai lệch so với `launchSettings.json` (5001 so với 7297). | **Đã sửa** | Nghiêm trọng |
| **BUG-002** | Biên dịch | Thiếu namespace `Microsoft.EntityFrameworkCore` ở tầng Application khi gọi hàm `.ToListAsync()`. | **Đã sửa** | Nghiêm trọng |
| **BUG-003** | Biên dịch | Thiếu gói `System.IdentityModel.Tokens.Jwt` ở tầng Infrastructure để biên dịch `JwtTokenGenerator.cs`. | **Đã sửa** | Nghiêm trọng |
| **BUG-004** | Biên dịch | Thiếu gói `Microsoft.Extensions.Configuration.Binder` dẫn đến không gọi được hàm `.GetValue<T>()`. | **Đã sửa** | Nghiêm trọng |
| **BUG-005** | Database | SQL Server báo lỗi vòng lặp cascade (Msg 1785) ở ràng buộc bảng `Approvals`. | **Đã sửa** | Nghiêm trọng |
| **BUG-006** | Database | Thiếu bảng `UserRefreshTokens` trong script khởi tạo database khiến API login báo lỗi runtime. | **Đã sửa** | Nghiêm trọng |
| **BUG-007** | Auth | BCrypt quăng lỗi `Invalid salt version` khi cố kiểm tra mật khẩu dạng văn bản thô `'123456'` của seed data. | **Đã sửa** | Nghiêm trọng |
| **BUG-008** | Cấu hình | CORS mở tự do cho mọi domain (`AllowAnyOrigin`) trên Production. | **Đã sửa** | Trung bình |
