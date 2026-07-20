# TÀI LIỆU PHÂN TÍCH TOÀN DIỆN DỰ ÁN FLOWSPACE (PROJECT ANALYSIS)

Tài liệu này được lập bởi Senior Software Architect & Tech Lead trên cơ sở **khảo sát 100% mã nguồn thực tế** (Frontend: `/app` và Backend: `/backend/src`) đối chiếu với các tài liệu kỹ thuật hiện có.

---

## 1. Phân tích Kiến trúc & Cấu trúc Thư mục

### 1.1. Kiến trúc Tổng thể (FE ↔ BE ↔ DB)
- **Frontend**: Single Page Application (SPA) tối giản xây dựng trên HTML5, Bootstrap 5.3.3 và jQuery 3.7.1. Định tuyến SPA động thực hiện bằng `jQuery.load()` nạp các file HTML fragment từ `/app/pages/` vào phần tử chính `#page-content` trong `app.html`.
- **Backend**: Solution .NET 9 áp dụng mô hình Clean Architecture phân làm 5 dự án:
  - `FlowSpace.Domain`: Chứa 9 Entity (`User`, `UserRefreshToken`, `Project`, `TaskItem`, `Subtask`, `Request`, `Approval`, `Comment`, `TimeLog`) và các Enums.
  - `FlowSpace.Application`: Chứa interfaces, DTOs, Mapping profiles, `ProjectService` và `ValidationBehavior`.
  - `FlowSpace.Infrastructure`: Chứa `JwtTokenGenerator` triển khai JWT Access Token (15 phút) & Refresh Token (7 ngày).
  - `FlowSpace.Persistence`: Chứa `FlowSpaceDbContext`, `GenericRepository<T>`, `UnitOfWork` và `DbInitializer`.
  - `FlowSpace.Api`: Web API Host chứa `AuthController`, `ProjectsController`, `GlobalExceptionMiddleware`, Serilog và Swagger.
- **Thực trạng tuân thủ Clean Architecture**:
  - `AuthController` đang tiêm trực tiếp `FlowSpaceDbContext` thay vì thông qua Application Service / Repository / MediatR Handler -> **Lệch so với thiết kế Clean Architecture** trong `BACKEND_DESIGN.md`.
  - `ProjectsController` đã qua `IProjectService` và `IUnitOfWork`, nhưng thư mục `FlowSpace.Application/Features` hiện mới chỉ có thư mục rỗng `Projects/Validators` mà CHƯA triển khai MediatR Command/Query handlers.

### 1.2. Rà soát Cấu trúc Thư mục & File Dư thừa
- **`app/js/components/search-modal.js`**: Hiện trạng là file stub vỏ bọc 10 dòng, toàn bộ logic tìm kiếm nằm trong `notifications.js` (`FS.searchModule`). Cần giữ nguyên để đảm bảo thứ tự nạp script không bị lỗi.
- **Thư mục Build/Temporary**: Đã loại trừ đúng theo `.gitignore` (`bin/`, `obj/`, `FlowSpace.db`).

---

## 2. Phân tích Frontend Code Quality

- **Xác thực & Lưu trữ**:
  - `Module 1 (Authentication)`: Đã nối API thật (`POST /api/v1/auth/login`, `logout`, `refresh-token`). `auth.js` đã được cấu hình tự động đính kèm Bearer token vào `jQuery.ajaxSetup`.
  - `Các Module còn lại (2 đến 6)`: Vẫn chạy hoàn toàn trên Mock DB `FS.db` tương tác với `localStorage` qua `seed-data.js`.
- **Chất lượng Code JS & Event Binding**:
  - Quản lý namespace tập trung qua `window.FS`.
  - Cần chú ý nguy cơ **Duplicate Event Binding** khi chuyển trang SPA bằng `$().load()` nếu các sự kiện click/submit gắn trực tiếp `$(document).on(...)` mà không unbind trước khi re-init.
- **CSS System & Responsive**:
  - Sử dụng hệ thống biến CSS `--fs-*` nhất quán hỗ trợ Dark Mode linh hoạt.
  - Giao diện đáp ứng tốt trên Mobile nhờ Bootstrap grid và offcanvas drawer.

---

## 3. Phân tích Backend & Cơ sở Dữ liệu (Real Code Audit)

### 3.1. Hiện trạng Controllers & Services Backend
| Controller / Module | Mức độ hoàn thiện | Điểm lưu ý kỹ thuật |
|---|---|---|
| **AuthController** | **100% (Hoạt động)** | Đã hỗ trợ Register, Login, Refresh Token, Revoke Token, Logout, Pass Reset. Gọi trực tiếp `FlowSpaceDbContext`. |
| **ProjectsController** | **80% (Một phần)** | Đã có CRUD cơ bản qua `IProjectService`. Chưa có phân quyền động theo thành viên dự án, chưa có API gán thành viên. |
| **TasksController** | **0% (Chưa có)** | Domain đã có `TaskItem`, `Subtask`, `Comment` nhưng BE CHƯA có Controller/Service. |
| **RequestsController** | **0% (Chưa có)** | Domain đã có `Request`, `Approval` nhưng BE CHƯA có Controller/Service/Workflow Engine. |
| **TimeTrackingController**| **0% (Chưa có)** | Domain đã có `TimeLog` nhưng BE CHƯA có Controller/Service. |
| **Documents / Chat** | **0% (Chưa có)** | Chưa có Controller, chưa có SignalR Hubs (`ChatHub`, `NotificationHub` đang bị comment trong `Program.cs`). |

### 3.2. Đánh giá Database & EF Core Configurations
- **Xung đột Provider (SQLite vs SQL Server)**:
  - Tài liệu `DATABASE_SETUP.sql`, `DATABASE.md` và `BACKEND_DESIGN.md` chỉ định sử dụng **SQL Server**.
  - Code thực tế trong `DependencyInjection.cs` và `appsettings.json` đang cấu hình **SQLite** (`options.UseSqlite("Data Source=FlowSpace.db")`).
- **Thiếu DbSet trong DbContext**:
  - `FlowSpaceDbContext.cs` hiện tại **CHỈ khai báo**:
    `DbSet<User>` và `DbSet<UserRefreshToken>`.
  - Chưa khai báo `DbSet<Project>`, `DbSet<TaskItem>`, `DbSet<Request>`, `DbSet<Approval>`, `DbSet<Comment>`, `DbSet<TimeLog>`, `DbSet<Subtask>`.
- **Kiểm tra Cascade Rule & FKs**:
  - Bug BUG-005 về vòng lặp cascade ở `Approvals` đã được sửa trong `DATABASE_SETUP.sql` bằng `ON DELETE NO ACTION`.

---

## 4. Phân tích Bảo mật, Hiệu năng & Khả năng Mở rộng

### 4.1. An ninh & Bảo mật (Security)
- **JWT & BCrypt**: Thuật toán HmacSha256, BCrypt băm mật khẩu chuẩn. Đã bọc try-catch tránh lỗi muối BCrypt đối với seed data cũ (BUG-007).
- **Hardcoded Secret**: File `Program.cs` có fallback secret key `"DefaultSuperSecretKey1234567890123456"`. Cần đảm bảo môi trường thật bắt buộc load key từ `appsettings.json` hoặc Environment Variable.
- **CORS**: Đã cấu hình đọc từ `CorsSettings:AllowedOrigins` (BUG-008 đã fix).

### 4.2. Hiệu năng & Tối ưu hóa (Performance)
- **EF Core Query Optimization**: `ProjectService` đã dùng `.Include(p => p.Owner).Include(p => p.Members)`. Khi mở rộng cho Task/Subtask cần dùng AsNoTracking() cho Read Queries để tránh N+1 query và lãng phí RAM.
- **Caching**: `BACKEND_DESIGN.md` đề xuất Redis / MemoryCache, nhưng code hiện tại chưa cài đặt bộ đệm Caching.

---

## 5. Bảng Tổng hợp Tình trạng Tích hợp FE-BE theo Phân hệ

| Phân hệ (Module) | Giao diện FE | API Backend | Kết nối Real API | Ghi chú |
|---|---|---|---|---|
| **Module 1: Auth** | `login.html` | `/api/v1/auth/*` | **Đã nối 100%** | Login, Refresh Token, Logout chạy API thật. |
| **Module 2: Projects**| `projects.html` | `/api/v1/projects` | **Chưa nối (50% BE)**| BE có controller CRUD cơ bản, FE dùng localStorage. |
| **Module 3: Tasks & Kanban**| `tasks.html`, `kanban.html`, `gantt.html`, `calendar.html` | Chưa có | **Chưa nối (0% BE)**| Domain Entity có sẵn, thiếu Controller/Service BE. |
| **Module 4: Time Tracking**| `timetracking.html` | Chưa có | **Chưa nối (0% BE)**| Domain Entity `TimeLog` có sẵn, thiếu BE. |
| **Module 5: Chat Workspace**| `chat.html` | Chưa có | **Chưa nối (0% BE)**| Thiếu Controller và SignalR Hub. |
| **Module 6: Documents**| `documents.html` | Chưa có | **Chưa nối (0% BE)**| Thiếu Upload Service và Controller. |
| **Module 7: Requests & Approvals**| `requests.html`, `approvals.html` | Chưa có | **Chưa nối (0% BE)**| Domain Entity `Request`, `Approval` có sẵn, thiếu BE. |
