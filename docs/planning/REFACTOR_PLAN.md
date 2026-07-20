# KẾ HOẠCH TÁI CẤU TRÚC VÀ TÍCH HỢP HỆ THỐNG FLOWSPACE (REFACTOR PLAN)

Tài liệu này chi tiết hóa lộ trình nâng cấp, tái cấu trúc và hoàn thiện hệ thống FlowSpace theo chuẩn **Clean Architecture** và **RESTful API**, chuẩn bị cho việc chuyển đổi toàn bộ Frontend khỏi `localStorage`.

---

## GIAI ĐOẠN 1: CHUẨN HÓA HẠ TẦNG BACKEND & CORE DATABASE (Phase 1)

### Task 1.1: Bổ sung DbSet & Đã cấu hình Entity Framework Core Provider
- **Sub Task 1.1.1**: Khai báo đầy đủ các `DbSet` cho `Projects`, `Tasks`, `Subtasks`, `Requests`, `Approvals`, `Comments`, `TimeLogs` vào file `FlowSpaceDbContext.cs`.
- **Sub Task 1.1.2**: Cấu hình linh hoạt EF Core Provider trong `DependencyInjection.cs` hỗ trợ cả SQLite (Development) và SQL Server (Production).
- **Dependency**: Không có.
- **Priority**: High (P0).
- **Estimated Impact**: Đảm bảo EF Core quản lý đầy đủ các bảng dữ liệu nghiệp vụ.
- **Affected Files**:
  - [FlowSpaceDbContext.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Contexts/FlowSpaceDbContext.cs)
  - [DependencyInjection.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/DependencyInjection.cs)
  - [appsettings.json](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/appsettings.json)
- **Rollback Strategy**: Khôi phục lại bản `FlowSpaceDbContext.cs` cũ chỉ chứa `Users` và `UserRefreshTokens`.

### Task 1.2: Cấu hình Fluent API Model Builder & Constraints
- **Sub Task 1.2.1**: Tạo các Entity Configuration classes cho từng Entity trong `FlowSpace.Persistence/Configurations`.
- **Sub Task 1.2.2**: Đảm bảo các chỉ mục (Indexes) và ràng buộc khóa ngoại (Foreign Keys với NO ACTION xóa lặp) đúng theo `DATABASE_SETUP.sql`.
- **Dependency**: Task 1.1.
- **Priority**: High (P0).
- **Estimated Impact**: Tránh lỗi Runtime FK Cascade và tối ưu tốc độ truy vấn SQL.
- **Affected Files**:
  - `FlowSpace.Persistence/Configurations/*.cs` [NEW]
  - [FlowSpaceDbContext.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Persistence/Contexts/FlowSpaceDbContext.cs)
- **Rollback Strategy**: Xóa các file Configuration mới tạo và bỏ gọi `ApplyConfigurationsFromAssembly`.

---

## GIAI ĐOẠN 2: TÍCH HỢP HOÀN THIỆN TẦNG APPLICATION & APIS (Phase 2)

### Task 2.1: Hoàn thiện Projects API & Tích hợp Frontend (Module 2)
- **Sub Task 2.1.1**: Bổ sung API Phân quyền thành viên Dự án và Quản lý Trạng thái Dự án vào `ProjectsController.cs`.
- **Sub Task 2.1.2**: Chuyển đổi `app/js/pages/projects.js` gọi API Backend `/api/v1/projects` thay cho `FS.db`.
- **Sub Task 2.1.3**: Đồng bộ danh sách Project List trên Sidebar `app.html`.
- **Dependency**: Task 1.1.
- **Priority**: High (P0).
- **Estimated Impact**: Dự án được lưu trữ và quản lý tập trung trên SQL Server database.
- **Affected Files**:
  - [ProjectsController.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Controllers/ProjectsController.cs)
  - [IProjectService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Interfaces/IProjectService.cs)
  - [ProjectService.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Application/Services/ProjectService.cs)
  - [projects.js](file:///e:/flowspace-fe/app/js/pages/projects.js)
  - [app.html](file:///e:/flowspace-fe/app/app.html)
- **Rollback Strategy**: Giữ cờ fallback `FS.db` trong `projects.js` nếu API trả lỗi.

### Task 2.2: Xây dựng Tasks, Subtasks & Kanban APIs (Module 3)
- **Sub Task 2.2.1**: Tạo `ITaskService` và `TaskService` trong Application Layer thực hiện CRUD Task, Subtask, cập nhật trạng thái kéo thả Kanban.
- **Sub Task 2.2.2**: Tạo `TasksController.cs` expose các RESTful endpoints: `/api/v1/tasks`, `PATCH /api/v1/tasks/{id}/status`, `PATCH /api/v1/tasks/{id}/dates`.
- **Sub Task 2.2.3**: Chuyển đổi `tasks.js`, `kanban.js`, `gantt.js`, `calendar.js`, `task-detail.js` sang kết nối API thật.
- **Dependency**: Task 2.1.
- **Priority**: High (P0).
- **Estimated Impact**: Hoàn thiện module cốt lõi quản lý công việc và Kanban/Gantt real-time.
- **Affected Files**:
  - `TasksController.cs` [NEW]
  - `ITaskService.cs` [NEW]
  - `TaskService.cs` [NEW]
  - [tasks.js](file:///e:/flowspace-fe/app/js/pages/tasks.js)
  - [kanban.js](file:///e:/flowspace-fe/app/js/pages/kanban.js)
  - [gantt.js](file:///e:/flowspace-fe/app/js/pages/gantt.js)
  - [calendar.js](file:///e:/flowspace-fe/app/js/pages/calendar.js)
  - [task-detail.js](file:///e:/flowspace-fe/app/js/components/task-detail.js)
- **Rollback Strategy**: Tách biệt route API mới và giữ nguyên hàm rendering của Frontend.

### Task 2.3: Xây dựng Time Tracking API (Module 4)
- **Sub Task 2.3.1**: Tạo `TimeTrackingController.cs` và `TimeLogService.cs` xử lý ghi nhận Time Logs (Start/Stop timer và Manual log).
- **Sub Task 2.3.2**: Chuyển đổi `timetracking.js` sang kết nối API thật.
- **Dependency**: Task 2.2.
- **Priority**: Medium (P1).
- **Estimated Impact**: Đồng bộ chính xác số giờ làm việc thực tế của nhân viên.
- **Affected Files**:
  - `TimeTrackingController.cs` [NEW]
  - `TimeLogService.cs` [NEW]
  - [timetracking.js](file:///e:/flowspace-fe/app/js/pages/timetracking.js)
- **Rollback Strategy**: Tạm thời ghi log giờ làm vào `sessionStorage` nếu chưa có kết nối DB.

### Task 2.4: Xây dựng Requests, Approvals & Workflow Engine (Module 5)
- **Sub Task 2.4.1**: Tạo `RequestsController.cs`, `ApprovalsController.cs` và `WorkflowEngineService.cs` xử lý duyệt tự động nhiều cấp theo hạn mức.
- **Sub Task 2.4.2**: Chuyển đổi `requests.js` và `approvals.js` gọi API thật.
- **Dependency**: Task 1.1.
- **Priority**: High (P0).
- **Estimated Impact**: Chuẩn hóa toàn bộ quy trình phê duyệt nghỉ phép, mua sắm của công ty.
- **Affected Files**:
  - `RequestsController.cs` [NEW]
  - `ApprovalsController.cs` [NEW]
  - `WorkflowService.cs` [NEW]
  - [requests.js](file:///e:/flowspace-fe/app/js/pages/requests.js)
  - [approvals.js](file:///e:/flowspace-fe/app/js/pages/approvals.js)
- **Rollback Strategy**: Lưu bản ghi Request ở dạng `Pending` cục bộ.

---

## GIAI ĐOẠN 3: REALTIME CHAT, DOCUMENTS & DASHBOARD (Phase 3)

### Task 3.1: Kích hoạt SignalR Hubs & Chat Workspace (Module 6)
- **Sub Task 3.1.1**: Mở comment và hoàn thiện `ChatHub.cs` & `NotificationHub.cs` trong `FlowSpace.Api/Hubs`.
- **Sub Task 3.1.2**: Tích hợp `chat.js` với kết nối SignalR Client Javascript.
- **Dependency**: Task 1.1.
- **Priority**: Medium (P1).
- **Estimated Impact**: Hỗ trợ trao đổi công việc và bắn thông báo real-time.
- **Affected Files**:
  - [Program.cs](file:///e:/flowspace-fe/backend/src/FlowSpace.Api/Program.cs)
  - `ChatHub.cs` [NEW]
  - [chat.js](file:///e:/flowspace-fe/app/js/pages/chat.js)
- **Rollback Strategy**: Tắt kết nối WebSocket và quay lại mô hình Chat tĩnh.

### Task 3.2: File Storage Service & Document Management (Module 7)
- **Sub Task 3.2.1**: Xây dựng `FileStorageService` (lưu file đĩa `/wwwroot/uploads`).
- **Sub Task 3.2.2**: Tạo `DocumentsController.cs` hỗ trợ Upload, Download, Phân quyền và Versioning.
- **Sub Task 3.2.3**: Chuyển đổi `documents.js` gọi API thật.
- **Dependency**: Task 1.1.
- **Priority**: Medium (P1).
- **Estimated Impact**: Quản lý lưu trữ tài liệu an toàn.
- **Affected Files**:
  - `DocumentsController.cs` [NEW]
  - `FileStorageService.cs` [NEW]
  - [documents.js](file:///e:/flowspace-fe/app/js/pages/documents.js)
- **Rollback Strategy**: Giới hạn upload file chỉ lưu thông tin metadata.

### Task 3.3: Dashboard & System Reports APIs (Module 8)
- **Sub Task 3.3.1**: Tạo `DashboardController.cs` tổng hợp stats KPI, task quá hạn, hoạt động gần đây.
- **Sub Task 3.3.2**: Chuyển đổi `dashboard.js`, `reports.js`, `users.js`, `logs.js` gọi API thật.
- **Dependency**: Task 2.1, 2.2, 2.3, 2.4.
- **Priority**: Medium (P1).
- **Estimated Impact**: Cung cấp bức tranh tổng thể cho Ban Giám đốc.
- **Affected Files**:
  - `DashboardController.cs` [NEW]
  - `ReportsController.cs` [NEW]
  - [dashboard.js](file:///e:/flowspace-fe/app/js/pages/dashboard.js)
  - [reports.js](file:///e:/flowspace-fe/app/js/pages/reports.js)
- **Rollback Strategy**: Sử dụng hàm tính toán client-side trên dữ liệu đã fetch.
