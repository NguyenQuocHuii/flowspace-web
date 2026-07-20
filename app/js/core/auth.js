(function (FS) {
  'use strict';

  const SESSION_KEY = 'fs_session';

  /* ── Role definitions ───────────────────────────────────── */
  const ROLE_LEVELS = { employee: 1, team_lead: 2, manager: 3, director: 4 };

  const ROLE_LABELS = {
    employee:  'Nhân viên',
    team_lead: 'Trưởng nhóm',
    manager:   'Trưởng phòng',
    director:  'Ban giám đốc'
  };

  // Pages visible by minimum role level
  const PAGE_ACCESS = {
    dashboard:    1,
    projects:     1,
    tasks:        1,
    kanban:       1,
    gantt:        2,
    calendar:     1,
    documents:    1,
    chat:         1,
    requests:     1,
    approvals:    2,
    timetracking: 1,
    reports:      3,
    users:        4,
    logs:         4,
    settings:     1
  };

  const API_BASE = 'https://flowspace-backend-7ql5.onrender.com';

  FS.API_BASE = API_BASE;

  /* ── Password helpers (simple encode — NOT cryptographic) ── */
  function _encodePassword(plain) {
    return btoa(unescape(encodeURIComponent(plain)));
  }
  function _decodePassword(encoded) {
    try { return decodeURIComponent(escape(atob(encoded))); } catch { return ''; }
  }
  function _isEncoded(str) {
    try { atob(str); return str.length > 0 && !/\s/.test(str); } catch { return false; }
  }

  /* ── Auth API ───────────────────────────────────────────── */
  FS.auth = {
    /**
     * Đăng nhập bằng email + password
     * Ưu tiên Backend API → fallback localStorage khi offline
     */
    async login(email, password) {
      // 1. Try Backend API first
      try {
        const response = await $.ajax({
          url: FS.API_BASE + '/api/v1/auth/login',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ email: email, password: password }),
          timeout: 8000
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
            avatar:    authData.user.avatar || authData.user.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase(),
            color:     authData.user.color || '#6366f1',
            loginAt:   new Date().toISOString()
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session;
        }
        return null;
      } catch (apiErr) {
        // 2. Fallback: tìm user trong localStorage
        var users = JSON.parse(localStorage.getItem('fs_users') || '[]');
        var user = users.find(function(u) {
          return u.email && u.email.toLowerCase() === email.toLowerCase();
        });

        if (!user) return null;

        // So sánh password
        var storedPwd = user.password;
        var match = false;
        if (_isEncoded(storedPwd)) {
          match = _decodePassword(storedPwd) === password;
        } else {
          match = storedPwd === password;
        }

        if (!match) return null;
        if (user.status === 'inactive') return null;

        var session = {
          userId:    user.id,
          name:      user.fullName || user.name,
          email:     user.email,
          role:      user.role || 'employee',
          token:     null,
          refreshToken: null,
          expiresAt: null,
          avatar:    user.avatar || (user.fullName || user.name || '?').split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase(),
          color:     user.color || '#6366f1',
          loginAt:   new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        FS.auth._appendLog(user.id, 'LOGIN', 'Auth', 'Đăng nhập (offline)');
        return session;
      }
    },

    /**
     * Đăng ký tài khoản mới
     * Ưu tiên Backend API → fallback localStorage khi offline
     */
    async register(data) {
      // data = { name, email, password }

      // 1. Try Backend API first
      try {
        var avatar = data.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
        var response = await $.ajax({
          url: FS.API_BASE + '/api/v1/auth/register',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
            avatar: avatar,
            color: '#6366f1'
          }),
          timeout: 8000
        });
        if (response && response.success) {
          // Auto-login sau đăng ký
          return await FS.auth.login(data.email, data.password);
        }
        // API returned error (e.g. email exists)
        return { error: (response && response.message) || 'Đăng ký thất bại.' };
      } catch (apiErr) {
        // 2. Fallback: lưu vào localStorage
        var users = JSON.parse(localStorage.getItem('fs_users') || '[]');

        // Check email trùng
        var emailExists = users.some(function(u) {
          return u.email && u.email.toLowerCase() === data.email.toLowerCase();
        });
        if (emailExists) {
          return { error: 'Email đã được sử dụng.' };
        }

        var newAvatar = data.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
        var newUser = {
          id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          fullName: data.name,
          name: data.name,
          email: data.email,
          password: _encodePassword(data.password),
          role: 'employee',
          status: 'active',
          avatar: newAvatar,
          color: '#6366f1',
          department: '',
          position: 'Nhân viên',
          phone: '',
          joinDate: new Date().toISOString(),
          active: true,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('fs_users', JSON.stringify(users));

        // Auto-login
        var session = {
          userId:    newUser.id,
          name:      newUser.name,
          email:     newUser.email,
          role:      newUser.role,
          token:     null,
          refreshToken: null,
          expiresAt: null,
          avatar:    newUser.avatar,
          color:     newUser.color,
          loginAt:   new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        FS.auth._appendLog(newUser.id, 'REGISTER', 'Auth', 'Đăng ký tài khoản mới (offline)');
        return session;
      }
    },

    /** Đăng xuất */
    logout() {
      var session = FS.auth.getSession();
      if (session) {
        FS.auth._appendLog(session.userId, 'LOGOUT', 'Auth', 'Đăng xuất');
      }
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'login.html';
    },

    /** Lấy session hiện tại */
    getSession() {
      try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
      } catch { return null; }
    },

    /** Kiểm tra đã đăng nhập chưa */
    isLoggedIn() {
      return !!FS.auth.getSession();
    },

    /** Lấy role level của user hiện tại */
    getRoleLevel() {
      var s = FS.auth.getSession();
      if (!s) return 0;
      return ROLE_LEVELS[s.role] || 0;
    },

    /** Kiểm tra có quyền truy cập trang không */
    canAccess(page) {
      var required = PAGE_ACCESS[page] || 99;
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

    /**
     * Cập nhật thông tin user trong localStorage
     * Dùng cho Settings khi đổi tên/email/password
     */
    updateUser(updates) {
      var session = FS.auth.getSession();
      if (!session) return false;

      // Update session
      if (updates.name) session.name = updates.name;
      if (updates.email) session.email = updates.email;
      if (updates.avatar) session.avatar = updates.avatar;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Update user in fs_users
      var users = JSON.parse(localStorage.getItem('fs_users') || '[]');
      var idx = users.findIndex(function(u) { return u.id === session.userId; });
      if (idx >= 0) {
        if (updates.name) { users[idx].name = updates.name; users[idx].fullName = updates.name; }
        if (updates.email) users[idx].email = updates.email;
        if (updates.avatar) users[idx].avatar = updates.avatar;
        if (updates.password) users[idx].password = _encodePassword(updates.password);
        localStorage.setItem('fs_users', JSON.stringify(users));
      }
      return true;
    },

    /**
     * Xác thực password hiện tại (dùng cho đổi password)
     */
    verifyPassword(currentPassword) {
      var session = FS.auth.getSession();
      if (!session) return false;
      var users = JSON.parse(localStorage.getItem('fs_users') || '[]');
      var user = users.find(function(u) { return u.id === session.userId; });
      if (!user) return false;
      if (_isEncoded(user.password)) {
        return _decodePassword(user.password) === currentPassword;
      }
      return user.password === currentPassword;
    },

    /** Append log hệ thống */
    _appendLog(userId, action, module, detail) {
      try {
        var logs = FS.db.get('system_logs');
        logs.unshift({
          id: FS.db.newId(),
          userId: userId, action: action, module: module, detail: detail,
          ip: '192.168.1.' + Math.floor(Math.random() * 50 + 100),
          createdAt: new Date().toISOString()
        });
        FS.db.set('system_logs', logs.slice(0, 200));
      } catch (e) { /* ignore */ }
    }
  };

  /* ── Export constants ───────────────────────────────────── */
  FS.ROLE_LEVELS  = ROLE_LEVELS;
  FS.ROLE_LABELS  = ROLE_LABELS;
  FS.PAGE_ACCESS  = PAGE_ACCESS;

})(window.FS = window.FS || {});
