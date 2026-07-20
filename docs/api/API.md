# TÀI LIỆU RESTFUL API HỆ THỐNG FLOWSPACE (API SUMMARY)

Tài liệu này tổng hợp danh sách các RESTful APIs và SignalR Realtime Hubs đang được phát triển và vận hành trên Backend .NET 9 (`FlowSpace.Api`). Tham chiếu chi tiết đặc tả JSON request/response tại [API_DOCUMENT.md](file:///e:/flowspace-fe/API_DOCUMENT.md).

---

## 1. Module 1: Authentication (`/api/v1/auth`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Anonymous | Đăng nhập tài khoản, nhận Access Token (15m) & Refresh Token (7d) |
| `/api/v1/auth/register` | `POST` | Anonymous | Đăng ký tài khoản người dùng mới |
| `/api/v1/auth/refresh-token` | `POST` | Anonymous | Làm mới Access Token đã hết hạn từ Refresh Token |
| `/api/v1/auth/logout` | `POST` | Bearer Token | Đăng xuất và vô hiệu hóa toàn bộ Refresh Token của user |
| `/api/v1/auth/forgot-password`| `POST` | Anonymous | Yêu cầu gửi mã khôi phục mật khẩu |
| `/api/v1/auth/reset-password` | `POST` | Anonymous | Đặt lại mật khẩu mới với reset token |

---

## 2. Module 2: Projects (`/api/v1/projects`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/projects` | `GET` | Bearer Token | Lấy danh sách tất cả các dự án (kèm Owner & Members) |
| `/api/v1/projects/{id}` | `GET` | Bearer Token | Lấy thông tin chi tiết một dự án theo GUID |
| `/api/v1/projects` | `POST` | Bearer Token | Tạo dự án mới |
| `/api/v1/projects/{id}` | `PUT` | Bearer Token | Cập nhật thông tin dự án |
| `/api/v1/projects/{id}` | `DELETE` | Bearer Token | Xóa dự án |
| `/api/v1/projects/{id}/members` | `POST` | Bearer Token | Cập nhật/gán danh sách thành viên dự án |
| `/api/v1/projects/{id}/members/{userId}` | `DELETE` | Bearer Token | Gỡ thành viên ra khỏi dự án |

---

## 3. Module 3: Tasks & Kanban (`/api/v1/tasks`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/tasks` | `GET` | Bearer Token | Lấy danh sách Task (lọc theo `projectId`, `status`, `assigneeId`) |
| `/api/v1/tasks/{id}` | `GET` | Bearer Token | Lấy chi tiết Task theo GUID (kèm Subtasks & Comments) |
| `/api/v1/tasks` | `POST` | Bearer Token | Tạo Task mới |
| `/api/v1/tasks/{id}` | `PUT` | Bearer Token | Cập nhật thông tin Task |
| `/api/v1/tasks/{id}/status` | `PATCH` | Bearer Token | Cập nhật nhanh trạng thái Task (kéo thả Kanban) |
| `/api/v1/tasks/{id}` | `DELETE` | Bearer Token | Xóa Task |
| `/api/v1/tasks/{id}/subtasks` | `POST` | Bearer Token | Thêm Subtask cho Task |
| `/api/v1/tasks/subtasks/{subtaskId}/toggle` | `PATCH` | Bearer Token | Bật/tắt trạng thái hoàn thành Subtask |
| `/api/v1/tasks/subtasks/{subtaskId}` | `DELETE` | Bearer Token | Xóa Subtask |
| `/api/v1/tasks/{id}/comments` | `POST` | Bearer Token | Thêm bình luận cho Task |

---

## 4. Module 4: Time Tracking (`/api/v1/timetracking/logs`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/timetracking/logs` | `GET` | Bearer Token | Lấy danh sách log giờ làm (lọc theo `userId`, `taskId`, `fromDate`, `toDate`) |
| `/api/v1/timetracking/logs` | `POST` | Bearer Token | Ghi nhận log giờ làm mới (tự động cộng dồn `LoggedHours` của Task) |
| `/api/v1/timetracking/logs/{id}` | `DELETE` | Bearer Token | Xóa bản ghi log giờ làm |

---

## 5. Module 5: Requests & Approvals (`/api/v1/requests`, `/api/v1/approvals`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/requests` | `GET` | Bearer Token | Lấy danh sách Yêu cầu (lọc theo `requesterId`, `status`) |
| `/api/v1/requests/{id}` | `GET` | Bearer Token | Lấy chi tiết Yêu cầu và chuỗi Phê duyệt nhiều cấp |
| `/api/v1/requests` | `POST` | Bearer Token | Tạo Yêu cầu mới (tự khởi tạo chuỗi duyệt 4 cấp) |
| `/api/v1/approvals/pending` | `GET` | Bearer Token | Lấy danh sách các Yêu cầu đang chờ người dùng hiện tại duyệt |
| `/api/v1/approvals/{approvalId}/action` | `POST` | Bearer Token | Thực hiện Phê duyệt (`approved`) hoặc Từ chối (`rejected`) một bước duyệt |

---

## 6. Module 6: Documents & Real-time SignalR Hubs

| Endpoint / Hub Route | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/documents/upload` | `POST` | Bearer Token | Tải tài liệu/tệp tin lên server (lưu tại `wwwroot/uploads/`) |
| `/hubs/chat` | `WS` | Bearer Token | SignalR WebSockets Hub cho chat nhóm real-time |
---

## 7. Module 7: Dashboard Summary (`/api/v1/dashboard/summary`)

| Endpoint | Method | Security | Mô tả |
|---|---|---|---|
| `/api/v1/dashboard/summary` | `GET` | Bearer Token | Lấy tổng hợp các chỉ số KPI, dự án active, task quá hạn, số đơn chờ duyệt và tổng giờ làm |
