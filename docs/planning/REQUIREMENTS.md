# YÊU CẦU PHẦN MỀM HỆ THỐNG FLOWSPACE (REQUIREMENTS BASELINE)

Tài liệu này lưu trữ nguyên văn Yêu cầu Phần mềm từ Giảng viên/Khách hàng làm căn cứ đối chiếu (baseline) cho toàn bộ kiến trúc, mã nguồn và kế hoạch phát triển dự án FlowSpace.

---

## 1. Yêu cầu Chức năng (Functional Requirements)

1. **Dashboard**: Viết/việc được giao, đang làm, sắp hạn, quá hạn; danh sách dự án tham gia; yêu cầu chờ duyệt; thông báo mới; lịch làm việc; biểu đồ tiến độ & năng suất làm việc.
2. **Quản lý Dự án**: 
   - Thao tác CRUD (Tạo, Đọc, Cập nhật, Xóa) dự án, đóng/lưu trữ dự án.
   - Phân quyền thành viên, trưởng dự án.
   - Quản lý thời gian, ngân sách, độ ưu tiên, tài liệu gắn với dự án, % hoàn thành.
   - Các trường dữ liệu (Fields): Mã dự án, Tên dự án, Khách hàng, Ngày bắt đầu, Ngày kết thúc, Trạng thái, Tiến độ (%), Trưởng dự án (Quản lý), Thành viên, Ngân sách, Ghi chú.
3. **Quản lý Công việc (Tasks)**:
   - Tạo, phân công công việc, tạo sub-task, đặt deadline, độ ưu tiên, độ khó.
   - Theo dõi thời gian dự kiến và thời gian thực tế.
   - Đính kèm tệp tin, bình luận, lịch sử thay đổi, chấm điểm công việc.
   - Trạng thái công việc: Chưa bắt đầu, Đang làm, Đang chờ, Hoàn thành, Hủy.
4. **Kanban Board**:
   - Các cột trạng thái: Todo, In Progress, Review, Testing, Done.
   - Kéo thả công việc trực quan giữa các cột.
   - Bộ lọc theo Nhân viên, Dự án, Phòng ban.
   - Màu sắc phân biệt theo độ ưu tiên.
5. **Gantt Chart**:
   - Trực quan hóa timeline dự án, mối quan hệ phụ thuộc giữa các task (dependencies), milestone (cột mốc).
   - Hiển thị % hoàn thành, đường găng (critical path).
   - Kéo thả trực tiếp để thay đổi thời gian task.
6. **Calendar (Lịch biểu)**:
   - Chế độ xem theo Ngày / Tuần / Tháng.
   - Hiển thị deadline công việc, lịch họp, nghỉ phép, sự kiện công ty.
7. **Quản lý Tài liệu**:
   - Upload, Download, quản lý phiên bản (version control), chia sẻ, phân quyền truy cập, xem trước (preview).
   - Hỗ trợ các định dạng tệp: Word, Excel, PDF, Hình ảnh, Video.
8. **Chat Nội bộ (Workspace Chat)**:
   - Trò chuyện Cá nhân (Direct Message), Nhóm, Theo Dự án, Theo Task.
   - Đính kèm ảnh, file, biểu cảm emoji, sticker, nhắc tên (@mention), phản hồi (reply), thu hồi tin nhắn, ghim tin nhắn, tìm kiếm nội dung chat.
9. **Thông báo (Notifications)**:
   - Cảnh báo task mới, bình luận mới, mention, yêu cầu/duyệt mới, task sắp hạn hoặc quá hạn.
   - Đa kênh thông báo: In-app (giao diện), Email, SMS, Push notifications.
10. **Quản lý Yêu cầu (Requests)**:
    - Các loại yêu cầu: Nghỉ phép, Mua hàng, Thanh toán, Tạm ứng, Cấp thiết bị, Hỗ trợ IT/Kỹ thuật, Sửa chữa, Tuyển dụng, Tăng ngân sách.
    - Các trường dữ liệu (Fields): Mã yêu cầu, Loại yêu cầu, Người tạo, Người phụ trách/duyệt, Độ ưu tiên, Nội dung chi tiết, Tệp đính kèm, Ngày tạo.
11. **Quy trình Phê duyệt (Approvals)**:
    - Workflow nhiều cấp phê duyệt (ví dụ: Nhân viên -> Trưởng nhóm -> Trưởng phòng -> Ban Giám đốc).
    - Thao tác: Chuyển tiếp, Từ chối, Trả lại, Hủy yêu cầu.
    - Nhận thông báo tự động và ghi vết lịch sử phê duyệt.
12. **Workflow Engine (Động)**:
    - Tự thiết kế quy trình theo điều kiện linh hoạt (ví dụ: Mua sắm >100tr -> Ban Giám đốc duyệt; <100tr -> Trưởng phòng duyệt).
    - Hỗ trợ rẽ nhánh điều kiện, duyệt song song, duyệt tuần tự, thiết lập thời hạn cam kết SLA và deadline xử lý.
13. **Time Tracking (Ghi nhận giờ làm)**:
    - Tính năng bấm giờ: Start / Pause / Resume / Stop.
    - Ghi nhận giờ làm thủ công (manual log).
    - Báo cáo tổng hợp số giờ làm theo Nhân viên, Dự án, Công việc.
14. **Báo cáo & Thống kê (Reports & Analytics)**:
    - Báo cáo tiến độ dự án, hiệu suất làm việc nhân viên, số task hoàn thành / quá hạn, khối lượng công việc, đánh giá KPI, tổng số giờ làm.
    - Thống kê yêu cầu & phê duyệt.
    - Hỗ trợ xuất dữ liệu ra file Excel, PDF, CSV.
15. **Quản lý Người dùng & Phân quyền**:
    - Quản lý thông tin Nhân viên, Phòng ban, Chức vụ, Nhóm quyền.
    - Phân quyền chi tiết theo Module, Menu, Dự án, Công việc, Phòng ban.
16. **Nhật ký Hệ thống (System Audit Logs)**:
    - Ghi vết hành vi: Đăng nhập / Đăng xuất, Tạo / Sửa / Xóa task, Phê duyệt yêu cầu, Upload tài liệu, Chat.
17. **Tìm kiếm Thông minh (Global Search)**:
    - Tìm kiếm toàn văn (Full-text search) toàn bộ hệ thống.
    - Bộ lọc nâng cao theo loại đối tượng, thời gian.
    - Lưu điều kiện tìm kiếm thường dùng.
18. **Cấu hình Hệ thống (System Settings)**:
    - Quản lý danh mục loại dự án, loại công việc, loại yêu cầu.
    - Cấu hình quy trình duyệt mẫu, mức ưu tiên, thời gian SLA, mẫu thông báo / email / biểu mẫu.
    - Phân quyền người dùng.
    - Hỗ trợ tích hợp hệ thống ngoài: Email Gateway, Microsoft Teams, Slack, ERP, CRM, HRM.
19. **Mobile Application**:
    - Dashboard di động, quản lý công việc, chat real-time, duyệt yêu cầu nhanh, thông báo tức thời (push), theo dõi tiến độ dự án, chấm công di động, upload tệp từ camera/thiết bị.

---

## 2. Giá trị & Lợi ích Doanh nghiệp

- **Quản lý tập trung**: Đưa toàn bộ hoạt động dự án, công việc và giao tiếp về một nền tảng duy nhất.
- **Chuẩn hóa quy trình**: Phê duyệt động và tự động hóa luồng làm việc liên phòng ban.
- **Tăng tính phối hợp**: Giảm thiểu thất lạc thông tin nhờ Workspace Chat & Document Management.
- **Theo dõi thời gian thực**: Giúp Ban Quản lý ra quyết định dựa trên dữ liệu báo cáo chính xác.
- **Khả năng mở rộng**: Sẵn sàng tích hợp sâu với các hệ thống doanh nghiệp sẵn có (ERP/CRM/HRM).
