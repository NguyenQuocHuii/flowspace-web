/**
 * FlowSpace — Global Utilities & Toast
 * Tiện ích dùng chung toàn app
 */
(function (FS) {
  'use strict';

  /* ── Toast notifications ────────────────────────────────── */
  let _toastContainer = null;

  function getToastContainer() {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.className = 'fs-toast-container';
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  /**
   * Hiển thị toast
   * @param {string} message
   * @param {string} type — 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration — ms
   */
  FS.toast = function (message, type = 'info', duration = 3500) {
    const icons = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill'
    };
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `fs-toast toast-${type}`;
    toast.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  /* ── Date / Time helpers ─────────────────────────────────── */
  FS.date = {
    /**
     * Format ISO date → "12/07/2026"
     */
    format(iso, opts = {}) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return '—';
      if (opts.time) {
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
               ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    /** Format ISO → "12 thg 7" */
    short(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    },

    /** Relative time — "3 ngày trước", "trong 2 ngày" */
    relative(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const diff = Math.round((d - Date.now()) / 86400000);
      if (diff === 0) return 'Hôm nay';
      if (diff === 1) return 'Ngày mai';
      if (diff === -1) return 'Hôm qua';
      if (diff > 1)  return `Còn ${diff} ngày`;
      return `${Math.abs(diff)} ngày trước`;
    },

    /** Kiểm tra quá hạn */
    isOverdue(iso) {
      if (!iso) return false;
      return new Date(iso) < new Date();
    },

    /** Format cho input[type=date] → YYYY-MM-DD */
    toInput(iso) {
      if (!iso) return '';
      return new Date(iso).toISOString().slice(0, 10);
    },

    /** Relative chat time */
    chatTime(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
      if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  /* ── String helpers ──────────────────────────────────────── */
  FS.str = {
    /** Truncate string */
    truncate: (s, n = 50) => s && s.length > n ? s.slice(0, n) + '…' : s,

    /** Escape HTML */
    escape: (s) => {
      if (!s) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    /** Viết hoa chữ cái đầu */
    capitalize: (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '',

    /** Format số bytes → "2.3 MB" */
    fileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  };

  FS.usersCache = [];
  FS.loadUsersCache = async function () {
    if (FS.usersCache && FS.usersCache.length > 0) return FS.usersCache;
    try {
      const response = await FS.apiCall({
        url: FS.API_BASE + '/api/v1/chat/users',
        type: 'GET'
      });
      if (response && response.success && Array.isArray(response.data)) {
        FS.usersCache = response.data;
      } else {
        FS.usersCache = FS.db.get('users') || [];
      }
    } catch (e) {
      console.warn('Failed to load users cache:', e);
      FS.usersCache = FS.db.get('users') || [];
    }
    return FS.usersCache;
  };

  /* ── User helpers ────────────────────────────────────────── */
  FS.user = {
    /** Lấy user object theo id */
    get(id) {
      if (!FS.usersCache || !FS.usersCache.length) {
        return FS.db.find('users', id);
      }
      return FS.usersCache.find(u => u.id === id);
    },

    /** Render avatar HTML */
    avatar(id, size = '') {
      const u = FS.user.get(id);
      if (!u) return `<div class="fs-avatar ${size}">?</div>`;
      return `<div class="fs-avatar ${size} ${u.color || 'av-indigo'}" title="${u.name}">${u.avatar || u.name.substring(0, 2).toUpperCase()}</div>`;
    },

    /** Lấy tên user */
    name(id) {
      const u = FS.user.get(id);
      return u ? u.name : 'Unknown';
    }
  };


  /* ── Status / Priority badge helpers ────────────────────── */
  FS.badge = {
    status(status) {
      const map = {
        'todo':        { cls: 'badge-neutral',  label: 'Chưa bắt đầu' },
        'in_progress': { cls: 'badge-accent',   label: 'Đang làm' },
        'review':      { cls: 'badge-warning',  label: 'Chờ duyệt' },
        'done':        { cls: 'badge-success',  label: 'Hoàn thành' },
        'cancelled':   { cls: 'badge-neutral',  label: 'Đã huỷ' },
        'active':      { cls: 'badge-success',  label: 'Đang chạy' },
        'on_hold':     { cls: 'badge-warning',  label: 'Tạm dừng' },
        'approved':    { cls: 'badge-success',  label: 'Đã duyệt' },
        'pending':     { cls: 'badge-warning',  label: 'Chờ duyệt' },
        'rejected':    { cls: 'badge-danger',   label: 'Từ chối' }
      };
      const b = map[status] || { cls: 'badge-neutral', label: status };
      return `<span class="fs-badge ${b.cls}">${b.label}</span>`;
    },

    priority(priority) {
      const map = {
        'high':   { cls: 'badge-priority-high',   label: 'Cao', icon: 'bi-arrow-up' },
        'medium': { cls: 'badge-priority-medium', label: 'TB',  icon: 'bi-dash' },
        'low':    { cls: 'badge-priority-low',    label: 'Thấp',icon: 'bi-arrow-down' }
      };
      const b = map[priority] || { cls: 'badge-priority-none', label: '—', icon: '' };
      return `<span class="fs-badge ${b.cls}"><i class="bi ${b.icon}"></i>${b.label}</span>`;
    },

    reqType(type) {
      const map = {
        'leave':    { cls: 'badge-info',    label: 'Nghỉ phép' },
        'overtime': { cls: 'badge-warning', label: 'Tăng ca' },
        'purchase': { cls: 'badge-accent',  label: 'Mua sắm' },
        'remote':   { cls: 'badge-neutral', label: 'Làm remote' }
      };
      const b = map[type] || { cls: 'badge-neutral', label: type };
      return `<span class="fs-badge ${b.cls}">${b.label}</span>`;
    }
  };

  /* ── Confirm dialog ──────────────────────────────────────── */
  FS.confirm = function (message, onConfirm, opts = {}) {
    const title = opts.title || 'Xác nhận';
    const confirmText = opts.confirmText || 'Xác nhận';
    const danger = opts.danger !== false;

    const id = 'fs-confirm-' + Date.now();
    const html = `
      <div class="fs-modal-overlay" id="${id}-overlay">
        <div class="fs-modal" style="max-width:400px">
          <div class="fs-modal-header">
            <h5 class="fs-h5 m-0">${title}</h5>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="document.getElementById('${id}-overlay').remove()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="fs-modal-body">
            <p style="color:var(--fs-text-secondary)">${message}</p>
          </div>
          <div class="fs-modal-footer">
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('${id}-overlay').remove()">Hủy</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" id="${id}-confirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById(id + '-confirm').addEventListener('click', function () {
      document.getElementById(id + '-overlay').remove();
      onConfirm();
    });
  };

  /* ── Sidebar Project Sync ──────────────────────────────── */
  FS.syncSidebarProjects = async function () {
    const $container = $('#sidebar-project-items');
    if (!$container.length) return;

    let projects = [];
    let isOffline = false;
    try {
      const response = await FS.apiCall({
        url: FS.API_BASE + '/api/v1/projects',
        type: 'GET'
      });
      if (response && response.success && Array.isArray(response.data)) {
        projects = response.data;
        $('#sidebar-proj-header-status').remove();
      } else {
        projects = FS.db.get('projects') || [];
        isOffline = true;
      }
    } catch {
      projects = FS.db.get('projects') || [];
      isOffline = true;
    }

    if (isOffline) {
      if (!$('#sidebar-proj-header-status').length) {
        $container.parent().find('.fs-sidebar-section-title').append('<span id="sidebar-proj-header-status" style="font-size:9px;color:var(--fs-danger);font-weight:600;margin-left:5px">(Ngoại tuyến)</span>');
      }
    } else {
      $('#sidebar-proj-header-status').remove();
    }

    if (!projects.length) {
      $container.html('');
      return;
    }

    $container.html(projects.slice(0, 5).map(p => {
      const code = p.code || 'FS';
      return `
        <a href="#" class="d-flex align-items-center gap-2 py-1 px-2 text-decoration-none rounded text-truncate proj-sub-item" data-proj-id="${p.id}" style="font-size:12px;color:var(--fs-text-muted);line-height:1.4">
          <span class="fs-avatar fs-avatar-xs" style="width:18px;height:18px;font-size:9px;background:var(--fs-accent-light);color:var(--fs-accent);flex-shrink:0">${FS.str.escape(code.slice(-3))}</span>
          <span class="truncate" style="flex:1">${FS.str.escape(p.name)}</span>
        </a>`;
    }).join(''));

    $container.show();
  };

  /* ── API CALL WITH RETRY & COLD START DETECTOR ─────────── */
  let _coldStartTimer = null;
  let _coldStartHud = null;
  let _isFirstRequest = true;

  function showColdStartHud() {
    if (_coldStartHud) return;
    _coldStartHud = document.createElement('div');
    _coldStartHud.className = 'fs-cold-start-hud';
    _coldStartHud.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1e293b;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.25);z-index:9999;font-size:13px;font-weight:500;display:flex;align-items:center;gap:10px;animation:slideUp 0.3s ease;border:1px solid rgba(255,255,255,0.1)';
    _coldStartHud.innerHTML = '<span class="fs-spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#fff"></span> Đang đánh thức máy chủ (Render Free Tier có thể mất 30s-60s)...';
    document.body.appendChild(_coldStartHud);
  }

  function hideColdStartHud() {
    if (_coldStartHud) {
      _coldStartHud.remove();
      _coldStartHud = null;
    }
  }

  FS.apiCall = function (options) {
    const session = FS.auth ? FS.auth.getSession() : null;
    const authHeaders = session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    
    const ajaxOptions = $.extend(true, {
      timeout: 20000, // 20s
      headers: authHeaders,
      contentType: 'application/json',
      xhrFields: { withCredentials: true },
      crossDomain: true
    }, options);

    if (ajaxOptions.data && typeof ajaxOptions.data === 'object' && !(ajaxOptions.data instanceof FormData)) {
      ajaxOptions.data = JSON.stringify(ajaxOptions.data);
    }

    let isRequestFinished = false;

    // Start timer for cold-start warning on first request
    if (_isFirstRequest) {
      _coldStartTimer = setTimeout(() => {
        if (!isRequestFinished) {
          showColdStartHud();
        }
      }, 3000);
      _isFirstRequest = false;
    }

    const executeRequest = (attempt) => {
      return new Promise((resolve, reject) => {
        $.ajax(ajaxOptions)
          .done(res => {
            isRequestFinished = true;
            clearTimeout(_coldStartTimer);
            hideColdStartHud();
            resolve(res);
          })
          .fail((xhr, status, err) => {
            // Check for retry if status is network failure / timeout and it's the first attempt
            if (attempt === 1 && (status === 'timeout' || xhr.status === 0)) {
              console.warn('API call failed/timeout, retrying in 1s...');
              setTimeout(() => {
                executeRequest(2).then(resolve).catch(reject);
              }, 1000);
            } else {
              isRequestFinished = true;
              clearTimeout(_coldStartTimer);
              hideColdStartHud();
              reject({ xhr, status, err });
            }
          });
      });
    };

    return executeRequest(1);
  };

  /* ── Dropdown close on outside click ────────────────────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.fs-dropdown')) {
      document.querySelectorAll('.fs-dropdown-menu.show').forEach(el => el.classList.remove('show'));
    }
  });

  /**
   * Hiển thị dialog xác nhận đẹp mắt, chuẩn Senior UI/UX
   */
  FS.confirm = function (options = {}) {
    const title = options.title || "Xác nhận";
    const message = options.message || "Bạn có chắc chắn muốn thực hiện hành động này?";
    const confirmText = options.confirmText || "Đồng ý";
    const cancelText = options.cancelText || "Hủy";
    const type = options.type || "info";

    const modalHtml = `
      <div class="fs-modal-overlay" id="fs-confirm-overlay" role="dialog" aria-modal="true" style="display: none;">
        <div class="fs-modal fs-confirm-dialog" style="max-width: 400px; padding: 24px;">
          <div class="fs-modal-header" style="border-bottom: none; padding: 0 0 12px 0;">
            <h5 class="m-0 d-flex align-items-center gap-2" style="font-size: var(--fs-text-lg); font-weight: 600;">
              <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-question-circle-fill text-primary'}" style="font-size: 20px;"></i>
              ${title}
            </h5>
          </div>
          <div class="fs-modal-body" style="padding: 0 0 20px 0;">
            <p class="m-0 text-secondary" style="font-size: var(--fs-text-sm); line-height: 1.5; color: var(--fs-text-secondary);">${message}</p>
          </div>
          <div class="fs-modal-footer" style="border-top: none; padding: 0; display: flex; justify-content: flex-end; gap: 12px; background: transparent;">
            <button class="btn btn-outline-secondary btn-sm" id="fs-confirm-cancel-btn" type="button" style="padding: 6px 16px; border-radius: var(--fs-radius-md); font-weight: 500;">${cancelText}</button>
            <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'} btn-sm" id="fs-confirm-ok-btn" type="button" style="padding: 6px 16px; border-radius: var(--fs-radius-md); font-weight: 500;">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const $overlay = $(modalHtml).appendTo('body');
    $overlay.fadeIn(150);
    $('#fs-confirm-ok-btn').trigger('focus');

    return new Promise((resolve) => {
      $('#fs-confirm-ok-btn').on('click', () => {
        $overlay.fadeOut(150, () => $overlay.remove());
        if (typeof options.onConfirm === 'function') options.onConfirm();
        resolve(true);
      });

      $('#fs-confirm-cancel-btn, #fs-confirm-overlay').on('click', function (e) {
        if (e.target === this || e.target.id === 'fs-confirm-cancel-btn') {
          $overlay.fadeOut(150, () => $overlay.remove());
          resolve(false);
        }
      });

      $(document).one('keydown.fs-confirm-esc', (e) => {
        if (e.key === 'Escape') {
          $overlay.fadeOut(150, () => $overlay.remove());
          resolve(false);
        }
      });
    });
  };

})(window.FS = window.FS || {});
