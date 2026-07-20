# BÁO CÁO KIỂM THỬ TOÀN DIỆN (QA_REPORT_FINAL.md)

Dưới đây là bảng đánh giá chất lượng các tính năng tích hợp kết nối máy chủ của hệ thống FlowSpace sau quá trình nâng cấp và loại bỏ dữ liệu ảo.

| Bước | Vai trò | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| **1. Kiểm tra Dashboard** | Giám đốc / Nhân viên | ✅ Hoạt động đúng | Số liệu các thẻ thống kê dự án, công việc và biểu đồ được lấy thời gian thực từ API máy chủ (`/api/v1/dashboard/summary`), không còn dùng dữ liệu cứng. |
| **2. Tạo Project & F5** | Trưởng phòng / Giám đốc | ✅ Hoạt động đúng | Tạo dự án thành công thông qua API, khi F5 tải lại trang, dự án mới vẫn tồn tại và hiển thị chính xác trong danh sách lấy từ database. |
| **3. Kanban & Tasks Sync** | Trưởng nhóm / Nhân viên | ✅ Hoạt động đúng | Công việc được cập nhật trạng thái thời gian thực thông qua API `PATCH /api/v1/tasks/{id}/status` khi kéo thả. Khi chuyển trang Tasks, trạng thái được giữ nguyên. |
| **4. Chat thời gian thực (SignalR)** | Tất cả vai trò | ✅ Hoạt động đúng | Tin nhắn được truyền phát WebSocket real-time qua SignalR Hub. Khi User A nhắn, User B nhận được ngay lập tức ở kênh chung mà không cần nhấn F5. |
| **5. Phê duyệt theo Quy tắc động** | Nhân viên / Người duyệt | ✅ Hoạt động đúng | Khi tạo Request, Workflow Engine tra cứu quy tắc từ bảng `WorkflowRules` để sinh ra chuỗi cấp duyệt tương ứng thay vì 4 cấp hardcode. |
| **6. Đồng bộ Cài đặt (Settings)** | Giám đốc | ✅ Hoạt động đúng | Các mục cấu hình quy trình duyệt và cài đặt hệ thống được lưu trữ trực tiếp trên máy chủ qua API REST thay vì lưu trong LocalStorage riêng của máy. |
| **7. Tài liệu nhị phân (Documents)** | Nhân viên | ✅ Hoạt động đúng | Tệp tin tải lên được đọc thành mảng byte[] lưu trực tiếp trong cơ sở dữ liệu PostgreSQL bền vững và phục vụ tải xuống qua dynamic endpoint. |
| **8. Responsive (375px & 1440px)** | Tất cả vai trò | ✅ Hoạt động đúng | Giao diện hiển thị tốt trên cả giao diện Desktop và Mobile, tự động ẩn/hiện cột bên trái và thu gọn sidebar điều hướng. |

---

*Báo cáo được tạo tự động để xác nhận trạng thái tích hợp hoàn tất.*
