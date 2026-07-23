# BÁO CÁO AUDIT TỐI ƯU HÓA HỆ THỐNG FLOWSPACE (2026)

Báo cáo này tập trung đánh giá sâu về hiệu năng, khả năng tối ưu hóa công cụ tìm kiếm (SEO), khả năng tiếp cận (Accessibility), và mức độ bảo mật/sẵn sàng vận hành (Production-readiness) của dự án FlowSpace dựa trên mã nguồn thực tế tại thư mục `fe/` và `be/`.

---

## DANH SÁCH CÁC VẤN ĐỀ PHÁT HIỆN

### [Mức độ: High] Thiếu Rate Limiter cho các API nghiệp vụ cốt lõi
- **File liên quan**: [Program.cs](file:///e:/flowspace-fe/be/src/FlowSpace.Api/Program.cs#L91-L102)
- **Vì sao ảnh hưởng**: Hệ thống chỉ cấu hình Rate Limiter cho policy `"auth-api"` (đăng nhập/đăng ký). Toàn bộ các API nghiệp vụ cốt lõi khác (tạo/chỉnh sửa dự án, cập nhật task, bình luận...) không được giới hạn tần suất gọi, khiến hệ thống dễ bị tấn công từ chối dịch vụ (DDoS) hoặc spam dữ liệu làm cạn kiệt tài nguyên database.
- **Đề xuất fix**: Cấu hình thêm Global Rate Limiter Policy hoặc áp dụng thuộc tính `[EnableRateLimiting]` cho toàn bộ các API Controller nghiệp vụ khác.

### [Mức độ: High] Bỏ qua HTTPS Metadata trong cấu hình xác thực JWT trên Production
- **File liên quan**: [Program.cs](file:///e:/flowspace-fe/be/src/FlowSpace.Api/Program.cs#L125)
- **Vì sao ảnh hưởng**: Thiết lập `jwtOptions.RequireHttpsMetadata = false;` cho phép truyền tải token qua giao thức HTTP không mã hóa. Điều này tạo điều kiện thuận lợi cho các cuộc tấn công nghe lén, đánh cắp token của người dùng (Man-in-the-Middle) khi chạy thực tế trên internet.
- **Đề xuất fix**: Đổi thành `RequireHttpsMetadata = true;` khi chạy ứng dụng trên môi trường Production bằng cách kiểm tra môi trường `builder.Environment.IsDevelopment()`.

### [Mức độ: High] Chặn hiển thị giao diện do sử dụng `@import` CSS lồng nhau
- **File liên quan**: [landing.css](file:///e:/flowspace-fe/fe/css/landing.css#L11)
- **Vì sao ảnh hưởng**: Sử dụng `@import "design-system.css";` bắt buộc trình duyệt phải tải xong `landing.css`, phân tích mã nguồn rồi mới gửi request tải tiếp `design-system.css`, tạo ra chuỗi yêu cầu tuần tự (waterfall delay) kéo dài thời gian First Contentful Paint (FCP) và Largest Contentful Paint (LCP).
- **Đề xuất fix**: Loại bỏ cú pháp `@import` trong CSS và khai báo cả hai tệp CSS độc lập trực tiếp bằng các thẻ `<link rel="stylesheet">` song song trong phần `<head>` của `index.html`.

### [Mức độ: High] Chặn hiển thị do `@import` Google Fonts trực tuyến
- **File liên quan**: [design-system.css](file:///e:/flowspace-fe/fe/css/design-system.css#L6)
- **Vì sao ảnh hưởng**: `@import url(...)` font chữ từ server Google nằm ở đầu tệp CSS làm trì hoãn quá trình hiển thị trang cho đến khi font chữ tải xong, đồng thời gây ra hiện tượng nhấp nháy văn bản (FOUT) khi trình duyệt đổi font mặc định sang Inter.
- **Đề xuất fix**: Chuyển liên kết Google Fonts sang sử dụng thẻ `<link rel="preconnect">` và `<link rel="stylesheet">` đặt trực tiếp trong file HTML để tải font bất đồng bộ và tối ưu LCP.

### [Mức độ: Medium] Tự động chạy Migration cơ sở dữ liệu khi khởi động ứng dụng
- **File liên quan**: [Program.cs](file:///e:/flowspace-fe/be/src/FlowSpace.Api/Program.cs#L195-L199)
- **Vì sao ảnh hưởng**: Gọi `dbContext.Database.Migrate();` tự động khi ứng dụng khởi chạy có thể dẫn đến xung đột khóa dữ liệu (database table locks) nếu scale ứng dụng ra nhiều instances trên môi trường production, đồng thời làm tăng đáng kể thời gian khởi động (startup time) của container trên Render.
- **Đề xuất fix**: Tách biệt bước chạy migration thành một job/step độc lập trong luồng CI/CD trước khi kích hoạt deploy instance ứng dụng mới.

### [Mức độ: Medium] Thiếu thuộc tính kích thước ảnh gây dịch chuyển bố cục (CLS)
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L126), [index.html:L215](file:///e:/flowspace-fe/fe/index.html#L215), [index.html:L229](file:///e:/flowspace-fe/fe/index.html#L229), [index.html:L243](file:///e:/flowspace-fe/fe/index.html#L243)
- **Vì sao ảnh hưởng**: Các thẻ hiển thị hình ảnh mockup không khai báo thuộc tính kích thước cứng (`width` và `height`). Khi trang đang tải, trình duyệt không thể tính toán trước không gian trống, dẫn đến bố cục trang bị nhảy lệch (Cumulative Layout Shift - CLS) đột ngột khi các tệp ảnh tải xong.
- **Đề xuất fix**: Bổ sung rõ thuộc tính `width`, `height` hoặc thiết lập tỉ lệ hiển thị `aspect-ratio` trực tiếp trong style CSS cho các ảnh mockup này.

### [Mức độ: Medium] Thiếu cơ chế điều hướng bằng bàn phím cho Carousel và Tablist
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L248-L264)
- **Vì sao ảnh hưởng**: Các nút điều hướng quy trình được gán `role="tab"` theo chuẩn WAI-ARIA nhưng thiếu mã xử lý sự kiện lắng nghe bàn phím (Arrow keys). Người khuyết tật sử dụng bàn phím không thể chuyển qua lại giữa các tab quy trình bằng phím mũi tên Trái/Phải.
- **Đề xuất fix**: Viết thêm sự kiện lắng nghe `keydown` trên tablist trong file JavaScript để chuyển trạng thái kích hoạt của tab khi nhấn phím mũi tên.

### [Mức độ: Medium] Thiếu thẻ Canonical URL để chuẩn hóa tìm kiếm
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L1-L38)
- **Vì sao ảnh hưởng**: Việc thiếu thẻ `<link rel="canonical">` khiến công cụ tìm kiếm (như Google) có thể hiểu nhầm và phạt lỗi trùng lặp nội dung (duplicate content) nếu trang web được lập chỉ mục qua nhiều tên miền phụ hoặc có tham số truy vấn khác nhau.
- **Đề xuất fix**: Bổ sung thẻ `<link rel="canonical" href="https://flowspace-fe.vercel.app/">` trong phần đầu `<head>`.

### [Mức độ: Low] Thiếu tối ưu mức độ ưu tiên tải ảnh LCP (Largest Contentful Paint)
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L126)
- **Vì sao ảnh hưởng**: Ảnh chụp mockup Dashboard (`dashboard_mockup.png`) là phần tử lớn nhất trên màn hình đầu tiên khi người dùng mở trang chủ (LCP Element) nhưng chưa được tối ưu hóa tải trước, khiến chỉ số LCP của trang bị kéo dài.
- **Đề xuất fix**: Thêm thuộc tính `fetchpriority="high"` và `loading="eager"` để báo hiệu cho trình duyệt tải ảnh này với độ ưu tiên cao nhất ngay khi dựng DOM.

### [Mức độ: Low] Thiếu thuộc tính alt mô tả nội dung cho các hình ảnh quy trình
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L215), [index.html:L229](file:///e:/flowspace-fe/fe/index.html#L229), [index.html:L243](file:///e:/flowspace-fe/fe/index.html#L243)
- **Vì sao ảnh hưởng**: Các hình ảnh minh họa quy trình ở Step 1, 2, 3 thiếu thuộc tính `alt` mô tả, khiến các trình đọc màn hình (Screen Readers) cho người khiếm thị không thể diễn đạt được nội dung hình ảnh, vi phạm tiêu chuẩn tiếp cận WCAG 2.1 AA.
- **Đề xuất fix**: Bổ sung thuộc tính `alt` chứa nội dung mô tả vắn tắt cho mỗi ảnh (ví dụ: `alt="Ảnh chụp màn hình bảng Kanban phân chia công việc"`).

### [Mức độ: Low] Thiếu dữ liệu cấu trúc Schema Markup (JSON-LD) để tối ưu hóa SEO
- **File liên quan**: [index.html](file:///e:/flowspace-fe/fe/index.html#L1-L38)
- **Vì sao ảnh hưởng**: Thiếu thẻ Schema Markup khiến các công cụ tìm kiếm không phân tích được đây là một ứng dụng phần mềm (SoftwareApplication) hay doanh nghiệp (Organization), làm giảm cơ hội xuất hiện ở định dạng Rich Snippet bắt mắt trên trang kết quả tìm kiếm.
- **Đề xuất fix**: Thêm đoạn mã JSON-LD chuẩn `<script type="application/ld+json">` mô tả ứng dụng FlowSpace ở phần đầu của tệp HTML.
