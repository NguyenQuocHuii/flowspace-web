# TÀI LIỆU CÔNG BỐ PHIÊN BẢN CƠ SỞ (BASELINE RELEASE v0.1.0)

Tài liệu này đánh dấu việc đóng gói phiên bản cơ sở **v0.1.0** của hệ thống **FlowSpace**, xác nhận hạ tầng Backend .NET 8, Cơ sở dữ liệu SQL Server LocalDB và Module 1 (Authentication) đã hoàn thiện 100% sẵn sàng bước vào phát triển **Module 2 (Project Management)**.

---

## 1. Kiến trúc Hiện tại (Current Architecture)

- **Frontend**: Single Page Application (SPA) Notion-Style xây dựng trên HTML5/Bootstrap 5.3.3/jQuery 3.7.1, quản lý state và module qua global namespace `window.FS`.
- **Backend**: Solution .NET 8 tuân thủClean Architecture phân làm 5 dự án độc lập:
  - `FlowSpace.Domain`: Chứa 9 Entity nghiệp vụ và các Enums.
  - `FlowSpace.Application`: Chứa interfaces, DTOs, Mapping profiles, `ProjectService`.
  - `FlowSpace.Infrastructure`: Chứa `JwtTokenGenerator` (JWT 15m / Refresh Token 7d).
  - `FlowSpace.Persistence`: Chứa `FlowSpaceDbContext` (9 DbSets, Fluent API mapping), `GenericRepository<T>`, `UnitOfWork` và `DbInitializer`.
  - `FlowSpace.Api`: Web API Host chứa `AuthController`, `ProjectsController`, `GlobalExceptionMiddleware`, Serilog và Swagger.
- **Database**: SQL Server LocalDB `(localdb)\mssqllocaldb` vận hành qua EF Core Migration `20260719150000_InitialSqlServerCreate.cs` với 10 bảng chuẩn hóa quan hệ.

---

## 2. Công nghệ Sử dụng (Technology Stack)

| Phân tầng | Công nghệ / Thư viện | Phiên bản |
|---|---|---|
| **Frontend Core** | HTML5, Vanilla CSS Variable System, jQuery, Bootstrap | 3.7.1 / 5.3.3 |
| **Frontend Components**| Chart.js, FullCalendar, SortableJS, SheetJS (xlsx), jsPDF | 4.4 / 6.1 / 1.15 |
| **Backend Core** | .NET Web API, C# | 8.0 / net8.0 |
| **ORM & Data** | Entity Framework Core (SqlServer Provider) | 8.0.* |
| **Authentication** | JWT Bearer Authentication, BCrypt.Net-Next | 8.0.* / 4.0.3 |
| **Utilities** | AutoMapper, FluentValidation, MediatR, Serilog | 12.0 / 12.1 / 14.2 |
| **Database & Container**| SQL Server LocalDB, Docker, Render Deployment Spec | 2022 / Docker / Render |

---

## 3. Danh mục Module Đã Hoàn thành (Completed Modules)

- **Module 0: Core Infrastructure & Database**:
  - Tích hợp EF Core SqlServer Provider, kết nối SQL Server LocalDB.
  - Khai báo 9 `DbSet` trong `FlowSpaceDbContext.cs`, sửa triệt để lỗi cascade loop (BUG-005) ở `Approvals`.
  - Nạp (seed) thành công dữ liệu mẫu đầy đủ trong `DbInitializer.cs` (4 Users, 1 Project, 6 Tasks phủ đủ 4 cột Kanban, 6 Subtasks, 2 Comments, 1 Request, 4 Approvals).
  - Bọc bảo mật secret key trong `Program.cs` (loại bỏ mã hóa cứng, ném `InvalidOperationException` nếu yếu).
- **Module 1: Authentication**:
  - API RESTful `/api/v1/auth/login`, `register`, `refresh-token`, `logout`, `forgot-password`, `reset-password` vận hành 100%.
  - Frontend `auth.js` & `login.html` đã kết nối API thật, quản lý Bearer token và phiên đăng nhập.

---

## 4. Danh mục Module Chưa Hoàn thành (Uncompleted Modules)

- **Module 2: Project Management** (BE CRUD một phần, FE chưa kết nối API).
- **Module 3: Task & Kanban Management** (BE chưa có TasksController, FE dùng mock `FS.db`).
- **Module 4: Time Tracking** (BE chưa có TimeTrackingController, FE dùng mock `FS.db`).
- **Module 5: Requests, Approvals & Workflow Engine** (BE chưa có RequestsController, FE dùng mock `FS.db`).
- **Module 6: Workspace Chat & Documents** (BE chưa mở SignalR Hubs và Upload Service, FE dùng mock `FS.db`).
- **Module 7: Dashboard Stats, Reports & System Logs** (BE chưa có DashboardController, FE dùng mock `FS.db`).

---

## 5. Rủi ro & Điểm cần Lưu ý (Risks & Gotchas)

1. **Rủi ro Chuyển đổi State Frontend**: Cần loại bỏ triệt để các hàm đọc/ghi `FS.db` (LocalStorage) khi chuyển từng trang JS sang kết nối REST API.
2. **Tối ưu hóa Truy vấn Read-Only**: Áp dụng `.AsNoTracking()` cho các API đọc danh sách Task/Project để tránh lãng phí RAM.
3. **CORS Configuration**: Đảm bảo domain Frontend trên Vercel/Production được khai báo đúng trong `CorsSettings:AllowedOrigins`.

---

## 6. Danh sách Task Tiếp theo (Next Tasks in MASTER_TODO.md)

1. **Task M2.1**: Hoàn thiện `ProjectsController.cs` với các API CRUD đầy đủ và API gán thành viên dự án (`ProjectMembers`).
2. **Task M2.2**: Chuyển đổi file `app/js/pages/projects.js` từ `FS.db` sang kết nối API `/api/v1/projects`.
3. **Task M2.3**: Viết hàm đồng bộ danh sách dự án động trên Sidebar App Shell (`app.html`).

---

## 7. Điều kiện Bắt đầu Module 2 (Module 2 Entry Criteria)

- [x] **Criterion 1**: Baseline Release (v0.1.0) và Milestone Review đã xuất bản và nghiệm thu.
- [x] **Criterion 2**: Solution build 100% không lỗi (0 errors).
- [x] **Criterion 3**: SQL Server LocalDB đã nạp sẵn dữ liệu dự án mẫu *"FlowSpace Platform v2"* (`FS-001`).
- [x] **Criterion 4**: Toàn bộ 10 file tài liệu kỹ thuật đồng bộ 100% với source code hiện tại.
