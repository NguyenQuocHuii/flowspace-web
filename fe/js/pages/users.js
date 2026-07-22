(function (FS, $) {
  'use strict';

  FS.pages.users = {
    _filter: { search: '', role: '' },
    _usersCache: null,
    _tasksData: [],
    _projectsData: [],
    _logsData: [],

    async init() {
      if (!FS.auth.isManager() && !FS.auth.isDirector()) {
        document.getElementById('users-table-body').innerHTML =
          '<tr><td colspan="7"><div class="fs-empty"><i class="bi bi-shield-lock"></i><h5>Không có quyền truy cập</h5><p>Tính năng này dành cho Quản lý / Ban Giám Đốc.</p></div></td></tr>';
        return;
      }
      this._usersCache = FS.db.get('users') || [];
      this._tasksData = FS.db.get('tasks') || [];
      this._projectsData = FS.db.get('projects') || [];
      this._logsData = FS.db.get('time_logs') || [];
      this._render();
      this._bindEvents();

      await this._loadUsers();
      this._render();
    },

    async _loadUsers() {
      try {
        const [usersRes, tasksRes, projsRes, logsRes] = await Promise.all([
          FS.apiCall({ url: FS.API_BASE + '/api/v1/users?pageSize=100', type: 'GET' }),
          FS.apiCall({ url: FS.API_BASE + '/api/v1/tasks', type: 'GET' }),
          FS.apiCall({ url: FS.API_BASE + '/api/v1/projects', type: 'GET' }),
          FS.apiCall({ url: FS.API_BASE + '/api/v1/timetracking/logs', type: 'GET' })
        ]);

        if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
          this._usersCache = usersRes.data.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role || 'employee').toLowerCase(),
            department: u.department || '',
            avatar: u.avatar || (u.name ? u.name.substring(0,2).toUpperCase() : '??'),
            color: u.color || 'av-indigo',
            isActive: u.isActive !== false
          }));
          $('#users-offline-banner').remove();
        } else {
          this._usersCache = FS.db.get('users') || [];
        }

        this._tasksData = (tasksRes && tasksRes.success && Array.isArray(tasksRes.data)) ? tasksRes.data : (FS.db.get('tasks') || []);
        this._projectsData = (projsRes && projsRes.success && Array.isArray(projsRes.data)) ? projsRes.data : (FS.db.get('projects') || []);
        this._logsData = (logsRes && logsRes.success && Array.isArray(logsRes.data)) ? logsRes.data : (FS.db.get('time_logs') || []);

      } catch (err) {
        console.warn('Users API failed:', err);
        this._usersCache = FS.db.get('users') || [];
        this._tasksData = FS.db.get('tasks') || [];
        this._projectsData = FS.db.get('projects') || [];
        this._logsData = FS.db.get('time_logs') || [];
      }
    },

    _getData() {
      const users = this._usersCache || [];
      const { search, role } = this._filter;
      let filtered = users;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(u => ((u.name || '') + (u.email || '')).toLowerCase().includes(q));
      }
      if (role) filtered = filtered.filter(u => u.role === role);
      return filtered;
    },

    _render() {
      const users = this._getData();
      $('#users-count-label').text(`${users.length} người dùng`);

      const tasks = this._tasksData || [];
      const logs = this._logsData || [];

      if (!users.length) {
        $('#users-table-body').html('<tr><td colspan="7"><div class="fs-empty"><i class="bi bi-people"></i><p>Không tìm thấy người dùng nào</p></div></td></tr>');
        return;
      }

      $('#users-table-body').html(users.map(u => {
        const userTasks = tasks.filter(t => t.assigneeId === u.id);
        const userLogs = logs.filter(l => l.userId === u.id);
        const userProjects = [...new Set(userTasks.map(t => t.projectId).filter(Boolean))];
        const totalHours = Math.round(userLogs.reduce((s, l) => s + (l.hours || 0), 0) * 10) / 10;
        const roleLabels = {
          employee: '<span class="fs-badge badge-neutral">Nhân viên</span>',
          team_lead: '<span class="fs-badge badge-accent">Trưởng nhóm</span>',
          manager: '<span class="fs-badge badge-warning">Trưởng phòng</span>',
          director: '<span class="fs-badge badge-success">Ban giám đốc</span>'
        };
        return `
          <tr class="hover-row">
            <td>
              <div class="d-flex align-items-center gap-3">
                <div class="fs-avatar ${u.color || 'av-indigo'}">${FS.str.escape(u.avatar || '?')}</div>
                <div>
                  <div style="font-size:13px;font-weight:600">${FS.str.escape(u.name || '—')}</div>
                  ${(u.department || u.position) ? `<div class="fs-small">${FS.str.escape(u.department || u.position)}</div>` : ''}
                </div>
              </div>
            </td>
            <td style="font-size:12px">${FS.str.escape(u.email || '—')}</td>
            <td>${roleLabels[u.role] || '<span class="fs-badge badge-neutral">' + FS.str.escape(u.role) + '</span>'}</td>
            <td style="font-size:13px">${userProjects.length}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <span style="font-size:13px">${userTasks.filter(t => (t.status||'').toLowerCase() === 'done').length}/${userTasks.length}</span>
              </div>
            </td>
            <td style="font-size:13px">${totalHours}h</td>
            <td>
              <button class="btn btn-ghost btn-icon btn-sm" title="Xem chi tiết" onclick="FS.toast('Hồ sơ thành viên: ${FS.str.escape(u.name)}', 'info')">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>`;
      }).join(''));
    },
    _bindEvents() {
      const self = this;
      $('#users-search').off('input').on('input', function () { self._filter.search = this.value; self._render(); });
      $('#users-filter-role').off('change').on('change', function () { self._filter.role = this.value; self._render(); });
    }
  };
})(window.FS = window.FS || {}, jQuery);