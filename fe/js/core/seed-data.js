/**
 * FlowSpace — Seed Data
 * Khởi tạo dữ liệu mẫu vào localStorage nếu chưa có
 * window.FS.seedData()
 */
(function (FS) {
  'use strict';

  const SEED_KEY = 'fs_seeded_v1';

  /* ── Helpers ───────────────────────────────────────────── */
  const now = new Date();
  function daysAgo(n) {
    const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString();
  }
  function daysFromNow(n) {
    const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString();
  }
  function randomId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }



  /* ── Projects ───────────────────────────────────────────── */
  const PROJECTS = [
    {
      id: 'p1', code: 'FS-001', name: 'FlowSpace Platform v2',
      description: 'Nâng cấp toàn diện nền tảng FlowSpace lên phiên bản 2.0 với giao diện mới và tính năng AI.',
      status: 'active', priority: 'high',
      startDate: daysAgo(30), endDate: daysFromNow(60),
      progress: 45, ownerId: 'u3',
      members: ['u1', 'u2', 'u3', 'u6'],
      tags: ['product', 'frontend', 'ai'],
      createdAt: daysAgo(30)
    },
    {
      id: 'p2', code: 'MKT-002', name: 'Chiến dịch Marketing Q3',
      description: 'Triển khai chiến dịch marketing tổng lực cho quý 3, bao gồm digital và offline.',
      status: 'active', priority: 'medium',
      startDate: daysAgo(15), endDate: daysFromNow(45),
      progress: 30, ownerId: 'u2',
      members: ['u2', 'u5'],
      tags: ['marketing', 'campaign'],
      createdAt: daysAgo(15)
    },
    {
      id: 'p3', code: 'HR-003', name: 'Hệ thống Onboarding nhân sự',
      description: 'Xây dựng quy trình onboarding nhân sự mới, bao gồm tài liệu và training.',
      status: 'active', priority: 'low',
      startDate: daysAgo(20), endDate: daysFromNow(30),
      progress: 65, ownerId: 'u3',
      members: ['u1', 'u3', 'u4'],
      tags: ['hr', 'process'],
      createdAt: daysAgo(20)
    },
    {
      id: 'p4', code: 'DEV-004', name: 'API Integration Hub',
      description: 'Phát triển trung tâm tích hợp API kết nối FlowSpace với các công cụ bên ngoài.',
      status: 'active', priority: 'high',
      startDate: daysAgo(10), endDate: daysFromNow(50),
      progress: 20, ownerId: 'u2',
      members: ['u1', 'u2', 'u6'],
      tags: ['api', 'integration', 'backend'],
      createdAt: daysAgo(10)
    },
    {
      id: 'p5', code: 'DES-005', name: 'Design System 2.0',
      description: 'Xây dựng hệ thống thiết kế mới cho toàn bộ sản phẩm FlowSpace.',
      status: 'on_hold', priority: 'medium',
      startDate: daysAgo(45), endDate: daysFromNow(15),
      progress: 80, ownerId: 'u3',
      members: ['u6', 'u3'],
      tags: ['design', 'ui'],
      createdAt: daysAgo(45)
    },
    {
      id: 'p6', code: 'OPS-006', name: 'Infrastructure Migration',
      description: 'Di chuyển hạ tầng lên cloud với khả năng mở rộng cao hơn.',
      status: 'done', priority: 'high',
      startDate: daysAgo(90), endDate: daysAgo(10),
      progress: 100, ownerId: 'u4',
      members: ['u1', 'u2', 'u3', 'u4'],
      tags: ['infra', 'cloud', 'devops'],
      createdAt: daysAgo(90)
    }
  ];

  /* ── Tasks ──────────────────────────────────────────────── */
  const TASKS = [
    // Project p1
    { id: 't1', code: 'T-001', title: 'Thiết kế UI Dashboard mới', projectId: 'p1', assigneeId: 'u6',
      status: 'done', priority: 'high', description: 'Thiết kế lại toàn bộ giao diện dashboard theo design system 2.0.',
      startDate: daysAgo(25), dueDate: daysAgo(10), completedAt: daysAgo(11),
      estimatedHours: 16, loggedHours: 14,
      tags: ['design', 'ui'], createdBy: 'u3', createdAt: daysAgo(25),
      subtasks: [
        { id: 'st1', title: 'Wireframe dashboard', done: true },
        { id: 'st2', title: 'Mockup high-fidelity', done: true },
        { id: 'st3', title: 'Export assets', done: true }
      ],
      comments: [
        { id: 'c1', userId: 'u3', text: 'Chạy đúng tiến độ, approve nhé!', createdAt: daysAgo(12) },
        { id: 'c2', userId: 'u6', text: 'Cảm ơn anh, em đã hoàn thành.', createdAt: daysAgo(11) }
      ]
    },
    { id: 't2', code: 'T-002', title: 'Implement Chart.js Dashboard', projectId: 'p1', assigneeId: 'u1',
      status: 'in_progress', priority: 'high', description: 'Code phần biểu đồ dashboard dùng Chart.js.',
      startDate: daysAgo(8), dueDate: daysFromNow(5), completedAt: null,
      estimatedHours: 12, loggedHours: 7,
      tags: ['frontend', 'chart'], createdBy: 'u2', createdAt: daysAgo(8),
      dependsOn: ['t1'],
      subtasks: [
        { id: 'st4', title: 'Biểu đồ tròn trạng thái task', done: true },
        { id: 'st5', title: 'Biểu đồ cột activity', done: false },
        { id: 'st6', title: 'Kết nối với localStorage', done: false }
      ],
      comments: []
    },
    { id: 't3', code: 'T-003', title: 'Xây dựng module Kanban', projectId: 'p1', assigneeId: 'u1',
      status: 'in_progress', priority: 'high', description: 'Phát triển trang Kanban với kéo thả SortableJS.',
      startDate: daysAgo(5), dueDate: daysFromNow(8), completedAt: null,
      estimatedHours: 20, loggedHours: 8,
      tags: ['frontend', 'kanban'], createdBy: 'u2', createdAt: daysAgo(5),
      dependsOn: ['t2'],
      subtasks: [
        { id: 'st7', title: 'UI 4 cột kanban', done: true },
        { id: 'st8', title: 'Kéo thả SortableJS', done: false },
        { id: 'st9', title: 'Lưu state localStorage', done: false }
      ],
      comments: [
        { id: 'c3', userId: 'u2', text: 'Note: dùng SortableJS nhé, đừng dùng thư viện khác.', createdAt: daysAgo(4) }
      ]
    },
    { id: 't4', code: 'T-004', title: 'Code trang Chat nội bộ', projectId: 'p1', assigneeId: 'u1',
      status: 'todo', priority: 'medium', description: 'Xây dựng giao diện chat với channels và DM.',
      startDate: daysFromNow(5), dueDate: daysFromNow(15), completedAt: null,
      estimatedHours: 14, loggedHours: 0,
      tags: ['frontend', 'chat'], createdBy: 'u2', createdAt: daysAgo(3),
      dependsOn: ['t3'],
      subtasks: [], comments: []
    },
    { id: 't5', code: 'T-005', title: 'Viết tài liệu API v2', projectId: 'p1', assigneeId: 'u2',
      status: 'todo', priority: 'low', description: 'Cập nhật tài liệu API cho phiên bản 2.0.',
      startDate: daysFromNow(10), dueDate: daysFromNow(20), completedAt: null,
      estimatedHours: 8, loggedHours: 0,
      tags: ['docs'], createdBy: 'u3', createdAt: daysAgo(2),
      subtasks: [], comments: []
    },
    { id: 't6', code: 'T-006', title: 'Review code Pull Request #42', projectId: 'p1', assigneeId: 'u2',
      status: 'review', priority: 'medium', description: 'Review PR về tính năng time tracking.',
      startDate: daysAgo(1), dueDate: daysFromNow(1), completedAt: null,
      estimatedHours: 3, loggedHours: 2,
      tags: ['review'], createdBy: 'u1', createdAt: daysAgo(1),
      subtasks: [], comments: []
    },
    // Project p2
    { id: 't7', code: 'T-007', title: 'Thiết kế banner mạng xã hội Q3', projectId: 'p2', assigneeId: 'u5',
      status: 'in_progress', priority: 'high', description: 'Tạo bộ banner cho Facebook, Instagram, LinkedIn.',
      startDate: daysAgo(10), dueDate: daysFromNow(3), completedAt: null,
      estimatedHours: 10, loggedHours: 6,
      tags: ['design', 'social'], createdBy: 'u2', createdAt: daysAgo(10),
      subtasks: [
        { id: 'st10', title: 'Facebook banner (1200x628)', done: true },
        { id: 'st11', title: 'Instagram story (1080x1920)', done: false },
        { id: 'st12', title: 'LinkedIn post (1200x627)', done: false }
      ],
      comments: []
    },
    { id: 't8', code: 'T-008', title: 'Lên kế hoạch campaign email', projectId: 'p2', assigneeId: 'u5',
      status: 'todo', priority: 'medium', description: 'Lập kế hoạch gửi email marketing cho 10,000 subscribers.',
      startDate: daysFromNow(2), dueDate: daysFromNow(12), completedAt: null,
      estimatedHours: 6, loggedHours: 0,
      tags: ['email', 'marketing'], createdBy: 'u2', createdAt: daysAgo(5),
      subtasks: [], comments: []
    },
    // Project p3
    { id: 't9', code: 'T-009', title: 'Soạn tài liệu onboarding', projectId: 'p3', assigneeId: 'u1',
      status: 'done', priority: 'medium', description: 'Viết tài liệu hướng dẫn nhân viên mới.',
      startDate: daysAgo(18), dueDate: daysAgo(5), completedAt: daysAgo(6),
      estimatedHours: 12, loggedHours: 11,
      tags: ['docs', 'hr'], createdBy: 'u3', createdAt: daysAgo(18),
      subtasks: [], comments: []
    },
    { id: 't10', code: 'T-010', title: 'Tổ chức buổi training tân binh', projectId: 'p3', assigneeId: 'u3',
      status: 'in_progress', priority: 'high', description: 'Chuẩn bị và tổ chức buổi training cho 5 nhân viên mới.',
      startDate: daysAgo(3), dueDate: daysFromNow(7), completedAt: null,
      estimatedHours: 8, loggedHours: 3,
      tags: ['training', 'hr'], createdBy: 'u4', createdAt: daysAgo(3),
      subtasks: [
        { id: 'st13', title: 'Chuẩn bị slide', done: true },
        { id: 'st14', title: 'Book phòng họp', done: true },
        { id: 'st15', title: 'Gửi invite nhân viên', done: false }
      ],
      comments: []
    },
    // Overdue tasks
    { id: 't11', code: 'T-011', title: 'Fix bug login timeout', projectId: 'p4', assigneeId: 'u1',
      status: 'in_progress', priority: 'high', description: 'Người dùng bị đăng xuất đột ngột sau 30 phút không hoạt động.',
      startDate: daysAgo(15), dueDate: daysAgo(3), completedAt: null,
      estimatedHours: 6, loggedHours: 4,
      tags: ['bug', 'auth'], createdBy: 'u2', createdAt: daysAgo(15),
      subtasks: [], comments: [
        { id: 'c4', userId: 'u2', text: 'Cần xử lý gấp, khách đang báo bug này!', createdAt: daysAgo(5) }
      ]
    },
    { id: 't12', code: 'T-012', title: 'Cập nhật Privacy Policy', projectId: 'p4', assigneeId: 'u3',
      status: 'todo', priority: 'high', description: 'Cập nhật chính sách bảo mật theo quy định PDPA mới.',
      startDate: daysAgo(20), dueDate: daysAgo(7), completedAt: null,
      estimatedHours: 4, loggedHours: 0,
      tags: ['legal', 'compliance'], createdBy: 'u4', createdAt: daysAgo(20),
      subtasks: [], comments: []
    }
  ];

  /* ── Kanban Columns ─────────────────────────────────────── */
  const KANBAN_COLUMNS = [
    { id: 'k-todo',     title: 'Chưa bắt đầu', color: '#94a3b8', order: 0 },
    { id: 'k-progress', title: 'Đang làm',     color: '#6366f1', order: 1 },
    { id: 'k-review',   title: 'Chờ duyệt',    color: '#f59e0b', order: 2 },
    { id: 'k-done',     title: 'Hoàn thành',   color: '#10b981', order: 3 }
  ];

  /* ── Documents ──────────────────────────────────────────── */
  const DOCUMENTS = [
    {
      id: 'd1', name: 'Tài liệu kỹ thuật', type: 'folder', parentId: null,
      createdBy: 'u2', createdAt: daysAgo(30)
    },
    {
      id: 'd2', name: 'Kiến trúc hệ thống v2', type: 'doc', parentId: 'd1',
      content: 'Tài liệu mô tả kiến trúc tổng thể của FlowSpace Platform v2...',
      createdBy: 'u3', createdAt: daysAgo(20), size: 45000,
      sharedWith: ['u1', 'u2'],
      versions: [
        { version: '1.0', uploadedBy: 'u3', uploadedAt: daysAgo(20), note: 'Phiên bản đầu tiên' },
        { version: '1.1', uploadedBy: 'u3', uploadedAt: daysAgo(10), note: 'Cập nhật sơ đồ module' }
      ]
    },
    {
      id: 'd3', name: 'API Endpoints', type: 'doc', parentId: 'd1',
      content: 'Danh sách đầy đủ các API endpoints của hệ thống...',
      createdBy: 'u1', createdAt: daysAgo(15), size: 32000,
      sharedWith: [],
      versions: [
        { version: '1.0', uploadedBy: 'u1', uploadedAt: daysAgo(15), note: 'Init' }
      ]
    },
    {
      id: 'd4', name: 'Marketing', type: 'folder', parentId: null,
      createdBy: 'u5', createdAt: daysAgo(25)
    },
    {
      id: 'd5', name: 'Kế hoạch Marketing Q3', type: 'sheet', parentId: 'd4',
      content: 'Bảng kế hoạch và ngân sách marketing quý 3...',
      createdBy: 'u5', createdAt: daysAgo(14), size: 28000,
      sharedWith: ['u2', 'u3', 'u4'],
      versions: [
        { version: '1.0', uploadedBy: 'u5', uploadedAt: daysAgo(14), note: 'Draft 1' },
        { version: '1.1', uploadedBy: 'u5', uploadedAt: daysAgo(10), note: 'Điều chỉnh ngân sách' }
      ]
    },
    {
      id: 'd6', name: 'Presentation khách hàng', type: 'slide', parentId: 'd4',
      content: 'Deck trình bày cho khách hàng tiềm năng...',
      createdBy: 'u5', createdAt: daysAgo(10), size: 5200000,
      sharedWith: ['u1'],
      versions: [
        { version: '1.0', uploadedBy: 'u5', uploadedAt: daysAgo(10), note: 'Init' }
      ]
    },
    {
      id: 'd7', name: 'Nhân sự', type: 'folder', parentId: null,
      createdBy: 'u4', createdAt: daysAgo(60)
    },
    {
      id: 'd8', name: 'Quy trình onboarding', type: 'doc', parentId: 'd7',
      content: 'Hướng dẫn quy trình tiếp nhận nhân viên mới...',
      createdBy: 'u1', createdAt: daysAgo(6), size: 18000,
      sharedWith: [],
      versions: [
        { version: '1.0', uploadedBy: 'u1', uploadedAt: daysAgo(6), note: 'Phiên bản ban đầu' }
      ]
    },
    {
      id: 'd9', name: 'Chính sách công ty', type: 'doc', parentId: 'd7',
      content: 'Tổng hợp các chính sách nội bộ của công ty...',
      createdBy: 'u4', createdAt: daysAgo(90), size: 62000,
      sharedWith: ['u1', 'u2', 'u3', 'u5', 'u6'],
      versions: [
        { version: '1.0', uploadedBy: 'u4', uploadedAt: daysAgo(90), note: 'Bản 2023' },
        { version: '2.0', uploadedBy: 'u4', uploadedAt: daysAgo(10), note: 'Bản 2024' }
      ]
    }
  ];

  /* ── Channels & Messages ────────────────────────────────── */
  const CHANNELS = [
    { id: 'ch1', name: 'chung', type: 'channel', description: 'Kênh chung cho toàn công ty', members: ['u1','u2','u3','u4','u5','u6'] },
    { id: 'ch2', name: 'dev-team', type: 'channel', description: 'Kênh cho nhóm phát triển', members: ['u1','u2','u3','u6'] },
    { id: 'ch3', name: 'marketing', type: 'channel', description: 'Kênh marketing', members: ['u2','u5'] },
    { id: 'ch4', name: 'announcements', type: 'channel', description: 'Thông báo quan trọng', members: ['u1','u2','u3','u4','u5','u6'] },
    { id: 'dm-u2', name: 'Trần Thị Bình', type: 'dm', partnerId: 'u2', members: ['u1','u2'] },
    { id: 'dm-u3', name: 'Lê Minh Cường', type: 'dm', partnerId: 'u3', members: ['u1','u3'] }
  ];

  const MESSAGES = {
    'ch1': [
      { id: 'm1', channelId: 'ch1', userId: 'u4', text: 'Chào mừng tất cả mọi người đến với FlowSpace! 🎉', createdAt: daysAgo(10), reactions: {heart: 3, clap: 2} },
      { id: 'm2', channelId: 'ch1', userId: 'u2', text: 'Cảm ơn anh/chị! Chúng ta sẽ làm việc hiệu quả hơn với công cụ này.', createdAt: daysAgo(10), reactions: {}, replyTo: 'm1' },
      { id: 'm3', channelId: 'ch1', userId: 'u1', text: 'Giao diện đẹp quá! 😍', createdAt: daysAgo(9), reactions: {heart: 2}, pinned: true },
      { id: 'm4', channelId: 'ch1', userId: 'u5', text: 'Khi nào có mobile app vậy?', createdAt: daysAgo(8), reactions: {}, recalled: true },
      { id: 'm5', channelId: 'ch1', userId: 'u3', text: 'Mobile app đang trong roadmap Q4 nhé @u5!', createdAt: daysAgo(8), reactions: {like: 3} }
    ],
    'ch2': [
      { id: 'm6', channelId: 'ch2', userId: 'u2', text: 'Team ơi, sprint review lúc 3h chiều nay nhé.', createdAt: daysAgo(2), reactions: {} },
      { id: 'm7', channelId: 'ch2', userId: 'u1', text: 'OK anh, em sẽ chuẩn bị demo.', createdAt: daysAgo(2), reactions: {} },
      { id: 'm8', channelId: 'ch2', userId: 'u6', text: 'Em sẽ show design mới.', createdAt: daysAgo(2), reactions: {} },
      { id: 'm9', channelId: 'ch2', userId: 'u2', text: 'Perfect! Bug login timeout đã fix chưa @u1?', createdAt: daysAgo(1), reactions: {} },
      { id: 'm10', channelId: 'ch2', userId: 'u1', text: 'Đang fix, còn 1 case edge case nữa.', createdAt: daysAgo(1), reactions: {} }
    ],
    'ch3': [
      { id: 'm11', channelId: 'ch3', userId: 'u5', text: 'Banner FB đã xong, upload lên drive nhé.', createdAt: daysAgo(3), reactions: {like: 1} },
      { id: 'm12', channelId: 'ch3', userId: 'u2', text: 'Cho mình xem với!', createdAt: daysAgo(3), reactions: {} }
    ],
    'ch4': [
      { id: 'm13', channelId: 'ch4', userId: 'u4', text: '📢 Thông báo: Công ty sẽ tổ chức team building vào ngày 20/7. Đăng ký tham dự tại form đính kèm.', createdAt: daysAgo(5), reactions: {heart: 5, party: 4} },
      { id: 'm14', channelId: 'ch4', userId: 'u3', text: '📢 Nhắc nhở: Deadline nộp báo cáo tháng là ngày 15 này. Các team leader xem lại nhé.', createdAt: daysAgo(2), reactions: {} }
    ],
    'dm-u2': [
      { id: 'm15', channelId: 'dm-u2', userId: 'u2', text: 'An ơi, task kanban tiến độ đến đâu rồi?', createdAt: daysAgo(1), reactions: {} },
      { id: 'm16', channelId: 'dm-u2', userId: 'u1', text: 'Dạ em làm được 40%, dự kiến xong tuần này chị ơi.', createdAt: daysAgo(1), reactions: {} }
    ],
    'dm-u3': [
      { id: 'm17', channelId: 'dm-u3', userId: 'u3', text: 'An, khi nào rảnh qua phòng anh một chút nhé.', createdAt: daysAgo(2), reactions: {} },
      { id: 'm18', channelId: 'dm-u3', userId: 'u1', text: 'Dạ, em lên liền ạ!', createdAt: daysAgo(2), reactions: {} }
    ]
  };

  /* ── Requests ───────────────────────────────────────────── */
  const REQUESTS = [
    {
      id: 'r1', type: 'leave', title: 'Xin nghỉ phép 2 ngày',
      description: 'Nghỉ phép cá nhân từ 15/7 đến 16/7/2026.',
      requesterId: 'u1', status: 'approved',
      approvals: [
        { level: 1, role: 'team_lead', approverId: 'u2', status: 'approved', note: 'Đồng ý.', updatedAt: daysAgo(5) },
        { level: 2, role: 'manager',   approverId: 'u3', status: 'approved', note: 'OK.', updatedAt: daysAgo(4) }
      ],
      createdAt: daysAgo(7), updatedAt: daysAgo(4)
    },
    {
      id: 'r2', type: 'overtime', title: 'Đăng ký tăng ca cuối tuần',
      description: 'Tăng ca Thứ 7 ngày 12/7 để hoàn thành sprint.',
      requesterId: 'u1', status: 'pending',
      approvals: [
        { level: 1, role: 'team_lead', approverId: null, status: 'pending', note: '', updatedAt: null }
      ],
      createdAt: daysAgo(1), updatedAt: daysAgo(1)
    },
    {
      id: 'r3', type: 'purchase', title: 'Mua license phần mềm thiết kế',
      description: 'Cần mua license Figma Professional cho team design (3 seats).',
      requesterId: 'u6', status: 'pending',
      approvals: [
        { level: 1, role: 'team_lead', approverId: 'u2', status: 'approved', note: 'Team cần thiết.', updatedAt: daysAgo(3) },
        { level: 2, role: 'manager',   approverId: null, status: 'pending', note: '', updatedAt: null }
      ],
      createdAt: daysAgo(5), updatedAt: daysAgo(3)
    },
    {
      id: 'r4', type: 'leave', title: 'Xin nghỉ ốm',
      description: 'Em bị bệnh cần nghỉ 1 ngày 10/7.',
      requesterId: 'u5', status: 'approved',
      approvals: [
        { level: 1, role: 'team_lead', approverId: 'u2', status: 'approved', note: 'Chúc bạn mau khỏe!', updatedAt: daysAgo(2) }
      ],
      createdAt: daysAgo(3), updatedAt: daysAgo(2)
    },
    {
      id: 'r5', type: 'remote', title: 'Đăng ký làm remote',
      description: 'Làm việc từ xa 3 ngày/tuần trong tháng 7.',
      requesterId: 'u1', status: 'rejected',
      approvals: [
        { level: 1, role: 'team_lead', approverId: 'u2', status: 'rejected', note: 'Dự án gấp, cần có mặt tại văn phòng.', updatedAt: daysAgo(8) }
      ],
      createdAt: daysAgo(10), updatedAt: daysAgo(8)
    }
  ];

  /* ── Notifications ──────────────────────────────────────── */
  function buildNotifications() {
    return [
      { id: 'n1', type: 'task', title: 'Nhiệm vụ mới được giao', text: 'Bạn được giao task "Implement Chart.js Dashboard"', read: false, link: 't2', createdAt: daysAgo(1) },
      { id: 'n2', type: 'comment', title: 'Bình luận mới', text: 'Trưởng nhóm đã bình luận vào task "Fix bug login timeout"', read: false, link: 't11', createdAt: daysAgo(1) },
      { id: 'n3', type: 'approval', title: 'Yêu cầu được duyệt', text: 'Yêu cầu nghỉ phép của bạn đã được phê duyệt', read: true, link: 'r1', createdAt: daysAgo(4) },
      { id: 'n4', type: 'deadline', title: 'Sắp đến hạn', text: 'Task "Thiết kế banner mạng xã hội Q3" đến hạn trong 3 ngày', read: false, link: 't7', createdAt: daysAgo(0) },
      { id: 'n5', type: 'mention', title: 'Được đề cập', text: 'Trưởng nhóm đề cập bạn trong kênh #dev-team', read: true, link: 'ch2', createdAt: daysAgo(1) },
      { id: 'n6', type: 'project', title: 'Dự án mới', text: 'Bạn được thêm vào dự án "API Integration Hub"', read: true, link: 'p4', createdAt: daysAgo(10) },
      { id: 'n7', type: 'overdue', title: 'Quá hạn!', text: 'Task "Fix bug login timeout" đã quá hạn 3 ngày', read: false, link: 't11', createdAt: daysAgo(0) }
    ];
  }

  /* ── Time Logs ──────────────────────────────────────────── */
  const TIME_LOGS = [
    { id: 'tl1', taskId: 't1', userId: 'u6', projectId: 'p1', hours: 8, date: daysAgo(20), note: 'Thiết kế wireframe' },
    { id: 'tl2', taskId: 't1', userId: 'u6', projectId: 'p1', hours: 6, date: daysAgo(12), note: 'Hoàn thiện mockup' },
    { id: 'tl3', taskId: 't2', userId: 'u1', projectId: 'p1', hours: 4, date: daysAgo(7), note: 'Setup Chart.js' },
    { id: 'tl4', taskId: 't2', userId: 'u1', projectId: 'p1', hours: 3, date: daysAgo(5), note: 'Biểu đồ tròn' },
    { id: 'tl5', taskId: 't3', userId: 'u1', projectId: 'p1', hours: 5, date: daysAgo(4), note: 'UI Kanban board' },
    { id: 'tl6', taskId: 't3', userId: 'u1', projectId: 'p1', hours: 3, date: daysAgo(2), note: 'SortableJS integration' },
    { id: 'tl7', taskId: 't7', userId: 'u5', projectId: 'p2', hours: 4, date: daysAgo(8), note: 'Facebook banner' },
    { id: 'tl8', taskId: 't7', userId: 'u5', projectId: 'p2', hours: 2, date: daysAgo(6), note: 'Revision' },
    { id: 'tl9', taskId: 't9', userId: 'u1', projectId: 'p3', hours: 6, date: daysAgo(16), note: 'Soạn nội dung' },
    { id: 'tl10', taskId: 't9', userId: 'u1', projectId: 'p3', hours: 5, date: daysAgo(14), note: 'Review và chỉnh sửa' },
    { id: 'tl11', taskId: 't10', userId: 'u3', projectId: 'p3', hours: 3, date: daysAgo(2), note: 'Chuẩn bị training' },
    { id: 'tl12', taskId: 't11', userId: 'u1', projectId: 'p4', hours: 4, date: daysAgo(12), note: 'Phân tích bug' }
  ];

  /* ── System Logs ────────────────────────────────────────── */
  const SYSTEM_LOGS = [
    { id: 'sl1', userId: 'u4', action: 'LOGIN', module: 'Auth', detail: 'Đăng nhập thành công', ip: '192.168.1.100', createdAt: daysAgo(0) },
    { id: 'sl2', userId: 'u1', action: 'LOGIN', module: 'Auth', detail: 'Đăng nhập thành công', ip: '192.168.1.101', createdAt: daysAgo(0) },
    { id: 'sl3', userId: 'u3', action: 'CREATE', module: 'Project', detail: 'Tạo dự án FlowSpace Platform v2', ip: '192.168.1.102', createdAt: daysAgo(30) },
    { id: 'sl4', userId: 'u2', action: 'ASSIGN', module: 'Task', detail: 'Giao task T-002 cho Nguyễn Văn An', ip: '192.168.1.103', createdAt: daysAgo(8) },
    { id: 'sl5', userId: 'u2', action: 'APPROVE', module: 'Request', detail: 'Phê duyệt yêu cầu nghỉ phép r1', ip: '192.168.1.103', createdAt: daysAgo(5) },
    { id: 'sl6', userId: 'u6', action: 'UPLOAD', module: 'Document', detail: 'Tải lên tài liệu "Presentation khách hàng"', ip: '192.168.1.105', createdAt: daysAgo(10) },
    { id: 'sl7', userId: 'u1', action: 'UPDATE', module: 'Task', detail: 'Cập nhật trạng thái T-003 sang In Progress', ip: '192.168.1.101', createdAt: daysAgo(5) },
    { id: 'sl8', userId: 'u3', action: 'REJECT', module: 'Request', detail: 'Từ chối yêu cầu làm remote r5', ip: '192.168.1.102', createdAt: daysAgo(8) },
    { id: 'sl9', userId: 'u4', action: 'SETTINGS', module: 'System', detail: 'Cập nhật cài đặt hệ thống', ip: '192.168.1.100', createdAt: daysAgo(15) },
    { id: 'sl10', userId: 'u1', action: 'COMMENT', module: 'Task', detail: 'Bình luận trong task T-011', ip: '192.168.1.101', createdAt: daysAgo(1) }
  ];

  /* ── Settings ───────────────────────────────────────────── */
  const SETTINGS = {
    company: { name: 'FlowSpace Corp', logo: null, timezone: 'Asia/Ho_Chi_Minh', language: 'vi', workingDays: [1,2,3,4,5] },
    notifications: { email: true, browser: true, mobile: false, digest: 'daily' },
    security: { sessionTimeout: 60, twoFactor: false, passwordExpiry: 90 },
    workflows: [
      { id: 'wf1', name: 'Phê duyệt nghỉ phép', steps: ['team_lead', 'manager'], active: true },
      { id: 'wf2', name: 'Phê duyệt mua sắm', steps: ['team_lead', 'manager', 'director'], active: true },
      { id: 'wf3', name: 'Phê duyệt tăng ca', steps: ['team_lead'], active: true }
    ]
  };
  const DEFAULT_CATEGORIES = {
    project_types: [
      { id: 'cat_p1', name: 'Nội bộ (Internal)' },
      { id: 'cat_p2', name: 'Khách hàng (Client)' },
      { id: 'cat_p3', name: 'Nghiên cứu & Phát triển (R&D)' }
    ],
    task_types: [
      { id: 'cat_t1', name: 'Nhiệm vụ (Task)' },
      { id: 'cat_t2', name: 'Sửa lỗi (Bug)' },
      { id: 'cat_t3', name: 'Tính năng mới (Feature)' },
      { id: 'cat_t4', name: 'Cải tiến (Improvement)' }
    ],
    request_types: [
      { id: 'cat_r1', name: 'Nghỉ phép (leave)' },
      { id: 'cat_r2', name: 'Tăng ca (overtime)' },
      { id: 'cat_r3', name: 'Mua sắm (purchase)' },
      { id: 'cat_r4', name: 'Làm remote (remote)' }
    ],
    priorities: [
      { id: 'cat_pr1', name: 'Thấp (low)' },
      { id: 'cat_pr2', name: 'Trung bình (medium)' },
      { id: 'cat_pr3', name: 'Cao (high)' }
    ]
  };

  const DEFAULT_WORKFLOW_RULES = [
    { id: 'wf_rule1', reqType: 'purchase', operator: 'gt', value: 10000000, maxRole: 'director', name: 'Mua sắm > 10 triệu cần Ban Giám đốc phê duyệt' },
    { id: 'wf_rule2', reqType: 'leave', operator: 'gt', value: 3, maxRole: 'manager', name: 'Nghỉ phép > 3 ngày cần Trưởng phòng phê duyệt' }
  ];

  const DEFAULT_SLA_SETTINGS = [
    { reqType: 'leave', hours: 24, name: 'Nghỉ phép' },
    { reqType: 'overtime', hours: 12, name: 'Tăng ca' },
    { reqType: 'purchase', hours: 48, name: 'Mua sắm' },
    { reqType: 'remote', hours: 24, name: 'Làm remote' }
  ];

  const DEFAULT_NOTIFICATION_TEMPLATES = [
    { key: 'task_assign', name: 'Giao việc mới', subject: 'Bạn có công việc mới: {task_title}', body: 'Chào {user_name},\n\nBạn đã được phân công thực hiện công việc "{task_title}" thuộc dự án "{project_name}".\nHạn hoàn thành: {due_date}.\n\nVui lòng truy cập hệ thống để xem chi tiết.' },
    { key: 'request_approve', name: 'Phê duyệt yêu cầu', subject: 'Yêu cầu của bạn đã được duyệt: {request_title}', body: 'Chào {user_name},\n\nYêu cầu "{request_title}" của bạn đã được phê duyệt thành công.\nNgười duyệt: {approver_name}.\nGhi chú: {note}' },
    { key: 'request_reject', name: 'Từ chối yêu cầu', subject: 'Yêu cầu bị từ chối: {request_title}', body: 'Chào {user_name},\n\nYêu cầu "{request_title}" của bạn đã bị từ chối.\nNgười duyệt: {approver_name}.\nGhi chú/Lý do: {note}' }
  ];



  /* ── Main seed function ─────────────────────────────────── */
  FS.seedData = function () {
    // Khởi tạo các key mới độc lập nếu chưa có
    if (!localStorage.getItem('fs_categories')) {
      localStorage.setItem('fs_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem('fs_workflow_rules')) {
      localStorage.setItem('fs_workflow_rules', JSON.stringify(DEFAULT_WORKFLOW_RULES));
    }
    if (!localStorage.getItem('fs_sla_settings')) {
      localStorage.setItem('fs_sla_settings', JSON.stringify(DEFAULT_SLA_SETTINGS));
    }
    if (!localStorage.getItem('fs_notification_templates')) {
      localStorage.setItem('fs_notification_templates', JSON.stringify(DEFAULT_NOTIFICATION_TEMPLATES));
    }

    // Đảm bảo fs_users luôn tồn tại (mảng rỗng nếu chưa có)
    if (!localStorage.getItem('fs_users')) {
      localStorage.setItem('fs_users', JSON.stringify([]));
    }

    if (localStorage.getItem(SEED_KEY)) {
      return;
    }

    localStorage.setItem('fs_projects',    JSON.stringify(PROJECTS));
    localStorage.setItem('fs_tasks',       JSON.stringify(TASKS));
    localStorage.setItem('fs_kanban_cols', JSON.stringify(KANBAN_COLUMNS));
    localStorage.setItem('fs_documents',   JSON.stringify(DOCUMENTS));
    localStorage.setItem('fs_channels',    JSON.stringify(CHANNELS));
    localStorage.setItem('fs_messages',    JSON.stringify(MESSAGES));
    localStorage.setItem('fs_requests',    JSON.stringify(REQUESTS));
    localStorage.setItem('fs_time_logs',   JSON.stringify(TIME_LOGS));
    localStorage.setItem('fs_system_logs', JSON.stringify(SYSTEM_LOGS));
    localStorage.setItem('fs_settings',    JSON.stringify(SETTINGS));

    localStorage.setItem(SEED_KEY, '1');
  };



  /* ── Data accessors (CRUD helpers) ─────────────────────── */
  FS.db = {
    get:    (key)       => JSON.parse(localStorage.getItem('fs_' + key) || '[]'),
    set:    (key, data) => localStorage.setItem('fs_' + key, JSON.stringify(data)),
    getMap: (key)       => JSON.parse(localStorage.getItem('fs_' + key) || '{}'),

    find:   (key, id)   => {
      const arr = FS.db.get(key);
      return Array.isArray(arr) ? arr.find(x => x.id === id) : null;
    },
    save:   (key, item) => {
      const arr = FS.db.get(key);
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx >= 0) arr[idx] = item; else arr.push(item);
      FS.db.set(key, arr);
      return item;
    },
    remove: (key, id)   => {
      const arr = FS.db.get(key).filter(x => x.id !== id);
      FS.db.set(key, arr);
    },
    newId:  ()          => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  };

  /* ── Notification helpers ───────────────────────────────── */
  FS.notifications = {
    getForUser: (userId) => {
      const key = 'fs_notifs_' + userId;
      if (!localStorage.getItem(key)) {
        const base = buildNotifications();
        localStorage.setItem(key, JSON.stringify(base));
      }
      return JSON.parse(localStorage.getItem(key));
    },
    markRead: (userId, notifId) => {
      const key = 'fs_notifs_' + userId;
      const notifs = FS.notifications.getForUser(userId);
      const n = notifs.find(x => x.id === notifId);
      if (n) n.read = true;
      localStorage.setItem(key, JSON.stringify(notifs));
    },
    markAllRead: (userId) => {
      const key = 'fs_notifs_' + userId;
      const notifs = FS.notifications.getForUser(userId);
      notifs.forEach(n => n.read = true);
      localStorage.setItem(key, JSON.stringify(notifs));
    },
    unreadCount: (userId) => FS.notifications.getForUser(userId).filter(n => !n.read).length
  };

})(window.FS = window.FS || {});
