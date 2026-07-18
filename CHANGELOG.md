# NHẬT KÝ THAY ĐỔI (CHANGELOG)

Tài liệu này ghi lại toàn bộ lịch sử cập nhật cấu trúc mã nguồn dự án FlowSpace.

---

## [2026-07-18] - Tích hợp Hệ thống Đăng nhập & Đăng ký (Module 1)

### Frontend
- **Thay đổi**: Cập nhật tệp [auth.js](file:///e:/flowspace-fe/app/js/core/auth.js) chuyển phương thức `FS.auth.login()` thành bất đồng bộ (async/await) sử dụng `$.ajax` để gửi yêu cầu đăng nhập trực tiếp tới API Backend.
- **Thay đổi**: Cập nhật tệp [login.html](file:///e:/flowspace-fe/app/login.html) sửa đổi submit handler của `login-form` xử lý bất đồng bộ, đón nhận JWT token và lưu thông tin phiên làm việc vào `sessionStorage`.

### Backend
- **Tạo mới**: Thiết lập dự án kiến trúc Clean Architecture .NET 9 (`FlowSpace.slnx`).
- **Tạo mới**: Thiết kế schema cơ sở dữ liệu hoàn chỉnh (`DATABASE_SETUP.sql`).
- **Tạo mới**: Triển khai `AuthController` xử lý đăng ký, đăng nhập (BCrypt băm mật khẩu), đăng xuất, refresh-token, phục hồi mật khẩu và xác thực email.
- **Tạo mới**: Cấu hình CORS mở rộng trên `Program.cs` hỗ trợ kết nối từ Live Server.

## [2026-07-18] - Cấu hình Production và URL Động (Chuẩn bị Deploy)

### Frontend
- **Thay đổi**: Cấu hình biến `FS.API_BASE` động trong [auth.js](file:///e:/flowspace-fe/app/js/core/auth.js) để tự nhận diện môi trường: sử dụng `https://localhost:7297` khi chạy trên localhost và tự chuyển sang `https://flowspace-backend.onrender.com` khi deploy lên môi trường Production.
- **Tạo mới**: Thiết lập tệp cấu hình [vercel.json](file:///e:/flowspace-fe/app/vercel.json) phục vụ deploy tĩnh lên Vercel.

### Backend
- **Thay đổi**: Cập nhật tệp [Program.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Program.cs) để đọc CORS dynamic origins từ file cấu hình.
- **Thay đổi**: Chia cấu hình thành [appsettings.Development.json](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/appsettings.Development.json) (cho dev) và [appsettings.json](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/appsettings.json) (cho prod, sử dụng Biến môi trường hệ thống).
- **Tạo mới**: Viết [Dockerfile](file:///e:/flowspace-fe/backend/Dockerfile) và [render.yaml](file:///e:/flowspace-fe/render.yaml) để deploy Backend dạng container tự động lên Render.
