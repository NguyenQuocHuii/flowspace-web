(function (FS) {
  "use strict";

  const SESSION_KEY = "fs_session";

  /* ── Role definitions ───────────────────────────────────── */
  const ROLE_LEVELS = { employee: 1, team_lead: 2, manager: 3, director: 4 };

  const ROLE_LABELS = {
    employee: "Nhân viên",
    team_lead: "Trưởng nhóm",
    manager: "Trưởng phòng",
    director: "Ban giám đốc",
  };

  // Pages visible by minimum role level
  const PAGE_ACCESS = {
    dashboard: 1,
    projects: 1,
    tasks: 1,
    kanban: 1,
    gantt: 2,
    calendar: 1,
    documents: 1,
    chat: 1,
    requests: 1,
    approvals: 2,
    timetracking: 1,
    reports: 3,
    users: 4,
    logs: 4,
    settings: 1,
  };

  const API_BASE = "https://flowspace-backend-7ql5.onrender.com";

  FS.API_BASE = API_BASE;

  /* ── Password helpers (simple encode — NOT cryptographic) ── */
  function _encodePassword(plain) {
    return btoa(unescape(encodeURIComponent(plain)));
  }
  function _decodePassword(encoded) {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return "";
    }
  }
  function _isEncoded(str) {
    try {
      atob(str);
      return str.length > 0 && !/\s/.test(str);
    } catch {
      return false;
    }
  }

  /* ── Auth API ───────────────────────────────────────────── */
  FS.auth = {
    /**
     * Đăng nhập bằng email + password
     * Ưu tiên Backend API → fallback localStorage khi offline
     */
    async login(email, password) {
      // Thử tối đa 2 lần để xử lý Render Free Tier cold start (cần 30-60s khởi động)
      for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const authData = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/login",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ email: email, password: password }),
          timeout: 65000, // Tăng lên 65 giây để chờ Render khởi động xong
        });

        if (authData && authData.accessToken && authData.user) {
          const session = {
            userId: authData.user.id,
            name: authData.user.name,
            email: authData.user.email,
            role: authData.user.role,
            token: authData.accessToken,
            refreshToken: authData.refreshToken,
            expiresAt: authData.expiresInMinutes
              ? new Date(
                  Date.now() + authData.expiresInMinutes * 60 * 1000,
                ).toISOString()
              : null,
            avatar:
              authData.user.avatar ||
              authData.user.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            color: authData.user.color || "#6366f1",
            loginAt: new Date().toISOString(),
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session;
        }
        return { error: "Phản hồi đăng nhập không hợp lệ từ máy chủ." };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        const errorCode = errorResponse.errorCode || null;

        // Nếu là lỗi timeout/network (không phải lỗi 401/400) và còn lượt thử → retry
        const isNetworkError = !apiErr.status || apiErr.status === 0 || apiErr.statusText === "timeout";
        if (isNetworkError && attempt < 2) {
          // Máy chủ đang thức dậy, chờ 3 giây rồi thử lại
          await new Promise(r => setTimeout(r, 3000));
          continue; // thử lại vòng lặp
        }

        const message = errorResponse.message ||
          (isNetworkError
            ? "Máy chủ đang khởi động, vui lòng thử đăng nhập lại sau 30 giây."
            : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.");
        return { error: message, errorCode: errorCode };
      }
      } // end for loop
    },


    /**
     * Đăng ký tài khoản mới
     * Ưu tiên Backend API → fallback localStorage khi offline
     */
    async register(data) {
      // data = { name, email, password }
      try {
        const response = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/register",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
          }),
          timeout: 8000,
        });
        return { success: true, message: response.message };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        const message =
          errorResponse.message || "Đăng ký thất bại. Vui lòng thử lại.";
        return { error: message };
      }
    },

    /** Đăng xuất */
    logout() {
      const session = FS.auth.getSession();
      if (session && session.refreshToken) {
        // Gọi API để thu hồi refresh token ở backend (fire-and-forget)
        $.ajax({
          url: FS.API_BASE + "/api/v1/auth/logout",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ refreshToken: session.refreshToken }),
        }).fail(function (err) {
          console.error("Backend logout failed.", err);
        });
      }
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    },

    async forgotPassword(email) {
      try {
        const response = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/forgot-password",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ email: email }),
        });
        return { success: true, message: response.message };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        return {
          error: errorResponse.message || "Yêu cầu thất bại. Vui lòng thử lại.",
        };
      }
    },

    async resetPassword(email, token, newPassword) {
      try {
        const response = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/reset-password",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ email, token, newPassword }),
        });
        return { success: true, message: response.message };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        return {
          error:
            errorResponse.message ||
            "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
        };
      }
    },

    async verifyEmail(email, token) {
      try {
        const response = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/verify-email",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ email, token }),
        });
        return { success: true, message: response.message };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        return {
          error:
            errorResponse.message ||
            "Xác thực email thất bại. Vui lòng thử lại.",
        };
      }
    },

    async resendVerification(email) {
      try {
        const response = await $.ajax({
          url: FS.API_BASE + "/api/v1/auth/resend-verification",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ email: email }),
        });
        return { success: true, message: response.message };
      } catch (apiErr) {
        const errorResponse = apiErr.responseJSON || {};
        return {
          error:
            errorResponse.message ||
            "Gửi lại email xác thực thất bại. Vui lòng thử lại.",
        };
      }
    },

    /** Lấy session hiện tại */
    getSession() {
      try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
      } catch {
        return null;
      }
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
    isEmployee() {
      return FS.auth.getSession()?.role === "employee";
    },
    isTeamLead() {
      return FS.auth.getRoleLevel() >= ROLE_LEVELS.team_lead;
    },
    isManager() {
      return FS.auth.getRoleLevel() >= ROLE_LEVELS.manager;
    },
    isDirector() {
      return FS.auth.getSession()?.role === "director";
    },

    /** Lấy role label */
    getRoleLabel(role) {
      return ROLE_LABELS[role] || role;
    },

    /** Bảo vệ trang — gọi ở đầu app.html */
    guard() {
      if (!FS.auth.isLoggedIn()) {
        window.location.href = "login.html";
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
      var users = JSON.parse(localStorage.getItem("fs_users") || "[]");
      var idx = users.findIndex(function (u) {
        return u.id === session.userId;
      });
      if (idx >= 0) {
        if (updates.name) {
          users[idx].name = updates.name;
          users[idx].fullName = updates.name;
        }
        if (updates.email) users[idx].email = updates.email;
        if (updates.avatar) users[idx].avatar = updates.avatar;
        if (updates.password)
          users[idx].password = _encodePassword(updates.password);
        localStorage.setItem("fs_users", JSON.stringify(users));
      }
      return true;
    },

    /**
     * Xác thực password hiện tại (dùng cho đổi password)
     */
    verifyPassword(currentPassword) {
      var session = FS.auth.getSession();
      if (!session) return false;
      var users = JSON.parse(localStorage.getItem("fs_users") || "[]");
      var user = users.find(function (u) {
        return u.id === session.userId;
      });
      if (!user) return false;
      if (_isEncoded(user.password)) {
        return _decodePassword(user.password) === currentPassword;
      }
      return user.password === currentPassword;
    },
  };

  /* ── Export constants ───────────────────────────────────── */
  FS.ROLE_LEVELS = ROLE_LEVELS;
  FS.ROLE_LABELS = ROLE_LABELS;
  FS.PAGE_ACCESS = PAGE_ACCESS;
})((window.FS = window.FS || {}));
