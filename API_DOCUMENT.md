# TÀI LIỆU KHẢO SÁT & ĐẶC TẢ API (API DOCUMENT)

Tài liệu này ghi nhận đặc tả kỹ thuật chi tiết của tất cả các REST APIs đang chạy trên Backend .NET 9.

---

## 1. Module 1: Authentication

### Đăng nhập (Login)
* **Endpoint**: `POST /api/v1/auth/login`
* **Cơ chế**: Không xác thực (Anonymous)
* **Request Body**:
```json
{
  "email": "nhanvien@flowspace.demo",
  "password": "123"
}
```
* **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "XyZ123...",
    "expiresInMinutes": 15,
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Nguyễn Văn An",
      "email": "nhanvien@flowspace.demo",
      "role": "employee",
      "avatar": "An",
      "color": "av-teal",
      "department": "Kỹ thuật",
      "position": "Nhân viên",
      "active": true
    }
  }
}
```

### Đăng xuất (Logout)
* **Endpoint**: `POST /api/v1/auth/logout`
* **Cơ chế**: Yêu cầu Bearer Token (Header `Authorization: Bearer <JWT>`)
* **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

### Làm mới Token (Refresh Token)
* **Endpoint**: `POST /api/v1/auth/refresh-token`
* **Cơ chế**: Không xác thực
* **Request Body**:
```json
{
  "accessToken": "ExpiredJWTToken...",
  "refreshToken": "ActiveRefreshToken..."
}
```
* **Response (Success - 200 OK)**: Cấp lại cặp Access Token & Refresh Token mới giống định dạng của Login.

---

## 2. Module 2: Projects

### Lấy tất cả dự án (Get All)
* **Endpoint**: `GET /api/v1/projects`
* **Cơ chế**: Yêu cầu Bearer Token
* **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Projects retrieved successfully.",
  "data": [
    {
      "id": "a1111111-a111-a111-a111-a11111111111",
      "code": "FS-001",
      "name": "FlowSpace Platform v2",
      "description": "Nâng cấp toàn diện...",
      "status": "Active",
      "priority": "High",
      "startDate": "2026-06-18T16:29:12",
      "endDate": "2026-09-18T16:29:12",
      "progress": 33,
      "ownerId": "33333333-3333-3333-3333-333333333333",
      "ownerName": "Lê Minh Cường",
      "members": []
    }
  ]
}
```
