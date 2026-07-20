# AUDIT_INDEPENDENT (Kiểm toán Độc lập Giao tiếp API & Cơ sở dữ liệu)

| Tệp tin | Dòng | Vấn đề phát hiện | Mức độ |
| :--- | :--- | :--- | :--- |
| `backend/src/FlowSpace.Persistence/DependencyInjection.cs` | 15 | Sử dụng SQLite (`UseSqlite`) làm Database lưu trữ thay vì SQL Server như các tài liệu `.md` mô tả. | **High** |
| `render.yaml` | 13 | File database SQLite `flowspace.db` nằm trực tiếp trong Container và triển khai trên Render Free Tier không có Persistent Disk (sẽ mất sạch dữ liệu sau mỗi lần deploy/restart). | **Critical** |
| `app/js/pages/chat.js` | 19, 24, 37, 48 | Module Chat hoạt động 100% bằng LocalStorage thông qua `FS.db`, hoàn toàn không có kết nối API hoặc SignalR thời gian thực. | **Critical** |
| `app/js/pages/settings.js` | 54-57, 225, 300, 342, 394 | Các tab Danh mục, Quy trình phê duyệt, SLA, Mẫu thông báo lưu trữ 100% trên LocalStorage, không đồng bộ với Backend. | **High** |
| `backend/src/FlowSpace.Application/Services/WorkflowService.cs` | 102 | Hardcode các bước phê duyệt cố định `new[] { "team_lead", "manager", "manager", "director" }` cho mọi loại Request, bỏ qua hoàn toàn cài đặt động của người dùng. | **High** |
| `app/js/pages/dashboard.js` | 41 | Lỗi gọi Dashboard summary API âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/projects.js` | 56, 287 | Lỗi gọi API lấy danh sách và lưu dự án âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/tasks.js` | 61, 264 | Lỗi gọi API lấy danh sách và lưu Task âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/kanban.js` | 65 | Lỗi gọi Kanban Tasks API âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/gantt.js` | 58 | Lỗi gọi Gantt API âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/calendar.js` | 48 | Lỗi gọi Calendar API âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/timetracking.js` | 54, 212 | Lỗi gọi API lấy danh sách và lưu Time Logs âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/requests.js` | 56, 230, 298 | Lỗi gọi API lấy danh sách, duyệt và tạo Request âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/approvals.js` | 60, 156 | Lỗi gọi API lấy danh sách và duyệt Request của Approver âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/components/task-detail.js` | 53 | Lỗi gọi chi tiết Task API âm thầm fallback về LocalStorage. | **Medium** |
| `app/js/pages/documents.js` | 205-228 | Tải tệp tin (Module Documents) nếu API Upload lỗi sẽ âm thầm lưu trữ cục bộ vào LocalStorage (lưu Base64/Fake URL) thay vì hiển thị lỗi thực sự cho người dùng. | **Medium** |
