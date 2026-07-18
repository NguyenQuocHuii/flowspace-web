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

  /* ── User helpers ────────────────────────────────────────── */
  FS.user = {
    /** Lấy user object theo id */
    get(id) {
      return FS.db.find('users', id);
    },

    /** Render avatar HTML */
    avatar(id, size = '') {
      const u = FS.user.get(id);
      if (!u) return `<div class="fs-avatar ${size}">?</div>`;
      return `<div class="fs-avatar ${size} ${u.color || 'av-indigo'}" title="${u.name}">${u.avatar}</div>`;
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

  /* ── Dropdown close on outside click ────────────────────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.fs-dropdown')) {
      document.querySelectorAll('.fs-dropdown-menu.show').forEach(el => el.classList.remove('show'));
    }
  });

})(window.FS = window.FS || {});
