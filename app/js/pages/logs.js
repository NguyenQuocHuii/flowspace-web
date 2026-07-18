/**
 * FlowSpace — System Logs Module (Director only)
 */
(function (FS, $) {
  'use strict';

  const PAGE_SIZE = 15;
  const ACTION_COLORS = {
    LOGIN: 'av-green', LOGOUT: 'av-teal', CREATE: 'av-indigo',
    UPDATE: 'av-amber', ASSIGN: 'av-violet', APPROVE: 'av-green',
    REJECT: 'av-rose', UPLOAD: 'av-cyan', COMMENT: 'av-blue'
  };

  FS.pages.logs = {
    _filter: { search: '', action: '', user: '' },
    _page: 1,

    init() {
      if (!FS.auth.isDirector()) {
        document.getElementById('logs-table-body').innerHTML =
          '<tr><td colspan="6"><div class="fs-empty"><i class="bi bi-shield-lock"></i><h5>Không có quyền</h5></div></td></tr>';
        return;
      }
      this._populateUserFilter();
      this._render();
      this._bindEvents();
    },

    _populateUserFilter() {
      const users = FS.db.get('users');
      document.getElementById('logs-filter-user').innerHTML += users.map(u =>
        `<option value="${u.id}">${u.name}</option>`).join('');
    },

    _getData() {
      let logs = FS.db.get('system_logs');
      const { search, action, user } = this._filter;
      if (search) {
        const q = search.toLowerCase();
        logs = logs.filter(l => (l.detail + l.module + l.action).toLowerCase().includes(q));
      }
      if (action) logs = logs.filter(l => l.action === action);
      if (user)   logs = logs.filter(l => l.userId === user);
      return logs;
    },

    _render() {
      const all   = this._getData();
      const start = (this._page - 1) * PAGE_SIZE;
      const logs  = all.slice(start, start + PAGE_SIZE);

      document.getElementById('logs-info').textContent = `${start+1}–${Math.min(start+PAGE_SIZE, all.length)} / ${all.length}`;

      const actionBadge = a => {
        const labels = { LOGIN:'Đăng nhập', LOGOUT:'Đăng xuất', CREATE:'Tạo mới', UPDATE:'Cập nhật',
                         ASSIGN:'Phân công', APPROVE:'Phê duyệt', REJECT:'Từ chối', UPLOAD:'Upload', COMMENT:'Bình luận' };
        const color = { LOGIN:'badge-success', LOGOUT:'badge-neutral', CREATE:'badge-accent',
                        UPDATE:'badge-warning', ASSIGN:'badge-accent', APPROVE:'badge-success',
                        REJECT:'badge-danger', UPLOAD:'badge-neutral', COMMENT:'badge-neutral' };
        return `<span class="fs-badge ${color[a] || 'badge-neutral'}">${labels[a] || a}</span>`;
      };

      document.getElementById('logs-table-body').innerHTML = logs.map(log => {
        const user = FS.db.find('users', log.userId);
        const d    = new Date(log.createdAt);
        return `
          <tr class="hover-row">
            <td style="font-size:11px;color:var(--fs-text-muted);white-space:nowrap">
              ${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
            </td>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${user ? `<div class="fs-avatar fs-avatar-sm ${user.color}">${user.avatar}</div>` : '<div class="fs-avatar fs-avatar-sm av-teal"><i class="bi bi-robot"></i></div>'}
                <span style="font-size:12px">${user?.name || 'System'}</span>
              </div>
            </td>
            <td>${actionBadge(log.action)}</td>
            <td><span class="fs-badge badge-neutral" style="font-size:10px">${log.module}</span></td>
            <td style="font-size:12px;color:var(--fs-text-secondary)">${FS.str.escape(log.detail)}</td>
            <td style="font-size:11px;color:var(--fs-text-muted)">${log.ip || '127.0.0.1'}</td>
          </tr>`;
      }).join('') || '<tr><td colspan="6"><div class="fs-empty"><i class="bi bi-journal"></i><h5>Không tìm thấy log</h5></div></td></tr>';

      // Pagination
      const totalPages = Math.ceil(all.length / PAGE_SIZE);
      const self = this;
      let paginHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        paginHtml += `<button class="btn btn-sm ${i===self._page?'btn-primary':'btn-ghost'} log-page-btn" data-page="${i}">${i}</button>`;
      }
      document.getElementById('logs-pagination').innerHTML = paginHtml;
    },

    _bindEvents() {
      const self = this;

      $('#logs-search').off('input').on('input', function () {
        self._filter.search = this.value; self._page = 1; self._render();
      });
      $('#logs-filter-action').off('change').on('change', function () {
        self._filter.action = this.value; self._page = 1; self._render();
      });
      $('#logs-filter-user').off('change').on('change', function () {
        self._filter.user = this.value; self._page = 1; self._render();
      });
      $('#logs-refresh-btn').off('click').on('click', () => this._render());

      $(document).off('click.log-page').on('click.log-page', '.log-page-btn', function () {
        self._page = parseInt($(this).data('page')); self._render();
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);