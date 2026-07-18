-- =========================================================================
-- FLOWSPACE DATABASE SYSTEM SCHEMA (SQL SERVER)
-- =========================================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'FlowSpaceDb')
BEGIN
    ALTER DATABASE FlowSpaceDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE FlowSpaceDb;
END
GO

CREATE DATABASE FlowSpaceDb;
GO

USE FlowSpaceDb;
GO

-- ═════════════════════════════════════════════════════════════════════════
-- 1. TABLES & CONSTRAINTS (PK, FK, UNIQUE, CHECK, INDEX)
-- ═════════════════════════════════════════════════════════════════════════

-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    Avatar NVARCHAR(2) NOT NULL,
    Color NVARCHAR(20) NOT NULL,
    Department NVARCHAR(100) NULL,
    Position NVARCHAR(100) NULL,
    Phone VARCHAR(20) NULL,
    Active BIT NOT NULL DEFAULT 1,
    JoinDate DATETIME NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CHK_Users_Role CHECK (Role IN ('employee', 'team_lead', 'manager', 'director'))
);
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(Email);
GO

-- UserRefreshTokens Table
CREATE TABLE UserRefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CreatedByIp VARCHAR(45) NULL,
    RevokedAt DATETIME NULL,
    RevokedByIp VARCHAR(45) NULL,
    
    CONSTRAINT FK_UserRefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IX_UserRefreshTokens_UserId ON UserRefreshTokens(UserId);
CREATE NONCLUSTERED INDEX IX_UserRefreshTokens_Token ON UserRefreshTokens(Token);
GO

-- Projects Table
CREATE TABLE Projects (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    Priority NVARCHAR(10) NOT NULL DEFAULT 'medium',
    StartDate DATETIME NULL,
    EndDate DATETIME NULL,
    Progress INT NOT NULL DEFAULT 0,
    OwnerId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT UQ_Projects_Code UNIQUE (Code),
    CONSTRAINT FK_Projects_Users_OwnerId FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT CHK_Projects_Status CHECK (Status IN ('active', 'on_hold', 'done')),
    CONSTRAINT CHK_Projects_Priority CHECK (Priority IN ('low', 'medium', 'high')),
    CONSTRAINT CHK_Projects_Progress CHECK (Progress BETWEEN 0 AND 100)
);
CREATE NONCLUSTERED INDEX IX_Projects_Code ON Projects(Code);
CREATE NONCLUSTERED INDEX IX_Projects_OwnerId ON Projects(OwnerId);
GO

-- Project Members Table (Many-to-Many Bridge)
CREATE TABLE ProjectMembers (
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    
    CONSTRAINT PK_ProjectMembers PRIMARY KEY (ProjectId, UserId),
    CONSTRAINT FK_ProjectMembers_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ProjectMembers_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
GO

-- Tasks Table
CREATE TABLE Tasks (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code NVARCHAR(20) NOT NULL,
    Title NVARCHAR(250) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    AssigneeId UNIQUEIDENTIFIER NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'todo',
    Priority NVARCHAR(10) NOT NULL DEFAULT 'medium',
    StartDate DATETIME NULL,
    DueDate DATETIME NULL,
    CompletedAt DATETIME NULL,
    EstimatedHours INT NOT NULL DEFAULT 0,
    LoggedHours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT UQ_Tasks_Code UNIQUE (Code),
    CONSTRAINT FK_Tasks_Projects_ProjectId FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Tasks_Users_AssigneeId FOREIGN KEY (AssigneeId) REFERENCES Users(Id) ON DELETE SET NULL,
    CONSTRAINT FK_Tasks_Users_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT CHK_Tasks_Status CHECK (Status IN ('todo', 'in_progress', 'review', 'done')),
    CONSTRAINT CHK_Tasks_Priority CHECK (Priority IN ('low', 'medium', 'high')),
    CONSTRAINT CHK_Tasks_EstimatedHours CHECK (EstimatedHours >= 0),
    CONSTRAINT CHK_Tasks_LoggedHours CHECK (LoggedHours >= 0.00),
    CONSTRAINT CHK_Tasks_Dates CHECK (DueDate >= StartDate OR StartDate IS NULL OR DueDate IS NULL)
);
CREATE NONCLUSTERED INDEX IX_Tasks_ProjectId ON Tasks(ProjectId);
CREATE NONCLUSTERED INDEX IX_Tasks_AssigneeId ON Tasks(AssigneeId);
CREATE NONCLUSTERED INDEX IX_Tasks_Status ON Tasks(Status);
GO

-- Task Dependencies Table (Self-referencing Many-to-Many)
CREATE TABLE TaskDependencies (
    TaskId UNIQUEIDENTIFIER NOT NULL,
    DependsOnTaskId UNIQUEIDENTIFIER NOT NULL,
    
    CONSTRAINT PK_TaskDependencies PRIMARY KEY (TaskId, DependsOnTaskId),
    CONSTRAINT FK_TaskDependencies_Tasks_TaskId FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TaskDependencies_Tasks_DependsOn FOREIGN KEY (DependsOnTaskId) REFERENCES Tasks(Id) ON DELETE NO ACTION
);
GO

-- Subtasks Table
CREATE TABLE Subtasks (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TaskId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(250) NOT NULL,
    Done BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Subtasks_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IX_Subtasks_TaskId ON Subtasks(TaskId);
GO

-- Comments Table
CREATE TABLE Comments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TaskId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Text NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Comments_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IX_Comments_TaskId ON Comments(TaskId);
GO

-- TimeLogs Table
CREATE TABLE TimeLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TaskId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    Hours DECIMAL(4,2) NOT NULL,
    Date DATETIME NOT NULL,
    Note NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_TimeLogs_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TimeLogs_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TimeLogs_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE NO ACTION,
    CONSTRAINT CHK_TimeLogs_Hours CHECK (Hours > 0.00)
);
CREATE NONCLUSTERED INDEX IX_TimeLogs_TaskId ON TimeLogs(TaskId);
CREATE NONCLUSTERED INDEX IX_TimeLogs_UserId ON TimeLogs(UserId);
GO

-- Requests Table
CREATE TABLE Requests (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Type NVARCHAR(20) NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    RequesterId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Requests_Users_RequesterId FOREIGN KEY (RequesterId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Requests_Type CHECK (Type IN ('leave', 'overtime', 'purchase', 'remote')),
    CONSTRAINT CHK_Requests_Status CHECK (Status IN ('pending', 'approved', 'rejected'))
);
CREATE NONCLUSTERED INDEX IX_Requests_RequesterId ON Requests(RequesterId);
CREATE NONCLUSTERED INDEX IX_Requests_Status ON Requests(Status);
GO

-- Approvals Table
CREATE TABLE Approvals (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    Level INT NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    ApproverId UNIQUEIDENTIFIER NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    Note NVARCHAR(1000) NULL,
    UpdatedAt DATETIME NULL,
    
    CONSTRAINT FK_Approvals_Requests FOREIGN KEY (RequestId) REFERENCES Requests(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Approvals_Users FOREIGN KEY (ApproverId) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT CHK_Approvals_Status CHECK (Status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT CHK_Approvals_Role CHECK (Role IN ('team_lead', 'manager', 'director'))
);
CREATE NONCLUSTERED INDEX IX_Approvals_RequestId ON Approvals(RequestId);
GO

-- Channels Table
CREATE TABLE Channels (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(10) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT CHK_Channels_Type CHECK (Type IN ('channel', 'dm'))
);
GO

-- Channel Members Table
CREATE TABLE ChannelMembers (
    ChannelId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    
    CONSTRAINT PK_ChannelMembers PRIMARY KEY (ChannelId, UserId),
    CONSTRAINT FK_ChannelMembers_Channels FOREIGN KEY (ChannelId) REFERENCES Channels(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ChannelMembers_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
GO

-- Messages Table
CREATE TABLE Messages (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ChannelId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Text NVARCHAR(MAX) NOT NULL,
    ReplyTo UNIQUEIDENTIFIER NULL,
    Pinned BIT NOT NULL DEFAULT 0,
    Recalled BIT NOT NULL DEFAULT 0,
    ReactionsJson NVARCHAR(MAX) NULL, -- Stores JSON format reactions E.g. {"heart": 3, "clap": 1}
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Messages_Channels FOREIGN KEY (ChannelId) REFERENCES Channels(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_ReplyTo FOREIGN KEY (ReplyTo) REFERENCES Messages(Id) ON DELETE NO ACTION
);
CREATE NONCLUSTERED INDEX IX_Messages_ChannelId ON Messages(ChannelId);
GO

-- Documents Table
CREATE TABLE Documents (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Type NVARCHAR(10) NOT NULL,
    ParentId UNIQUEIDENTIFIER NULL,
    Content NVARCHAR(MAX) NULL,
    Size INT NULL,
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Documents_Documents FOREIGN KEY (ParentId) REFERENCES Documents(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Documents_Users FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT CHK_Documents_Type CHECK (Type IN ('folder', 'doc', 'sheet', 'slide', 'pdf', 'image'))
);
CREATE NONCLUSTERED INDEX IX_Documents_ParentId ON Documents(ParentId);
GO

-- Document Sharing Table
CREATE TABLE DocumentSharing (
    DocumentId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    
    CONSTRAINT PK_DocumentSharing PRIMARY KEY (DocumentId, UserId),
    CONSTRAINT FK_DocumentSharing_Documents FOREIGN KEY (DocumentId) REFERENCES Documents(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentSharing_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
GO

-- Document Versions Table
CREATE TABLE DocumentVersions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DocumentId UNIQUEIDENTIFIER NOT NULL,
    Version NVARCHAR(10) NOT NULL,
    UploadedBy UNIQUEIDENTIFIER NOT NULL,
    UploadedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    Note NVARCHAR(1000) NULL,
    
    CONSTRAINT FK_DocumentVersions_Documents FOREIGN KEY (DocumentId) REFERENCES Documents(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentVersions_Users FOREIGN KEY (UploadedBy) REFERENCES Users(Id) ON DELETE CASCADE
);
GO

-- SystemLogs Table
CREATE TABLE SystemLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Action NVARCHAR(50) NOT NULL,
    Module NVARCHAR(50) NOT NULL,
    Detail NVARCHAR(MAX) NOT NULL,
    Ip VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_SystemLogs_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX IX_SystemLogs_CreatedAt ON SystemLogs(CreatedAt);
GO

-- ═════════════════════════════════════════════════════════════════════════
-- 2. VIEWS (Project Progress, User Performance Reports)
-- ═════════════════════════════════════════════════════════════════════════
GO

-- View Project Progress
CREATE VIEW v_ProjectProgress AS
SELECT 
    p.Id AS ProjectId,
    p.Code AS ProjectCode,
    p.Name AS ProjectName,
    COUNT(t.Id) AS TotalTasks,
    SUM(CASE WHEN t.Status = 'done' THEN 1 ELSE 0 END) AS DoneTasks,
    CASE 
        WHEN COUNT(t.Id) = 0 THEN 0 
        ELSE CAST((SUM(CASE WHEN t.Status = 'done' THEN 1.0 ELSE 0 END) / COUNT(t.Id)) * 100 AS INT)
    END AS ComputedProgress
FROM Projects p
LEFT JOIN Tasks t ON p.Id = t.ProjectId
GROUP BY p.Id, p.Code, p.Name;
GO

-- View User Performance Metrics
CREATE VIEW v_UserPerformance AS
SELECT 
    u.Id AS UserId,
    u.Name AS UserName,
    u.Department,
    u.Position,
    COUNT(DISTINCT pm.ProjectId) AS AssignedProjects,
    COUNT(t.Id) AS TotalTasks,
    SUM(CASE WHEN t.Status = 'done' THEN 1 ELSE 0 END) AS CompletedTasks,
    ISNULL(SUM(tl.Hours), 0) AS TotalLoggedHours
FROM Users u
LEFT JOIN ProjectMembers pm ON u.Id = pm.UserId
LEFT JOIN Tasks t ON u.Id = t.AssigneeId
LEFT JOIN TimeLogs tl ON u.Id = tl.UserId
GROUP BY u.Id, u.Name, u.Department, u.Position;
GO

-- ═════════════════════════════════════════════════════════════════════════
-- 3. STORED PROCEDURES (Approval & Backlogs)
-- ═════════════════════════════════════════════════════════════════════════
GO

-- Stored Procedure to Approve Request
CREATE PROCEDURE sp_ProcessApproval
    @RequestId UNIQUEIDENTIFIER,
    @ApproverId UNIQUEIDENTIFIER,
    @Decision NVARCHAR(20), -- 'approved' or 'rejected'
    @Note NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Find current active pending step matching the approver's role
        DECLARE @UserRole NVARCHAR(20);
        SELECT @UserRole = Role FROM Users WHERE Id = @ApproverId;
        
        DECLARE @ApprovalId UNIQUEIDENTIFIER;
        SELECT TOP 1 @ApprovalId = Id 
        FROM Approvals 
        WHERE RequestId = @RequestId AND Status = 'pending' AND Role = @UserRole
        ORDER BY Level ASC;
        
        IF @ApprovalId IS NULL
        BEGIN
            THROW 50001, 'No pending approval step found matching this approver role level.', 1;
        END

        -- Update the approval step
        UPDATE Approvals
        SET Status = @Decision,
            ApproverId = @ApproverId,
            Note = @Note,
            UpdatedAt = GETUTCDATE()
        WHERE Id = @ApprovalId;

        -- If rejected, reject the whole Request
        IF @Decision = 'rejected'
        BEGIN
            UPDATE Requests
            SET Status = 'rejected', UpdatedAt = GETUTCDATE()
            WHERE Id = @RequestId;
            
            -- Set all subsequent steps as rejected too
            UPDATE Approvals
            SET Status = 'rejected', UpdatedAt = GETUTCDATE()
            WHERE RequestId = @RequestId AND Status = 'pending';
        END
        ELSE
        BEGIN
            -- If approved, check if there are more pending steps
            IF NOT EXISTS (SELECT 1 FROM Approvals WHERE RequestId = @RequestId AND Status = 'pending')
            BEGIN
                -- All steps approved, request becomes approved
                UPDATE Requests
                SET Status = 'approved', UpdatedAt = GETUTCDATE()
                WHERE Id = @RequestId;
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ═════════════════════════════════════════════════════════════════════════
-- 4. TRIGGERS (Auto Update Project Progress on Task Changes)
-- ═════════════════════════════════════════════════════════════════════════
GO

CREATE TRIGGER tr_UpdateProjectProgress
ON Tasks
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Table to hold Project IDs that need updating
    DECLARE @ProjectsToUpdate TABLE (ProjectId UNIQUEIDENTIFIER);
    
    INSERT INTO @ProjectsToUpdate
    SELECT DISTINCT ProjectId FROM inserted WHERE ProjectId IS NOT NULL
    UNION
    SELECT DISTINCT ProjectId FROM deleted WHERE ProjectId IS NOT NULL;
    
    -- Recalculate and update progress for affected projects
    UPDATE Projects
    SET Progress = vp.ComputedProgress
    FROM Projects p
    INNER JOIN v_ProjectProgress vp ON p.Id = vp.ProjectId
    WHERE p.Id IN (SELECT ProjectId FROM @ProjectsToUpdate);
END;
GO

-- ═════════════════════════════════════════════════════════════════════════
-- 5. SEED DATA (Aligns exactly with seed-data.js)
-- ═════════════════════════════════════════════════════════════════════════

-- Declaring GUIDs for Users
DECLARE @u1 UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @u2 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @u3 UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';
DECLARE @u4 UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
DECLARE @u5 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555555';
DECLARE @u6 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666666';

-- Seed Users
INSERT INTO Users (Id, Name, Email, PasswordHash, Role, Avatar, Color, Department, Position, Phone, JoinDate) VALUES
(@u1, N'Nguyễn Văn An', 'nhanvien@flowspace.demo', '123456', 'employee', 'An', 'av-teal', N'Kỹ thuật', N'Nhân viên', '0901234567', '2023-03-15'),
(@u2, N'Trần Thị Bình', 'truongnhom@flowspace.demo', '123456', 'team_lead', 'Bi', 'av-violet', N'Kỹ thuật', N'Trưởng nhóm', '0912345678', '2022-01-10'),
(@u3, N'Lê Minh Cường', 'truongphong@flowspace.demo', '123456', 'manager', 'Cu', 'av-orange', N'Kỹ thuật', N'Trưởng phòng', '0923456789', '2021-05-20'),
(@u4, N'Phạm Thanh Dung', 'admin@flowspace.demo', '123456', 'director', 'Du', 'av-rose', N'Ban lãnh đạo', N'Ban giám đốc', '0934567890', '2020-01-01'),
(@u5, N'Hoàng Văn Em', 'hoangemail@flowspace.demo', '123456', 'employee', 'Em', 'av-cyan', N'Marketing', N'Nhân viên', '0945678901', '2023-06-01'),
(@u6, N'Vũ Thị Phương', 'vuphong@flowspace.demo', '123456', 'employee', 'Ph', 'av-pink', N'Thiết kế', N'Nhân viên', '0956789012', '2023-09-01');

-- Declaring GUIDs for Projects
DECLARE @p1 UNIQUEIDENTIFIER = 'A1111111-A111-A111-A111-A11111111111';
DECLARE @p2 UNIQUEIDENTIFIER = 'A2222222-A222-A222-A222-A22222222222';
DECLARE @p3 UNIQUEIDENTIFIER = 'A3333333-A333-A333-A333-A33333333333';

-- Seed Projects
INSERT INTO Projects (Id, Code, Name, Description, Status, Priority, StartDate, EndDate, OwnerId) VALUES
(@p1, 'FS-001', 'FlowSpace Platform v2', N'Nâng cấp toàn diện nền tảng FlowSpace lên v2.0 Notion-Style.', 'active', 'high', DATEADD(day, -30, GETUTCDATE()), DATEADD(day, 60, GETUTCDATE()), @u3),
(@p2, 'MKT-002', 'Chiến dịch Marketing Q3', N'Triển khai chiến dịch marketing tổng lực Q3.', 'active', 'medium', DATEADD(day, -15, GETUTCDATE()), DATEADD(day, 45, GETUTCDATE()), @u2),
(@p3, 'HR-003', 'Hệ thống Onboarding nhân sự', N'Xây dựng quy trình onboarding nhân sự mới.', 'active', 'low', DATEADD(day, -20, GETUTCDATE()), DATEADD(day, 30, GETUTCDATE()), @u3);

-- Seed Project Members
INSERT INTO ProjectMembers (ProjectId, UserId) VALUES
(@p1, @u1), (@p1, @u2), (@p1, @u3), (@p1, @u6),
(@p2, @u2), (@p2, @u5),
(@p3, @u1), (@p3, @u3), (@p3, @u4);

-- Declaring GUIDs for Tasks
DECLARE @t1 UNIQUEIDENTIFIER = 'B1111111-B111-B111-B111-B11111111111';
DECLARE @t2 UNIQUEIDENTIFIER = 'B2222222-B222-B222-B222-B22222222222';
DECLARE @t3 UNIQUEIDENTIFIER = 'B3333333-B333-B333-B333-B33333333333';

-- Seed Tasks (Trigger will automatically compute project progress)
INSERT INTO Tasks (Id, Code, Title, Description, ProjectId, AssigneeId, Status, Priority, StartDate, DueDate, EstimatedHours, CreatedBy) VALUES
(@t1, 'T-001', N'Thiết kế UI Dashboard mới', N'Thiết kế lại toàn bộ giao diện dashboard theo design system 2.0.', @p1, @u6, 'done', 'high', DATEADD(day, -25, GETUTCDATE()), DATEADD(day, -10, GETUTCDATE()), 16, @u3),
(@t2, 'T-002', N'Implement Chart.js Dashboard', N'Code phần biểu đồ dashboard dùng Chart.js.', @p1, @u1, 'in_progress', 'high', DATEADD(day, -8, GETUTCDATE()), DATEADD(day, 5, GETUTCDATE()), 12, @u2),
(@t3, 'T-003', N'Xây dựng module Kanban', N'Phát triển trang Kanban với kéo thả SortableJS.', @p1, @u1, 'todo', 'medium', DATEADD(day, -5, GETUTCDATE()), DATEADD(day, 8, GETUTCDATE()), 20, @u2);

-- Update Task t1 CompletedAt
UPDATE Tasks SET CompletedAt = DATEADD(day, -11, GETUTCDATE()) WHERE Id = @t1;

-- Seed Subtasks
INSERT INTO Subtasks (TaskId, Title, Done) VALUES
(@t1, N'Wireframe dashboard', 1),
(@t1, N'Mockup high-fidelity', 1),
(@t1, N'Export assets', 1),
(@t2, N'Biểu đồ tròn trạng thái task', 1),
(@t2, N'Biểu đồ cột activity', 0);

-- Seed Comments
INSERT INTO Comments (TaskId, UserId, Text) VALUES
(@t1, @u3, N'Chạy đúng tiến độ, approve nhé!'),
(@t1, @u6, N'Cảm ơn anh, em đã hoàn thành.');

-- Seed TimeLogs
INSERT INTO TimeLogs (TaskId, UserId, ProjectId, Hours, Date, Note) VALUES
(@t1, @u6, @p1, 8.0, DATEADD(day, -20, GETUTCDATE()), N'Thiết kế wireframe'),
(@t1, @u6, @p1, 6.0, DATEADD(day, -12, GETUTCDATE()), N'Hoàn thiện mockup'),
(@t2, @u1, @p1, 4.0, DATEADD(day, -7, GETUTCDATE()), N'Setup Chart.js');

-- Seed Channels
DECLARE @ch1 UNIQUEIDENTIFIER = 'C1111111-C111-C111-C111-C11111111111';
INSERT INTO Channels (Id, Name, Type, Description) VALUES
(@ch1, N'chung', 'channel', N'Kênh chung cho toàn công ty');

-- Seed Channel Members
INSERT INTO ChannelMembers (ChannelId, UserId) VALUES
(@ch1, @u1), (@ch1, @u2), (@ch1, @u3), (@ch1, @u4), (@ch1, @u5), (@ch1, @u6);

-- Seed Messages
INSERT INTO Messages (ChannelId, UserId, Text) VALUES
(@ch1, @u4, N'Chào mừng tất cả mọi người đến với FlowSpace! 🎉'),
(@ch1, @u2, N'Cảm ơn anh/chị! Chúng ta sẽ làm việc hiệu quả hơn với công cụ này.');
GO
