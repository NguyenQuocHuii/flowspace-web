# BÁO CÁO KIỂM THỬ TOÀN DIỆN (TEST REPORT)

Tài liệu này ghi nhận kết quả kiểm thử hệ thống FlowSpace (Frontend và Backend API) đóng vai trò là một QA Engineer.

---

## 1. Kết quả kiểm thử theo Phân hệ (Module Test Results)

| Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kết quả thực tế (Actual Result) | Trạng thái (Status) |
|---|---|---|---|
| **Authentication** | Nhấp tài khoản demo để đăng nhập qua API. | Nhận JWT Token, lưu sessionStorage, redirect sang dashboard thành công. | **PASS** |
| **Dashboard** | Hiển thị các chỉ số thống kê công việc, dự án. | Hiển thị đầy đủ biểu đồ cột hoạt động & tiến trình. | **PASS** (LocalStorage) |
| **Project** | Tạo dự án mới, gán thành viên, thay đổi trạng thái. | Lưu thành công vào LocalStorage, chưa đồng bộ lên SQL Server DB. | **WARN** (Chưa nối API) |
| **Task & Kanban** | Kéo thả công việc giữa các cột Todo -> Done. | Kéo thả SortableJS chạy mượt mà, cập nhật trạng thái lập tức. | **WARN** (Chưa nối API) |
| **Approval** | Gửi yêu cầu mua sắm/nghỉ phép và duyệt qua các cấp. | Đơn phê duyệt được lưu cục bộ, chạy đúng quy trình phê duyệt mẫu. | **WARN** (Chưa nối API) |
| **Document** | Tạo thư mục, viết tài liệu văn bản dạng Notion. | Soạn thảo WYSIWYG hoạt động tốt, lưu cục bộ. | **WARN** (Chưa nối API) |
| **Notification** | Lọc tìm kiếm nhanh và đếm số thông báo chưa đọc. | Hiển thị bong bóng số đếm chính xác. | **PASS** (Cục bộ) |
| **Profile & Settings**| Thay đổi thông tin cá nhân và cấu hình SLA. | Cập nhật dữ liệu cấu hình cục bộ thành công. | **PASS** (Cục bộ) |

---

## 2. Kết quả kiểm tra hạ tầng & kỹ thuật (Technical Audits)

### 🖥️ Console & Network
* **Console**: Không có lỗi đỏ (Zero Red Errors) xuất hiện trên trình duyệt ở trang Đăng nhập và Dashboard.
* **Network**: Request `POST /api/v1/auth/login` gửi nhận gói tin JSON chuẩn, thời gian phản hồi nhanh (< 50ms ở localhost). Tự động chặn và báo lỗi 401/403 nếu cố tình gọi các API Projects mà không đính kèm Bearer Token.

### ⚡ Performance & Responsive
* **Performance**: Điểm hiệu năng cao do Frontend sử dụng HTML/CSS tĩnh tối giản kết hợp jQuery gọn nhẹ. Không có hiện tượng giật lag khung hình khi kéo thả Kanban.
* **Responsive**: Giao diện co giãn tốt trên các khung hình Mobile (iPhone/Android) và Desktop thông qua Media Queries của thiết kế Notion-Style và lưới Bootstrap. Sidebar tự động thu gọn ở thiết bị di động.

### 🛡️ An ninh (Security)
* **JWT**: Token được băm bằng thuật toán HmacSha256 bảo mật cao.
* **CORS**: Đã khóa chặn an toàn theo cấu hình và chỉ mở cổng cho các URL đáng tin cậy.
* **Mật khẩu**: BCrypt băm mật khẩu khi người dùng đăng ký mới, bảo vệ thông tin mật khẩu ở database.
