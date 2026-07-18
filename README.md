# FlowSpace — Không gian làm việc Notion-Style cho đội ngũ hiệu suất cao

FlowSpace là ứng dụng quản lý công việc và dự án cộng tác tối giản theo phong cách Notion. Dự án kết hợp công cụ quản lý Kanban, sơ đồ Gantt, lịch biểu, hệ thống chat nội bộ, soạn thảo tài liệu WYSIWYG và quy trình phê duyệt công việc nhiều cấp.

---

## 🏗️ Kiến trúc dự án (Architecture)

Dự án được xây dựng với mô hình tách biệt Frontend và Backend:
* **Frontend**: Thiết kế dạng Single Page App (SPA) tối giản sử dụng HTML5, CSS3 và Javascript (jQuery, SortableJS, Chart.js).
* **Backend**: Web API chạy trên nền tảng **.NET 9** áp dụng mô hình **Clean Architecture** (Domain, Application, Infrastructure, Persistence, Presentation) kết hợp cơ sở dữ liệu **SQL Server**.

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng dưới Local

### 1. Yêu cầu hệ thống
* Máy tính đã cài đặt **.NET 9 SDK** hoặc cao hơn.
* Trình quản lý cơ sở dữ liệu **SQL Server** và công cụ **SSMS** (SQL Server Management Studio).
* Trình soạn thảo **VS Code** (đã cài đặt extension *Live Server*).

### 2. Thiết lập Cơ sở dữ liệu (SQL Server)
1. Mở phần mềm SSMS và kết nối vào SQL Server cục bộ.
2. Mở file [DATABASE_SETUP.sql](file:///e:/flowspace-fe/DATABASE_SETUP.sql) và chạy (**Execute/F5**) để tạo bảng `FlowSpaceDb` cùng các view, trigger và nạp dữ liệu demo.

### 3. Cấu hình & Khởi chạy Backend API
1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend/src
   ```
2. Cập nhật chuỗi kết nối Database của bạn trong file `appsettings.Development.json` tại mục `ConnectionStrings:DefaultConnection`.
3. Biên dịch và chạy dự án:
   ```bash
   dotnet build
   dotnet run --project FlowSpace.Api/FlowSpace.Api.csproj --launch-profile "https"
   ```
4. Kiểm tra tài liệu Swagger API tại: `https://localhost:7297/swagger/index.html`

### 4. Khởi chạy Giao diện Frontend
1. Mở thư mục gốc dự án bằng VS Code.
2. Click chuột phải vào file `/app/login.html` và chọn **Open with Live Server**.
3. Ứng dụng sẽ chạy tại địa chỉ: `http://127.0.0.1:5500/app/login.html`.
4. Click chọn một tài khoản demo bất kỳ để tự động điền thông tin và nhấn đăng nhập để trải nghiệm.
