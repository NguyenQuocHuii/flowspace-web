# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DOCUMENT)

Hệ thống cơ sở dữ liệu FlowSpace vận hành trên **SQL Server** (Development: SQL Server LocalDB `(localdb)\mssqllocaldb`, Production: SQL Server Instance) thông qua Entity Framework Core 8.0.

---

## 1. Sơ đồ Thực thể Chính (Schema Entities & Constraints)

| Tên Bảng (Table) | Khóa Chính (PK) | Khóa Ngoại (FK) & Hành động Xóa | Mô tả |
|---|---|---|---|
| **Users** | `Id` (GUID) | Không | Thông tin người dùng, mật khẩu băm BCrypt, vai trò, phòng ban |
| **UserRefreshTokens**| `Id` (GUID) | `UserId` -> `Users` (CASCADE) | Quản lý phiên JWT Refresh Token và vô hiệu hóa token |
| **Projects** | `Id` (GUID) | `OwnerId` -> `Users` (NO ACTION) | Thông tin dự án, mã UQ, thời gian, ngân sách, % tiến độ |
| **ProjectMembers** | `(MembersId, ProjectId)` | `ProjectId` -> `Projects` (CASCADE)<br>`MembersId` -> `Users` (CASCADE) | Bảng trung gian liên kết thành viên tham gia dự án |
| **Tasks** | `Id` (GUID) | `ProjectId` -> `Projects` (CASCADE)<br>`AssigneeId` -> `Users` (SET NULL)<br>`CreatedBy` -> `Users` (NO ACTION) | Quản lý công việc, độ ưu tiên, hạn hoàn thành, số giờ làm |
| **Subtasks** | `Id` (GUID) | `TaskId` -> `Tasks` (CASCADE) | Danh sách việc phụ nhỏ gắn với Task chính |
| **Comments** | `Id` (GUID) | `TaskId` -> `Tasks` (CASCADE)<br>`UserId` -> `Users` (CASCADE) | Bình luận và trao đổi trực tiếp trên Task |
| **TimeLogs** | `Id` (GUID) | `TaskId` -> `Tasks` (CASCADE)<br>`UserId` -> `Users` (CASCADE)<br>`ProjectId` -> `Projects` (NO ACTION) | Nhật ký ghi nhận số giờ làm việc thực tế |
| **Requests** | `Id` (GUID) | `RequesterId` -> `Users` (CASCADE) | Đơn yêu cầu (Nghỉ phép, Mua sắm, Tăng ca, Remote) |
| **Approvals** | `Id` (GUID) | `RequestId` -> `Requests` (CASCADE)<br>`ApproverId` -> `Users` (NO ACTION) | Các bước phê duyệt đơn nhiều cấp (*đã sửa BUG-005*) |

---

## 2. Chỉ mục Tối ưu hóa Truy vấn (Non-Clustered Indexes)

- `IX_Users_Email`: Unique Index trên `Users(Email)`.
- `IX_Projects_Code`: Unique Index trên `Projects(Code)`.
- `IX_Projects_OwnerId`: Index trên `Projects(OwnerId)`.
- `IX_Tasks_Code`: Unique Index trên `Tasks(Code)`.
- `IX_Tasks_ProjectId`, `IX_Tasks_AssigneeId`, `IX_Tasks_CreatedBy`: Indexes tăng tốc truy vấn task theo dự án/người phụ trách.
- `IX_UserRefreshTokens_UserId`: Index truy vấn token theo user.
- `IX_Requests_RequesterId`, `IX_Approvals_RequestId`, `IX_Approvals_ApproverId`: Indexes tăng tốc truy vấn đơn và phê duyệt.

---

## 3. Seed Data Mẫu trong DB (`DbInitializer.cs`)

1. **Users**: 4 tài khoản demo đầy đủ vai trò (`Director`, `Manager`, `TeamLead`, `Employee`).
2. **Projects**: 1 dự án mẫu `"FlowSpace Platform v2"` (Mã `FS-001`).
3. **Tasks**: 6 công việc phủ đủ 4 cột Kanban (`Todo`, `InProgress`, `Review`, `Done`).
4. **Subtasks & Comments**: 6 việc phụ và 2 bình luận trao đổi.
5. **Requests & Approvals**: 1 đơn xin nghỉ phép 2 ngày kèm chuỗi duyệt 4 cấp (`team_lead` -> `manager` -> `manager` -> `director`).
