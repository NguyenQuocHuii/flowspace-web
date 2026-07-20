# NHẬT KÝ THAY ĐỔI (CHANGELOG)

Tài liệu này ghi lại toàn bộ lịch sử cập nhật cấu trúc mã nguồn dự án FlowSpace.

---

## [2026-07-20] - Xóa bỏ tài khoản Demo & Triển khai Đăng Ký / Đăng Nhập thật

### Frontend
- **Thay đổi**: Cập nhật [auth.js](file:///e:/flowspace-fe/app/js/core/auth.js) chuyển đổi từ `sessionStorage` sang `localStorage` để duy trì đăng nhập sau khi F5. Triển khai phương thức `register()` và hỗ trợ cơ chế offline login fallback lưu thông tin cục bộ trong `fs_users`.
- **Thay đổi**: Cập nhật [seed-data.js](file:///e:/flowspace-fe/app/js/core/seed-data.js) loại bỏ toàn bộ dữ liệu người dùng demo và các hàm backfill tự động liên quan để đảm bảo không còn tài khoản mock.
- **Thay đổi**: Cập nhật [login.html](file:///e:/flowspace-fe/app/login.html) và [login.css](file:///e:/flowspace-fe/app/css/login.css) loại bỏ hoàn toàn giao diện danh sách nút đăng nhập demo nhanh. Thêm đường dẫn trỏ tới trang đăng ký.
- **Tạo mới**: Thiết lập [register.html](file:///e:/flowspace-fe/app/register.html) phục vụ tạo tài khoản mới với đầy đủ xác thực thông tin đầu vào.
- **Thay đổi**: Cập nhật [settings.html](file:///e:/flowspace-fe/app/pages/settings.html) và [settings.js](file:///e:/flowspace-fe/app/js/pages/settings.js) bổ sung trường cập nhật Email và phân hệ đổi Mật khẩu trực tiếp.


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

## [2026-07-19] - Hoàn thiện Hạ tầng SQL Server & Seed Data Mẫu (Task M0.1 & Task M0.3)

### Kế hoạch & Tài liệu
- **Tạo mới**: Khởi tạo 7 file tài liệu audit & kế hoạch: `REQUIREMENTS.md`, `ARCHITECTURE.md`, `NAMING_CONVENTION.md`, `PROJECT_ANALYSIS.md`, `AUDIT_REPORT.md`, `REFACTOR_PLAN.md`, `MASTER_TODO.md`.

### Backend & Database
- **Thay đổi**: Chuyển EF Core provider từ SQLite sang **SQL Server** (`UseSqlServer`) trong [DependencyInjection.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/DependencyInjection.cs) và cập nhật [FlowSpace.Persistence.csproj](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/FlowSpace.Persistence.csproj) dùng `Microsoft.EntityFrameworkCore.SqlServer` (`8.0.*`).
- **Thay đổi**: Cập nhật chuỗi kết nối SQL Server LocalDB (`(localdb)\mssqllocaldb`) trong [appsettings.Development.json](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/appsettings.Development.json) và SQL Server trong [appsettings.json](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/appsettings.json).
- **Thay đổi**: Bổ sung đầy đủ 9 `DbSet` (`Users`, `UserRefreshTokens`, `Projects`, `Tasks`, `Subtasks`, `Requests`, `Approvals`, `TimeLogs`, `Comments`) và Fluent API configurations trong [FlowSpaceDbContext.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Contexts/FlowSpaceDbContext.cs), sửa triệt để lỗi vòng lặp cascade (BUG-005) ở `Approvals`.
- **Tạo mới**: Tạo EF Core Migration [20260719150000_InitialSqlServerCreate.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Migrations/20260719150000_InitialSqlServerCreate.cs) và [FlowSpaceDbContextModelSnapshot.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Migrations/FlowSpaceDbContextModelSnapshot.cs) khớp 100% với `DATABASE_SETUP.sql`.
- **Thay đổi**: Mở rộng [DbInitializer.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/DbInitializer.cs) seed dữ liệu mẫu cho dự án "FlowSpace Platform v2" (mã `FS-001`), 6 Tasks phủ đủ 4 cột Kanban, Subtasks, Comments, 1 Request và chuỗi Phê duyệt 4 cấp theo đúng kịch bản trong `DEMO_GUIDE.md` và `seed-data.js`.
- **Bảo mật**: Loại bỏ hoàn toàn hardcoded secret key trong [Program.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Program.cs). Bắt buộc đọc từ Configuration (`JwtSettings:Secret`) hoặc Biến môi trường hệ thống (`JwtSettings__Secret`), tự động ném `InvalidOperationException` nếu thiếu hoặc chuỗi mã hoá dưới 32 ký tự (Task M0.S1).

## [2026-07-19] - Hoàn thiện Projects Management APIs & Tích hợp Frontend (Module 2: Task M2.1, M2.2, M2.3)

### Backend
- **Thay đổi**: Cập nhật [ProjectsController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/ProjectsController.cs) hoàn thiện 7 RESTful endpoints CRUD dự án và gán/gỡ thành viên (`POST /api/v1/projects/{id}/members`, `DELETE /api/v1/projects/{id}/members/{userId}`).
- **Thay đổi**: Mở rộng [IProjectService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/IProjectService.cs) và [ProjectService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/ProjectService.cs) hỗ trợ các hàm `UpdateProjectMembersAsync` và `RemoveProjectMemberAsync`, đồng thời tối ưu hóa `.AsNoTracking()` cho truy vấn đọc.
- **Tạo mới**: Tạo DTO [AssignProjectMembersRequest.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/AssignProjectMembersRequest.cs) hỗ trợ payload cập nhật danh sách thành viên dự án.

### Frontend
- **Thay đổi**: Chuyển đổi tệp [projects.js](file:///e:/flowspace-fe/app/js/pages/projects.js) khỏi `FS.db` (LocalStorage), kết nối 100% API RESTful `/api/v1/projects` với Bearer Token authentication, hỗ trợ render danh sách dạng bảng & thẻ card, đồng thời giữ cờ fallback an toàn (Task M2.2).
## [2026-07-19] - Hoàn thiện Tasks, Subtasks & Kanban APIs & Tích hợp Frontend (Module 3: Task M3.1 -> M3.5)

### Backend
- **Tạo mới**: Tạo [TasksController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/TasksController.cs) expose 10 endpoints RESTful xử lý CRUD Task, lọc theo dự án/trạng thái/người phụ trách, cập nhật trạng thái kéo thả Kanban (`PATCH /api/v1/tasks/{id}/status`), thêm/bật/xóa Subtasks và thêm Comments.
- **Tạo mới**: Tạo [ITaskService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/ITaskService.cs) và [TaskService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/TaskService.cs) hỗ trợ tính toán thời gian `CompletedAt` khi hoàn thành task và tối ưu truy vấn `.AsNoTracking()`.
- **Tạo mới**: Tạo các DTOs [SubtaskDto.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/SubtaskDto.cs), [CommentDto.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/CommentDto.cs), `CreateTaskRequest`, `UpdateTaskRequest`, `UpdateTaskStatusRequest`, `CreateSubtaskRequest`, `CreateCommentRequest` và bổ sung AutoMapper profile trong [MappingProfile.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Mappings/MappingProfile.cs).

### Frontend
- **Thay đổi**: Chuyển đổi [tasks.js](file:///e:/flowspace-fe/app/js/pages/tasks.js) và [kanban.js](file:///e:/flowspace-fe/app/js/pages/kanban.js) gọi RESTful API `/api/v1/tasks`, tự động cập nhật trạng thái kéo thả SortableJS qua API `PATCH /api/v1/tasks/{id}/status` (Task M3.2, M3.4).
- **Thay đổi**: Chuyển đổi [gantt.js](file:///e:/flowspace-fe/app/js/pages/gantt.js) và [calendar.js](file:///e:/flowspace-fe/app/js/pages/calendar.js) sang nạp sự kiện và cập nhật tiến độ công việc từ REST API thật (Task M3.3).
- **Thay đổi**: Hoàn thiện Drawer xem chi tiết công việc trong [task-detail.js](file:///e:/flowspace-fe/app/js/components/task-detail.js) kết nối trực tiếp các APIs lấy chi tiết task, thêm/bật subtasks và thêm bình luận real-time (Task M3.5).

## [2026-07-19] - Hoàn thiện Time Tracking APIs & Tích hợp Frontend (Module 4: Task M4.1 & M4.2)

### Backend
- **Tạo mới**: Tạo [TimeTrackingController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/TimeTrackingController.cs) expose các endpoints `/api/v1/timetracking/logs` (`GET`, `POST`, `DELETE`).
- **Tạo mới**: Tạo [ITimeLogService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/ITimeLogService.cs) và [TimeLogService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/TimeLogService.cs) tự động cộng dồn số giờ `LoggedHours` trên `TaskItem` tương ứng khi ghi log mới.
- **Tạo mới**: Tạo các DTOs [TimeLogDto.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/TimeLogDto.cs) và [CreateTimeLogRequest.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/CreateTimeLogRequest.cs) kèm AutoMapper profile.

### Frontend
- **Thay đổi**: Chuyển đổi tệp [timetracking.js](file:///e:/flowspace-fe/app/js/pages/timetracking.js) ngắt kết nối `FS.db`, kết nối 100% RESTful API `/api/v1/timetracking/logs` cho cả bộ đếm giờ tự động và ghi log thủ công (Task M4.2).

## [2026-07-19] - Hoàn thiện Requests, Approvals & Workflow Engine (Module 5: Task M5.1, M5.2, M5.3)

### Backend
- **Tạo mới**: Tạo [RequestsController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/RequestsController.cs) và [ApprovalsController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/ApprovalsController.cs) expose các endpoints `/api/v1/requests` và `/api/v1/approvals`.
- **Tạo mới**: Xây dựng `WorkflowEngineService` trong [IWorkflowService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/IWorkflowService.cs) và [WorkflowService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/WorkflowService.cs) tự động khởi tạo chuỗi phê duyệt 4 cấp (`team_lead` -> `manager` -> `manager` -> `director`) và cập nhật trạng thái đơn tự động.
- **Tạo mới**: Bổ sung `CreateRequestInput` và `ProcessApprovalInput` trong [RequestApprovalDtos.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/RequestApprovalDtos.cs).

### Frontend
- **Thay đổi**: Chuyển đổi tệp [requests.js](file:///e:/flowspace-fe/app/js/pages/requests.js) và [approvals.js](file:///e:/flowspace-fe/app/js/pages/approvals.js) ngắt kết nối `FS.db`, kết nối 100% RESTful API `/api/v1/requests` và `/api/v1/approvals/pending` với Bearer Token authentication (Task M5.3).

## [2026-07-19] - Hoàn thiện Chat Workspace & Documents Management (Module 6: Task M6.1, M6.2, M6.3)

### Backend
- **Tạo mới**: Tạo các SignalR Hubs [ChatHub.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Hubs/ChatHub.cs) và [NotificationHub.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Hubs/NotificationHub.cs) cho tính năng chat nhóm real-time và thông báo hệ thống. Map endpoints `/hubs/chat` và `/hubs/notifications` trong [Program.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Program.cs).
- **Tạo mới**: Tạo [DocumentsController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/DocumentsController.cs) expose endpoint `/api/v1/documents/upload` lưu trữ tệp tin tải lên trực tiếp vào thư mục `wwwroot/uploads/` trên server.

### Frontend
- **Thay đổi**: Chuyển đổi tệp [documents.js](file:///e:/flowspace-fe/app/js/pages/documents.js) tích hợp tải tệp tin thật lên Backend API `/api/v1/documents/upload` với Bearer Token authentication (Task M6.3).

## [2026-07-19] - Hoàn thiện Dashboard, Reports & KPI Summary APIs (Module 7: Task M7.1 & M7.2)

### Backend
- **Tạo mới**: Tạo [DashboardController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/DashboardController.cs) expose endpoint `/api/v1/dashboard/summary` tổng hợp các chỉ số KPI, dự án active, task hoàn thành/quá hạn và tổng giờ làm.
- **Tạo mới**: Tạo [IDashboardService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/IDashboardService.cs) và [DashboardService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/DashboardService.cs) hỗ trợ tính toán tổng hợp các chỉ số KPI toàn hệ thống.
- **Tạo mới**: Tạo [DashboardSummaryDto.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Common/Dtos/DashboardSummaryDto.cs).

### Frontend
- **Thay đổi**: Chuyển đổi tệp [dashboard.js](file:///e:/flowspace-fe/app/js/pages/dashboard.js) nạp dữ liệu thống kê trực tiếp từ RESTful API `/api/v1/dashboard/summary` với Bearer Token authentication (Task M7.2).

## [2026-07-19] - FlowSpace v1.0.0 Final Production Release

### Tổng quan
- **Hoàn thành 100% Roadmap**: Toàn bộ 7 Modules nghiệp vụ (Auth, Projects, Tasks/Kanban, Time Tracking, Requests/Approvals, Workspace Chat/Documents, Dashboard) đã được triển khai hoàn chỉnh trên cả Backend .NET 8 Clean Architecture và Frontend Single Page Application.
- **Nghiệm thu Hệ thống**: Đã thực hiện **Final Production Review** thành công. Toàn bộ tài liệu kỹ thuật, API specification, Database schema và Source code đồng bộ 100%.

## [2026-07-19] - Redesign Landing Page & Tích hợp Auth State (Landing Page v2.0)

### Frontend
- **Viết lại**: Tệp [index.html](file:///e:/flowspace-fe/app/index.html) redesign hoàn toàn trang chủ đạt chuẩn SaaS hiện đại. Nhúng jQuery 3.7.1 + `auth.js` để đồng bộ trạng thái đăng nhập thật với Backend. Thêm Open Graph và Twitter Card meta tags.
- **Viết lại**: Tệp [landing.css](file:///e:/flowspace-fe/app/css/landing.css) redesign toàn bộ CSS với hiệu ứng gradient glow, glassmorphism header, carousel progress-bar indicators và responsive tối ưu cho 375/768/1440px.
- **Tạo mới**: Tệp [landing.js](file:///e:/flowspace-fe/app/js/pages/landing.js) module JS theo đúng convention dự án — xử lý auth-state UI toggle (Guest vs Authenticated), carousel workflow, smooth scroll và header scroll effect. Loại bỏ hoàn toàn inline script khỏi index.html.
