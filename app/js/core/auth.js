(function (FS) {
  'use strict';

  const SESSION_KEY = 'fs_session';

  /* ── Role definitions ───────────────────────────────────── */
  // Role hierarchy: employee < team_lead < manager < director
  const ROLE_LEVELS = { employee: 1, team_lead: 2, manager: 3, director: 4 };

  const ROLE_LABELS = {
    employee:  'Nhân viên',
    team_lead: 'Trưởng nhóm',
    manager:   'Trưởng phòng',
    director:  'Ban giám đốc'
  };

  // Pages visible by minimum role level
  const PAGE_ACCESS = {
    dashboard:    1, // all
    projects:     1,
    tasks:        1,
    kanban:       1,
    gantt:        2, // team_lead+
    calendar:     1,
    documents:    1,
    chat:         1,
    requests:     1,
    approvals:    2, // team_lead+
    timetracking: 1,
    reports:      3, // manager+
    users:        4, // director
    logs:         4,
    settings:     1  // all users (admin tabs are hidden dynamically)
  };

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://localhost:7297'
    : 'https://flowspace-backend.onrender.com'; // Thay thế bằng URL API Production Render thực tế của bạn

  FS.API_BASE = API_BASE;

  /* ── Auth API ───────────────────────────────────────────── */
  FS.auth = {
    /**
     * Đăng nhập với email + password (xác thực hoàn toàn cục bộ qua localStorage)
     * @returns {object|null} user object hoặc null nếu sai
     */
    async login(email, password) {
      try {
        const response = await $.ajax({
          url: FS.API_BASE + '/api/v1/auth/login',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ email: email, password: password })
        });
        if (response && response.success && response.data) {
          const authData = response.data;
          const session = {
            userId:    authData.user.id,
            name:      authData.user.name,
            email:     authData.user.email,
            role:      authData.user.role,
            token:     authData.accessToken,
            refreshToken: authData.refreshToken,
            expiresAt: new Date(Date.now() + authData.expiresInMinutes * 60 * 1000).toISOString(),
            avatar:    authData.user.avatar || authData.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            color:     authData.user.color || '#6366f1',
            loginAt:   new Date().toISOString()
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session;
        }
        return null;
      } catch (err) {
        console.error('Login API error:', err);
        return null;
      }
    },

    /** Đăng xuất */
    logout() {
      const session = FS.auth.getSession();
      if (session) {
        FS.auth._appendLog(session.userId, 'LOGOUT', 'Auth', 'Đăng xuất');
      }
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = 'login.html';
    },

    /** Lấy session hiện tại */
    getSession() {
      try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
      } catch { return null; }
    },

    /** Kiểm tra đã đăng nhập chưa */
    isLoggedIn() {
      return !!FS.auth.getSession();
    },

    /** Lấy role level của user hiện tại */
    getRoleLevel() {
      const s = FS.auth.getSession();
      if (!s) return 0;
      return ROLE_LEVELS[s.role] || 0;
    },

    /** Kiểm tra có quyền truy cập trang không */
    canAccess(page) {
      const required = PAGE_ACCESS[page] || 99;
      return FS.auth.getRoleLevel() >= required;
    },

    /** Kiểm tra có tối thiểu role level không */
    hasLevel(minLevel) {
      return FS.auth.getRoleLevel() >= minLevel;
    },

    /** Tiện ích kiểm tra role */
    isEmployee()  { return FS.auth.getSession()?.role === 'employee'; },
    isTeamLead()  { return FS.auth.getRoleLevel() >= ROLE_LEVELS.team_lead; },
    isManager()   { return FS.auth.getRoleLevel() >= ROLE_LEVELS.manager; },
    isDirector()  { return FS.auth.getSession()?.role === 'director'; },

    /** Lấy role label */
    getRoleLabel(role) {
      return ROLE_LABELS[role] || role;
    },

    /** Bảo vệ trang — gọi ở đầu app.html */
    guard() {
      if (!FS.auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    },

    /** Append log hệ thống */
    _appendLog(userId, action, module, detail) {
      try {
        const logs = FS.db.get('system_logs');
        logs.unshift({
          id: FS.db.newId(),
          userId, action, module, detail,
          ip: '192.168.1.' + Math.floor(Math.random() * 50 + 100),
          createdAt: new Date().toISOString()
        });
        FS.db.set('system_logs', logs.slice(0, 200)); // giữ 200 log gần nhất
      } catch (e) { /* ignore */ }
    }
  };

  /* ── Export constants ───────────────────────────────────── */
  FS.ROLE_LEVELS  = ROLE_LEVELS;
  FS.ROLE_LABELS  = ROLE_LABELS;
  FS.PAGE_ACCESS  = PAGE_ACCESS;

})(window.FS = window.FS || {});
