# KỊCH BẢN TRÌNH DIỄN DỰ ÁN (DEMO PLAYBOOK)

Tài liệu này cung cấp danh sách tài khoản demo và kịch bản từng bước để người đánh giá (Investors/Clients/Mentors) có thể trải nghiệm toàn bộ tính năng của FlowSpace ngay lập tức.

---

## 1. Danh sách Tài khoản Trình diễn (Demo Accounts)

Hệ thống đã được nạp sẵn (Seed Data) các tài khoản sau trong cả Frontend (LocalStorage) và Backend (SQL Server Database):

| Vai trò | Tên hiển thị | Email đăng nhập | Mật khẩu | Bộ phận | Quyền hạn |
|---|---|---|---|---|---|
| **Director (Admin)** | Phạm Thanh Dung | `admin@flowspace.demo` | `123456` | Ban giám đốc | Toàn quyền, Xem Logs |
| **Manager** | Lê Minh Cường | `truongphong@flowspace.demo` | `123456` | Kỹ thuật | Xem báo cáo Q3, duyệt đơn |
| **Team Lead** | Trần Thị Bình | `truongnhom@flowspace.demo` | `123456` | Kỹ thuật | Quản lý dự án, Gantt Chart |
| **Employee** | Nguyễn Văn An | `nhanvien@flowspace.demo` | `123456` | Kỹ thuật | Làm task, log time, chat |

*Mẹo: Giao diện đăng nhập tĩnh tại `login.html` hỗ trợ nút nhấp điền nhanh (1-click fill) cho tất cả tài khoản trên.*

---

## 2. Kịch bản chạy Demo từng bước (Demo Walkthroughs)

### Kịch bản 1: Quản lý công việc (Employee)
1. Đăng nhập bằng tài khoản **Nguyễn Văn An** (Employee).
2. Vào tab **Kanban** -> Thực hiện kéo thả thẻ nhiệm vụ *"Implement Chart.js Dashboard"* từ cột **In Progress** sang **Review**.
3. Vào tab **Time Tracking** -> Nhấn nút **Start Timer** để bắt đầu tính giờ làm việc thực tế cho dự án *"FlowSpace Platform v2"*, sau đó nhập Note và ghi nhận giờ log.

### Kịch bản 2: Quản lý tiến độ dự án (Team Lead / Manager)
1. Đăng nhập bằng tài khoản **Trần Thị Bình** (Team Lead).
2. Truy cập tab **Projects** -> Xem tiến độ dự án tự động tăng/giảm dựa trên các task con đã hoàn thành.
3. Mở tab **Gantt Chart** -> Kéo thanh tiến trình công việc trực quan trên timeline hoặc xem đường găng (Critical Path) tính toán tự động.

### Kịch bản 3: Luồng Phê duyệt Đơn từ (Workflow & Approval)
1. Đăng nhập bằng tài khoản **Nguyễn Văn An** (Employee).
2. Vào mục **Requests** -> Nhấn **New Request** -> Chọn loại **Leave Request (Nghỉ phép)**. Nhập thông tin *"Nghỉ phép cá nhân 2 ngày"* và nhấn gửi.
3. Đăng xuất và đăng nhập lại bằng **Trần Thị Bình** (Team Lead).
4. Vào mục **Approvals** -> Bạn sẽ thấy đơn của An xuất hiện. Nhập nhận xét và nhấn **Approve**.
5. Làm tương tự với tài khoản **Lê Minh Cường** (Manager) để phê duyệt cấp cuối cùng. Trạng thái đơn của An sẽ tự động cập nhật thành **Approved** trên toàn hệ thống.

### Kịch bản 4: Soạn thảo Tài liệu & Chat Workspace (Collaboration)
1. Vào tab **Documents** -> Nhấn tạo mới một trang tài liệu Notion-style, gõ tiêu đề và viết nội dung, tài liệu tự động lưu trữ.
2. Vào tab **Chat** -> Nhấn vào kênh `#chung` và gõ tin nhắn chào mừng hoặc phản hồi emoji trực tiếp.
