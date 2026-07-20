# KẾ HOẠCH TỔNG THỂ TÍCH HỢP HỆ THỐNG FLOWSPACE (MASTER TODO PLAN)

Tài liệu này là Kế hoạch Tổng thể điều phối toàn bộ quá trình phát triển và hoàn thiện hệ thống FlowSpace. 
> **Lưu ý**: Tài liệu này **tích hợp và tham chiếu trực tiếp** tất cả các mục công việc dở dang từ file gốc [TODO.md](file:///e:/flowspace-fe/TODO.md), giữ nguyên tính kế thừa và mở rộng lộ trình chi tiết.
> **QUYẾT ĐỊNH ĐÃ CHỐT**: Hệ thống sử dụng duy nhất **POSTGRESQL** (chuyển provider từ `UseSqlite` sang `UseNpgsql`, cấu hình Render PostgreSQL Instance cho môi trường Production).

---

## BẢNG THAM CHIẾU VÀ ĐỐI CHIẾU MỤC CÔNG VIỆC TỪ `TODO.md` GỐC

| Mục trong `TODO.md` gốc | Hạng mục Master TODO tương ứng | Trạng thái | Module / Task |
|---|---|---|---|
| **Module 2: `projects.js` sang API** | Task M2.1: Chuyển đổi `projects.js` sang kết nối API RESTful `/api/v1/projects` | ⏳ Chờ làm | Module 2 (Projects) |
| **Module 2: Thêm dự án, gán thành viên**| Task M2.2: Bổ sung DTOs, API gán thành viên dự án và Modal gán quyền | ⏳ Chờ làm | Module 2 (Projects) |
| **Module 2: Đồng bộ Sidebar `app.html`**| Task M2.3: Viết hàm fetch dynamic Project List render trên Sidebar App Shell | ⏳ Chờ làm | Module 2 (Projects) |
| **Module 3: Chuyển `tasks.js` & `kanban.js`**| Task M3.1: Xây dựng `TasksController` BE và nối API cho `tasks.js`, `kanban.js` | ⏳ Chờ làm | Module 3 (Tasks & Kanban) |
| **Module 3: Thay LocalStorage Gantt & Calendar**| Task M3.2: Nối API dữ liệu cho `gantt.js` và `calendar.js` | ⏳ Chờ làm | Module 3 (Tasks & Kanban) |
| **Module 3: Cập nhật trạng thái kéo thả Kanban**| Task M3.3: Tích hợp API `PATCH /api/v1/tasks/{id}/status` khi drop trên SortableJS | ⏳ Chờ làm | Module 3 (Tasks & Kanban) |
| **Module 3: Drawer xem/sửa `task-detail.js`**| Task M3.4: Đồng bộ Offcanvas detail task với Backend APIs | ⏳ Chờ làm | Module 3 (Tasks & Kanban) |
| **Module 4: Đồng bộ Time Logs lên Backend**| Task M4.1: Xây dựng `TimeTrackingController` BE và chuyển `timetracking.js` | ⏳ Chờ làm | Module 4 (Time Tracking) |
| **Module 5: Chat kết nối SignalR**| Task M5.1: Mở SignalR `ChatHub` và tích hợp WebSocket client trên `chat.js` | ⏳ Chờ làm | Module 5 (Chat Workspace) |

---

## DỰ AN KẾ HOẠCH MASTER TODO CHI TIẾT THEO CÁC BƯỚC THỰC THI

### 🔵 BƯỚC 0: HOÀN THIỆN HẠ TẦNG DATABASE & EF CORE (Giai đoạn Nền tảng - P0)
- [x] **Task M0.1 (Mở rộng)**: 
  - 1. Chuyển provider trong `FlowSpace.Persistence/DependencyInjection.cs` từ `UseSqlite` sang `UseSqlServer`.
  - 2. Cập nhật `ConnectionStrings:DefaultConnection` trong `appsettings.json` và `appsettings.Development.json` cho SQL Server (LocalDB `(localdb)\mssqllocaldb`).
  - 3. Bổ sung các `DbSet` còn thiếu (`Projects`, `ProjectMembers`, `Tasks`, `Subtasks`, `Requests`, `Approvals`, `TimeLogs`, `Comments`) trong [FlowSpaceDbContext.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Contexts/FlowSpaceDbContext.cs) khớp với `DATABASE_SETUP.sql`.
  - 4. Tạo EF Core Migration mới (`InitialSqlServerCreate`) phản ánh đúng `DATABASE_SETUP.sql` và đã áp dụng database.
- [x] **Task M0.3 (Seed Data Mẫu - Projects & Tasks)**: Mở rộng [DbInitializer.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/DbInitializer.cs) bổ sung seed dữ liệu mẫu cho Projects (dự án "FlowSpace Platform v2" mã `FS-001`), Tasks, Subtasks, Requests, Approvals theo đúng kịch bản trong `DEMO_GUIDE.md` và `seed-data.js`.
- [x] **Task M0.S1 (Bảo mật - Ưu tiên High, trước khi Deploy)**: Loại bỏ hardcoded fallback secret key trong [Program.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Program.cs), bắt buộc đọc từ Configuration/Environment Variable.

---

### ⚙️ HẠ TẦNG CLEANUP & TỐI ƯU (Làm sau, không chặn tính năng)
- [ ] **Task M0.2 (Fluent API Configuration Cleanup)**: Tách các class EntityConfiguration độc lập trong `FlowSpace.Persistence/Configurations/` để làm sạch `FlowSpaceDbContext.cs`.

### 🟢 BƯỚC 1: TÍCH HỢP MODULE 2 - PROJECT MANAGEMENT (P0)
*(Tham chiếu trực tiếp Mục 1 trong [TODO.md](file:///e:/flowspace-fe/TODO.md))*
- [x] **Task M2.1**: Hoàn thiện `ProjectsController.cs` với các API CRUD và API gán thành viên.
- [x] **Task M2.2**: Chuyển đổi file [projects.js](file:///e:/flowspace-fe/app/js/pages/projects.js) từ `FS.db` (LocalStorage) sang gọi `/api/v1/projects`.
- [x] **Task M2.3**: Viết hàm đồng bộ hiển thị danh sách dự án động trên Sidebar chính ([app.html](file:///e:/flowspace-fe/app/app.html)).

### 🟢 BƯỚC 2: TÍCH HỢP MODULE 3 - TASK & KANBAN MANAGEMENT (P0)
*(Tham chiếu trực tiếp Mục 2 trong [TODO.md](file:///e:/flowspace-fe/TODO.md))*
- [x] **Task M3.1**: Xây dựng `TasksController.cs`, `ITaskService` và `TaskService` trong Backend .NET 9.
- [x] **Task M3.2**: Chuyển đổi [tasks.js](file:///e:/flowspace-fe/app/js/pages/tasks.js) và [kanban.js](file:///e:/flowspace-fe/app/js/pages/kanban.js) sang gọi API thật.
- [x] **Task M3.3**: Thay thế LocalStorage trong [gantt.js](file:///e:/flowspace-fe/app/js/pages/gantt.js) và [calendar.js](file:///e:/flowspace-fe/app/js/pages/calendar.js).
- [x] **Task M3.4**: Tích hợp API `PATCH /api/v1/tasks/{id}/status` cập nhật trạng thái kéo thả Kanban qua SortableJS.
- [x] **Task M3.5**: Hoàn thiện Drawer xem nhanh và chỉnh sửa task trong [task-detail.js](file:///e:/flowspace-fe/app/js/components/task-detail.js).

### 🟡 BƯỚC 3: TÍCH HỢP MODULE 4 - TIME TRACKING (P1)
*(Tham chiếu trực tiếp Mục 3 trong [TODO.md](file:///e:/flowspace-fe/TODO.md))*
- [x] **Task M4.1**: Xây dựng `TimeTrackingController.cs` và `TimeLogService.cs` ghi nhận Time Logs lên Backend database.
- [x] **Task M4.2**: Chuyển đổi bộ đếm giờ và manual log trong [timetracking.js](file:///e:/flowspace-fe/app/js/pages/timetracking.js) sang gọi API.

### 🟡 BƯỚC 4: TÍCH HỢP MODULE 5 - REQUESTS, APPROVALS & WORKFLOW ENGINE (P0)
- [x] **Task M5.1**: Xây dựng `RequestsController.cs` và `ApprovalsController.cs`.
- [x] **Task M5.2**: Triển khai `WorkflowEngineService` xử lý phân cấp duyệt tự động theo hạn mức.
- [x] **Task M5.3**: Chuyển đổi [requests.js](file:///e:/flowspace-fe/app/js/pages/requests.js) và [approvals.js](file:///e:/flowspace-fe/app/js/pages/approvals.js) sang API thật.

### 🟣 BƯỚC 5: TÍCH HỢP MODULE 6 - CHAT WORKSPACE & DOCUMENTS (P1)
*(Tham chiếu trực tiếp Mục 4 trong [TODO.md](file:///e:/flowspace-fe/TODO.md))*
- [x] **Task M6.1**: Kích hoạt `ChatHub` và `NotificationHub` SignalR real-time trong Backend `Program.cs`.
- [x] **Task M6.2**: Chuyển đổi [chat.js](file:///e:/flowspace-fe/app/js/pages/chat.js) kết nối trực tiếp SignalR Client.
- [x] **Task M6.3**: Triển khai Upload Service và `DocumentsController.cs`, chuyển đổi [documents.js](file:///e:/flowspace-fe/app/js/pages/documents.js).

### 🟣 BƯỚC 6: TÍCH HỢP MODULE 7 - DASHBOARD, REPORTS & AUDIT LOGS (P1)
- [x] **Task M7.1**: Xây dựng `DashboardController.cs` tổng hợp các chỉ số KPI, task quá hạn.
- [x] **Task M7.2**: Chuyển đổi [dashboard.js](file:///e:/flowspace-fe/app/js/pages/dashboard.js), [reports.js](file:///e:/flowspace-fe/app/js/pages/reports.js), [users.js](file:///e:/flowspace-fe/app/js/pages/users.js), [logs.js](file:///e:/flowspace-fe/app/js/pages/logs.js) gọi API thật.
