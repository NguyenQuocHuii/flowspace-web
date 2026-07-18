# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DOCUMENT)

Hệ thống lưu trữ trên **SQL Server** sử dụng các cấu trúc bảng đã chuẩn hóa quan hệ.

---

## 1. Sơ đồ thực thể chính (Schema Entities)

| Tên Bảng | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|
| **Users** | `Id` (GUID) | Không | Lưu thông tin người dùng, mật khẩu đã băm |
| **UserRefreshTokens**| `Id` (GUID) | `UserId` -> Users | Lưu các phiên làm việc & Refresh Token |
| **Projects** | `Id` (GUID) | `OwnerId` -> Users | Lưu thông tin các dự án, tiến độ tự tính |
| **ProjectMembers** | `(ProjectId, UserId)` | Nhiều-nhiều liên kết | Bảng trung gian phân quyền thành viên dự án |
| **Tasks** | `Id` (GUID) | `ProjectId`, `AssigneeId` | Lưu thông tin công việc, số giờ log |
| **Subtasks** | `Id` (GUID) | `TaskId` -> Tasks | Lưu việc phụ |

---

## 2. Views tối ưu báo cáo
1. `v_ProjectProgress`: Tự động gom nhóm các task của dự án để tính tiến trình trung bình dựa trên trạng thái `done`.
2. `v_UserPerformance`: Gom nhóm thời gian thực số giờ log và số task hoàn thành của nhân viên.

---

## 3. Triggers tự động
* `tr_UpdateProjectProgress`: Kích hoạt sau mỗi thay đổi trạng thái của task để cập nhật trực tiếp tiến độ dự án mà không cần xử lý ở Application layer.
