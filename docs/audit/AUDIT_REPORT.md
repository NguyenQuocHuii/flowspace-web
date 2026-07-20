# BÁO CÁO AUDIT VÀ ĐỐI CHIẾU 3 CHIỀU HỆ THỐNG FLOWSPACE (AUDIT REPORT)

Tài liệu này tổng hợp kết quả Audit kỹ thuật độc lập dựa trên việc đối chiếu 3 chiều giữa:
1. **Source Code Thực tế** (`/app` và `/backend/src`)
2. **Hệ thống Tài liệu Kỹ thuật** (`BACKEND_DESIGN.md`, `FRONTEND_ANALYSIS.md`, `API_DOCUMENT.md`, `DATABASE.md`, `DATABASE_SETUP.sql`, `TODO.md`, `BUG_LIST.md`, `FIX_LIST.md`)
3. **Yêu cầu Phần mềm Gốc (Baseline Requirements)** từ Giảng viên/Khách hàng.

---

## 1. Danh mục CÁC MỤC ĐÃ LÀM ĐÚNG (Done Correctly)

- **Module 1 (Authentication) Tích hợp Hoàn chỉnh**:
  - Giao diện `login.html` gọi thành công API Backend `POST /api/v1/auth/login`.
  - Cơ chế Refresh Token (`POST /api/v1/auth/refresh-token`) và Logout (`POST /api/v1/auth/logout`) vận hành đúng quy chuẩn JWT (Access token 15 phút, Refresh token 7 ngày).
  - Khắc phục thành công 8 lỗi tích hợp (BUG-001 đến BUG-008) như đã ghi nhận trong `BUG_LIST.md` và `FIX_LIST.md` (bao gồm xử lý muối BCrypt seed data, CORS production, sửa script DDL database).
- **Cấu trúc Domain Entity Backend**:
  - Đã xây dựng đầy đủ các Entities cốt lõi trong `FlowSpace.Domain/Entities`: `User`, `UserRefreshToken`, `Project`, `TaskItem`, `Subtask`, `Request`, `Approval`, `Comment`, `TimeLog`.
- **Giao diện Frontend SPA Notion-Style**:
  - Đã phát triển hoàn chỉnh toàn bộ 15 trang HTML fragments và 15 file JavaScript tương ứng, với thiết kế giao diện Notion-style hiện đại, hỗ trợ Dark Mode và Responsive.
- **Xử lý Ngoại lệ & Logging**:
  - Backend đã tích hợp `GlobalExceptionMiddleware` trả về định dạng JSON lỗi thống nhất và `Serilog` ghi log hệ thống ra file cuộn theo ngày.

---

## 2. Danh mục ĐÃ LÀM NHƯNG LỆCH TÀI LIỆU (Done but Differs from Docs)

| Hạng mục Audit | Code Thực tế | Tài liệu Kỹ thuật (`BACKEND_DESIGN.md` / `DATABASE.md`) | Mức độ lệch & Ảnh hưởng |
|---|---|---|---|
| **Cấu hình Database Provider** | Đang dùng **SQLite** (`UseSqlite` trong `DependencyInjection.cs`, connection string `Data Source=FlowSpace.db`). | Chỉ định **SQL Server** với script `DATABASE_SETUP.sql` và `DATABASE.md`. | **Trung bình**: Cần cấu hình linh hoạt hỗ trợ cả SQL Server sản xuất và SQLite phát triển local. |
| **Khai báo DbContext Sets** | `FlowSpaceDbContext.cs` chỉ khai báo `DbSet<User>` và `DbSet<UserRefreshToken>`. | `DATABASE.md` và Entity Domain quy định đầy đủ `Projects`, `Tasks`, `Requests`, `Approvals`, `TimeLogs`. | **Nghiêm trọng**: EF Core không thể tạo bảng hay query trực tiếp các thực thể nghiệp vụ khác nếu không khai báo DbSet. |
| **Kiến trúc AuthController** | `AuthController.cs` tiêm trực tiếp `FlowSpaceDbContext` để CRUD dữ liệu. | `BACKEND_DESIGN.md` quy định mọi Controller đều tương tác qua Application Layer (Service / Repository / MediatR). | **Nhẹ**: Chưa tuân thủ 100% Clean Architecture layering ở Auth module. |
| **Cấu trúc Controller Projects** | `ProjectsController.cs` dùng `IProjectService`. Thư mục `Features/Projects` hiện trống (chưa dùng MediatR). | `BACKEND_DESIGN.md` quy định sử dụng CQRS pattern với MediatR Commands/Queries. | **Trung bình**: Cần thống nhất pattern triển khai service hoặc MediatR cho toàn bộ dự án. |
| **File `search-modal.js`** | Là file stub wrapper (10 dòng), logic thật nằm ở `notifications.js` (`FS.searchModule`). | `FRONTEND_ANALYSIS.md` ghi nhận từng là file rỗng. | **Đã rõ**: Không còn là bug, nhưng cần tài liệu hóa vai trò wrapper. |

---

## 3. Danh mục TÀI LIỆU ĐÃ LỖI THỜI SO VỚI CODE (Docs Outdated vs Code)

- **`TODO.md`**:
  - Ghi nhận `Module 1: Authentication` là mục tiêu đang làm, trong khi thực tế code `auth.js` và `AuthController.cs` đã tích hợp API thật 100%.
- **`API_DOCUMENT.md`**:
  - Hiện mới chỉ mô tả các endpoint của `AuthController` và `GET /api/v1/projects`. Thiếu đặc tả các endpoint CRUD đầy đủ của Projects, Tasks, Requests, Approvals, Time Tracking.
- **`DATABASE.md`**:
  - Chưa bổ sung mô tả cho bảng `UserRefreshTokens` (dù script `DATABASE_SETUP.sql` và code `UserRefreshToken.cs` đã có).

---

## 4. Danh mục CÒN THIẾU SO VỚI YÊU CẦU PHẦN MỀM GIẢNG VIÊN (Missing vs Baseline)

| Yêu cầu Giảng viên (Requirements Baseline) | Hiện trạng Code Thực tế | Đánh giá Mức độ Thiếu hụt |
|---|---|---|
| **1. Dashboard APIs** | FE hiển thị widget từ `localStorage`. BE chưa có `DashboardController` tổng hợp chỉ số. | Thiếu API tổng hợp stats & recent activities. |
| **2. Projects API đầy đủ** | BE có `ProjectsController` cơ bản. FE chưa chuyển đổi gọi API thật. | Thiếu phân quyền thành viên dự án, quản lý ngân sách, tài liệu đính kèm dự án qua API. |
| **3. Tasks / Kanban / Gantt / Calendar APIs** | BE CHƯA CÓ `TasksController`. FE hoàn toàn dùng `localStorage`. | Thiếu API CRUD Task, Subtask, Dependency, chuyển trạng thái kéo thả Kanban/Gantt. |
| **4. Time Tracking APIs** | BE CHƯA CÓ `TimeTrackingController`. FE đếm giờ và lưu `localStorage`. | Thiếu API lưu trữ Time Log, tổng hợp số giờ làm theo nhân viên/dự án. |
| **5. Requests & Approvals Workflow Engine**| BE CHƯA CÓ `RequestsController` và `ApprovalsController`. | Thiếu Engine duyệt tự động theo hạn mức (SLA, rẽ nhánh) trên Backend. |
| **6. Document Management & Upload Service** | BE chưa có API Upload file (`MultipartFormData`) và `DocumentsController`. | Thiếu File Storage Service (Local/S3) và API phân quyền/phiên bản tài liệu. |
| **7. Chat Workspace & Realtime SignalR** | BE có thư mục SignalR nhưng các Hubs (`ChatHub`, `NotificationHub`) đang bị comment. | Thiếu kết nối SignalR real-time, lưu trữ tin nhắn chat vào database. |
| **8. Reports & Audit Logs APIs** | BE chưa có API trích xuất báo cáo KPI và xem System Audit Logs. | Thiếu API xuất dữ liệu báo cáo & nhật ký hệ thống. |
| **9. System Settings & Configuration APIs** | BE chưa có API lưu trữ cấu hình SLA, Categories, Notification Templates. | Thiếu API quản lý cấu hình hệ thống trên SQL Server. |
