# QUY TẮC ĐẶT TÊN VÀ CHUẨN MÃ NGUỒN (NAMING CONVENTION & CODING STANDARDS)

Tài liệu này quy định toàn bộ chuẩn mực đặt tên, định dạng code và quy ước chuyển đổi giữa **Backend (.NET 9 / C#)** và **Frontend (HTML5 / CSS / JavaScript)** trong hệ thống FlowSpace.

---

## 1. Quy tắc Đặt tên Backend (.NET / C#)

### 1.1. C# Code Conventions
| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| **Namespace** | PascalCase | `FlowSpace.Api.Controllers`, `FlowSpace.Domain.Entities` |
| **Class / Struct / Record** | PascalCase | `ProjectsController`, `TaskItem`, `CreateProjectRequest` |
| **Interface** | `I` + PascalCase | `IProjectService`, `IGenericRepository<T>`, `IUnitOfWork` |
| **Method / Property** | PascalCase | `GetProjectByIdAsync`, `StartDate`, `IsActive` |
| **Private Field** | `_` + camelCase | `_unitOfWork`, `_projectService`, `_context` |
| **Local Variable / Parameter** | camelCase | `createdProject`, `request`, `ownerId` |
| **Enum Type / Member** | PascalCase | `TaskStatus.InProgress`, `ProjectPriority.High` |
| **Constant** | PascalCase | `DefaultPageSize = 20`, `MaxMaxTitleLength = 250` |

### 1.2. Database & Entity Conventions (EF Core / SQL Server)
| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| **Tên Bảng (Tables)** | PascalCase (Số nhiều) | `Users`, `Projects`, `Tasks`, `UserRefreshTokens` |
| **Tên Cột (Columns)** | PascalCase | `Id`, `Title`, `OwnerId`, `CreatedAt`, `PasswordHash` |
| **Khóa chính (PK)** | `Id` (GUID) | `Id` |
| **Khóa ngoại (FK)** | `[EntityName]Id` | `ProjectId`, `AssigneeId`, `OwnerId` |

---

## 2. Quy tắc Đặt tên Frontend (HTML / CSS / JavaScript)

### 2.1. JavaScript Conventions
| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| **Global Namespace** | UPPERCASE / PascalCase | `window.FS`, `FS.db`, `FS.auth`, `FS.pages` |
| **Module / Page Object** | camelCase / PascalCase | `FS.pages.projects`, `FS.searchModule`, `FS.taskDetail` |
| **Function / Method** | camelCase | `init()`, `loadProjects()`, `formatDate()`, `renderKanban()` |
| **Variable / Parameter** | camelCase | `currentUserId`, `projectList`, `selectedTaskId` |
| **Constant** | ALL_CAPS_WITH_UNDERSCORE | `API_BASE_URL`, `ROLE_LEVELS`, `TOKEN_KEY` |
| **File Name** | kebab-case (chữ thường nối gạch ngang) | `projects.js`, `task-detail.js`, `search-modal.js` |

### 2.2. HTML & CSS Conventions
| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| **HTML Attribute / ID** | kebab-case | `id="btn-create-project"`, `id="project-list-container"` |
| **CSS Class** | kebab-case (BEM-inspired) | `.fs-card`, `.btn-primary`, `.avatar-teal` |
| **CSS Custom Property (Variable)**| `--` + kebab-case | `--fs-bg-dark`, `--fs-primary`, `--fs-border-color` |
| **HTML Page File** | kebab-case | `index.html`, `app.html`, `pages/timetracking.html` |

---

## 3. Quy tắc Đồng bộ dữ liệu JSON (JSON Serialization / Mapping)

- **JSON Payload Transmitted over Wire**: Dùng **camelCase** (Chuẩn RESTful Web API).
- **AutoMapper Config**: Tự động chuyển từ PascalCase trong C# DTOs sang camelCase trong JSON HTTP response:
  - C# Property: `Project.OwnerId` -> JSON Property: `"ownerId"`
  - C# Property: `TaskItem.DueDate` -> JSON Property: `"dueDate"`
  - C# Property: `UserDto.PasswordHash` -> Ignored in DTO/JSON.
- **Envelope API Standard**:
  ```json
  {
    "success": true,
    "message": "Retrieval successful.",
    "data": { ... }
  }
  ```

---

## 4. Bảng Tra cứu Đồng bộ Tên Thực thể (Cross-Layer Naming Matrix)

| Domain Entity (C#) | Database Table (SQL) | DTO (C#) | API Endpoint (REST) | Frontend JS Module |
|---|---|---|---|---|
| `User` | `Users` | `UserDto` | `/api/v1/auth`, `/api/v1/users` | `users.js`, `auth.js` |
| `UserRefreshToken` | `UserRefreshTokens` | `TokenRefreshRequest` | `/api/v1/auth/refresh-token` | `auth.js` |
| `Project` | `Projects` | `ProjectResponse` | `/api/v1/projects` | `projects.js`, `project-detail.js` |
| `TaskItem` | `Tasks` | `TaskResponse` | `/api/v1/tasks` | `tasks.js`, `kanban.js`, `task-detail.js` |
| `Subtask` | `Subtasks` | `SubtaskDto` | `/api/v1/tasks/{id}/subtasks` | `task-detail.js` |
| `Request` | `Requests` | `RequestResponse` | `/api/v1/requests` | `requests.js` |
| `Approval` | `Approvals` | `ApprovalResponse` | `/api/v1/approvals` | `approvals.js` |
| `TimeLog` | `TimeLogs` | `TimeLogResponse` | `/api/v1/timetracking` | `timetracking.js` |
| `Document` | `Documents` | `DocumentResponse` | `/api/v1/documents` | `documents.js` |
| `ChatMessage` | `ChatMessages` | `ChatMessageDto` | `/api/v1/chat` / SignalR | `chat.js` |
