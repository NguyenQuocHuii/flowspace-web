/**
 * FlowSpace — Users Page Module (Director only)
 */
(function (FS, $) {
  'use strict';

  FS.pages.users = {
    _filter: { search: '', role: '' },

    init() {
      if (!FS.auth.isDirector()) {
        document.getElementById('users-table-body').innerHTML =
          '<tr><td colspan="7"><div class="fs-empty"><i class="bi bi-shield-lock"></i><h5>Không có quyền truy cập</h5></div></td></tr>';
        return;
      }
      this._render();
      this._bindEvents();
    },

    _getData() {
      let users = FS.db.get('users');
      const { search, role } = this._filter;
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => (u.name + u.email).toLowerCase().includes(q));
      }
      if (role) users = users.filter(u => u.role === role);
      return users;
    },

    _render() {
      const users = this._getData();
      $('#users-count-label').text(`${users.length} người dùng`);

      const tasks   = FS.db.get('tasks');
      const logs    = FS.db.get('time_logs');
      const projects = FS.db.get('projects');

      $('#users-table-body').html(users.map(u => {
        const userTasks    = tasks.filter(t => t.assigneeId === u.id);
        const userLogs     = logs.filter(l => l.userId === u.id);
        const userProjects = [...new Set(userTasks.map(t => t.projectId))];
        const totalHours   = userLogs.reduce((s, l) => s + (l.hours || 0), 0);

        const roleLabels = {
          employee:  '<span class="fs-badge badge-neutral">Nhân viên</span>',
          team_lead: '<span class="fs-badge badge-accent">Trưởng nhóm</span>',
          manager:   '<span class="fs-badge badge-warning">Quản lý</span>',
          director:  '<span class="fs-badge badge-success">Ban GĐ</span>'
        };

        return `
          <tr class="hover-row">
            <td>
              <div class="d-flex align-items-center gap-3">
                <div class="fs-avatar ${u.color}">${u.avatar}</div>
                <div>
                  <div style="font-size:13px;font-weight:600">${FS.str.escape(u.name)}</div>
                  <div class="fs-small">${u.department || '—'}</div>
                </div>
              </div>
            </td>
            <td style="font-size:12px">${u.email}</td>
            <td>${roleLabels[u.role] || u.role}</td>
            <td style="font-size:13px">${userProjects.length}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <span style="font-size:13px">${userTasks.filter(t=>t.status==='done').length}/${userTasks.length}</span>
              </div>
            </td>
            <td style="font-size:13px">${totalHours}h</td>
            <td>
              <button class="btn btn-ghost btn-icon btn-sm" title="Xem chi tiết" onclick="FS.toast('Xem hồ sơ ${FS.str.escape(u.name)}', 'info')">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>`;
      }).join(''));
    },

    _bindEvents() {
      const self = this;
      $('#users-search').off('input').on('input', function () {
        self._filter.search = this.value; self._render();
      });
      $('#users-filter-role').off('change').on('change', function () {
        self._filter.role = this.value; self._render();
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);