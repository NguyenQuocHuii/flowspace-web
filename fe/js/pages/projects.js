/**
 * FlowSpace — Projects Page Module
 * Module 2: Connected to Backend .NET 8 Web API (/api/v1/projects)
 */
(function (FS, $) {
  'use strict';

  FS.pages.projects = {
    _view: 'list',
    _filter: { search: '', status: '', priority: '' },
    _page: 1,
    PAGE_SIZE: 6,
    _projectsData: [],

    async init() {
      // Show create button for managers+
      if (FS.auth.hasLevel(2)) {
        $('#proj-new-btn').show();
      }

      // 1. Instant 0ms SWR render with local seed data (NO SPINNER!)
      this._projectsData = (FS.db.get('projects') || []).map(p => ({
        ...p,
        client: p.client || '',
        budget: p.budget || null,
        taskCount: p.taskCount || 0,
        completedTaskCount: p.completedTaskCount || 0
      }));
      this._render();
      this._bindEvents();

      // 2. Fetch live data from backend API in background & sync seamlessly
      await this._loadData();
    },

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    async _loadData() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/projects',
          type: 'GET'
        });

        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          const apiProjects = response.data.map(p => ({
            id: p.id,
            code: p.code,
            name: p.name,
            description: p.description || '',
            status: (p.status || 'active').toLowerCase(),
            priority: (p.priority || 'medium').toLowerCase(),
            startDate: p.startDate,
            endDate: p.endDate,
            progress: p.progress || 0,
            ownerId: p.ownerId,
            ownerName: p.ownerName || '',
            members: p.members || [],
            createdAt: p.createdAt,
            client: p.client || '',
            budget: p.budget || null,
            taskCount: p.taskCount || 0,
            completedTaskCount: p.completedTaskCount || 0
          }));

          const mergedMap = new Map();
          const seedData = FS.db.get('projects') || [];
          for (const s of seedData) mergedMap.set(s.id, s);
          for (const a of apiProjects) mergedMap.set(a.id, a);

          this._projectsData = Array.from(mergedMap.values());
          $('#projects-offline-banner').remove();
        } else if (!this._projectsData.length) {
          this._projectsData = FS.db.get('projects') || [];
        }
      } catch (err) {
        console.warn('Projects API request failed:', err);
        if (!this._projectsData.length) {
          this._projectsData = FS.db.get('projects') || [];
        }
      } finally {
        this._render();
      }
    },

    _getFilteredData() {
      let projects = [...this._projectsData];
      const { search, status, priority } = this._filter;
      if (search) {
        const q = search.toLowerCase();
        projects = projects.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      }
      if (status) projects = projects.filter(p => p.status.toLowerCase() === status.toLowerCase());
      if (priority) projects = projects.filter(p => p.priority.toLowerCase() === priority.toLowerCase());
      return projects;
    },

    _render() {
      const allFiltered = this._getFilteredData();
      const total = allFiltered.length;
      const totalPages = Math.ceil(total / this.PAGE_SIZE) || 1;
      if (this._page > totalPages) this._page = totalPages;
      if (this._page < 1) this._page = 1;

      const pagedProjects = allFiltered.slice((this._page - 1) * this.PAGE_SIZE, this._page * this.PAGE_SIZE);

      if (this._view === 'list') {
        $('#proj-list-view').show();
        $('#proj-card-view').hide();
        this._renderTable(pagedProjects, total);
      } else {
        $('#proj-list-view').hide();
        $('#proj-card-view').show();
        this._renderCards(pagedProjects, total);
      }
      this._renderPagination(total, totalPages);
    },

    _renderPagination(total, totalPages) {
      const $ul = $('#proj-pagination-ul');
      const $info = $('#proj-pagination-info');

      if (total === 0) {
        $info.text('Hiển thị 0 trong 0 dự án');
        $ul.html('');
        return;
      }

      const start = (this._page - 1) * this.PAGE_SIZE + 1;
      const end = Math.min(this._page * this.PAGE_SIZE, total);
      $info.text(`Hiển thị ${start}-${end} trong ${total} dự án`);

      let html = '';

      // Nút quay lại bị vô hiệu hóa khi ở trang 1
      if (this._page === 1) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">&laquo; Trước</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link proj-page-link" data-page="${this._page - 1}" href="#">&laquo; Trước</a></li>`;
      }

      // Danh sách các trang
      for (let p = 1; p <= totalPages; p++) {
        if (p === this._page) {
          html += `<li class="page-item active" aria-current="page"><span class="page-link">${p}</span></li>`;
        } else {
          html += `<li class="page-item"><a class="page-link proj-page-link" data-page="${p}" href="#">${p}</a></li>`;
        }
      }

      // Nút trang tiếp theo
      if (this._page === totalPages) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">Sau &raquo;</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link proj-page-link" data-page="${this._page + 1}" href="#">Sau &raquo;</a></li>`;
      }

      $ul.html(html);
    },

    _renderTable(projects, total) {
      $('#proj-count-label').text(`${total} dự án`);

      if (!projects.length) {
        $('#proj-table-body').html('<tr><td colspan="8"><div class="fs-empty"><i class="bi bi-folder2"></i><h5>Không tìm thấy dự án</h5><p>Thử thay đổi bộ lọc hoặc tạo dự án mới</p></div></td></tr>');
        return;
      }

      $('#proj-table-body').html(projects.map(p => {
        const membersHtml = (p.members || []).slice(0, 4).map(m => {
          let userId = typeof m === 'object' ? (m.id || m.userId) : m;
          let name = typeof m === 'object' ? m.name : '';

          if (userId && FS.user && FS.user.get) {
            const u = FS.user.get(userId);
            if (u) {
              if (!name) name = u.name;
            }
          }

          if (FS.user && FS.user.avatar) {
            return FS.user.avatar(userId, 'sm', name || 'Thành viên');
          }

          let initials = 'TV';
          if (name) {
            const parts = name.trim().split(/\s+/);
            initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
          }

          return `<div class="fs-avatar fs-avatar-sm" title="${FS.str.escape(name || 'Thành viên')}" style="margin-left:-6px;border:2px solid var(--fs-bg);background-color:#6366f1;color:#ffffff;font-size:11px;font-weight:600">${initials}</div>`;
        }).join('');

        const overdue = FS.date.isOverdue(p.endDate) && p.status !== 'done';

        return `
          <tr class="hover-row" data-proj-id="${p.id}">
            <td style="white-space:nowrap"><span class="fs-badge badge-neutral" style="font-family:monospace;font-weight:600;font-size:11px">${FS.str.escape(p.code)}</span></td>
            <td>
              <div style="font-weight:500;font-size:13px">${FS.str.escape(p.name)}</div>
              <div class="fs-small truncate" style="max-width:260px">${FS.str.escape(p.description || '')}</div>
            </td>
            <td>${FS.badge.status(p.status)}</td>
            <td>${FS.badge.priority(p.priority)}</td>
            <td style="min-width:120px">
              <div class="d-flex align-items-center gap-2">
                <div class="fs-progress" style="flex:1"><div class="fs-progress-bar" style="width:${p.progress}%"></div></div>
                <span style="font-size:11px;font-weight:600;color:var(--fs-accent);min-width:30px">${p.progress}%</span>
              </div>
            </td>
            <td>
              <div class="d-flex" style="padding-left:6px">${membersHtml}</div>
            </td>
            <td style="font-size:12px;${overdue ? 'color:var(--fs-danger);font-weight:600' : 'color:var(--fs-text-muted)'}">
              ${FS.date.format(p.endDate)}
            </td>
            <td>
              <div class="d-flex gap-1">
                <button class="btn btn-ghost btn-icon btn-sm proj-view-btn" data-proj-id="${p.id}" title="Xem chi tiết"><i class="bi bi-eye"></i></button>
                ${FS.auth.hasLevel(2) ? `<button class="btn btn-ghost btn-icon btn-sm proj-edit-btn" data-proj-id="${p.id}" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>` : ''}
              </div>
            </td>
          </tr>`;
      }).join(''));
    },

    _renderCards() {
      const projects = this._getFilteredData();
      $('#proj-count-label').text(`${projects.length} dự án`);

      if (!projects.length) {
        $('#proj-card-grid').html('<div class="col-12"><div class="fs-empty"><i class="bi bi-folder2"></i><h5>Không tìm thấy dự án</h5></div></div>');
        return;
      }

      $('#proj-card-grid').html(projects.map(p => {
        const membersHtml = (p.members || []).slice(0, 5).map(m => {
          let userId = typeof m === 'object' ? (m.id || m.userId) : m;
          let name = typeof m === 'object' ? m.name : '';

          if (userId && FS.user && FS.user.get) {
            const u = FS.user.get(userId);
            if (u) {
              if (!name) name = u.name;
            }
          }

          if (FS.user && FS.user.avatar) {
            return FS.user.avatar(userId, 'sm', name || 'Thành viên');
          }

          let initials = 'TV';
          if (name) {
            const parts = name.trim().split(/\s+/);
            initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
          }

          return `<div class="fs-avatar fs-avatar-sm" title="${FS.str.escape(name || 'Thành viên')}" style="margin-left:-6px;border:2px solid var(--fs-bg);background-color:#6366f1;color:#ffffff;font-size:11px;font-weight:600">${initials}</div>`;
        }).join('');

        const overdue = FS.date.isOverdue(p.endDate) && p.status !== 'done';
        const done = p.completedTaskCount || 0;
        const totalTasks = p.taskCount || 0;

        const colorMap = { active: 'var(--fs-accent)', on_hold: 'var(--fs-warning)', done: 'var(--fs-success)' };
        const accentColor = colorMap[p.status] || 'var(--fs-accent)';

        return `
          <div class="col-12 col-md-6 col-xl-4 mb-3">
            <div class="fs-card proj-view-btn" data-proj-id="${p.id}" style="cursor:pointer;height:100%;border-radius:var(--fs-radius-md)">
              <!-- Top stripe -->
              <div style="height:4px;background:${accentColor};margin:-16px -16px 14px;border-radius:var(--fs-radius-md) var(--fs-radius-md) 0 0"></div>
              <div class="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <div class="fs-small" style="color:var(--fs-accent);margin-bottom:3px;font-weight:600">${p.code}</div>
                  <h6 style="font-weight:600;font-size:14px;margin:0;line-height:1.3">${FS.str.escape(p.name)}</h6>
                </div>
                ${FS.badge.status(p.status)}
              </div>
              <p class="fs-small truncate mb-3" style="max-height:36px;overflow:hidden;line-height:1.5;color:var(--fs-text-secondary)">${FS.str.escape(p.description || '')}</p>

              <!-- Progress -->
              <div class="d-flex align-items-center gap-2 mb-3">
                <div class="fs-progress" style="flex:1"><div class="fs-progress-bar" style="width:${p.progress}%;background:${accentColor}"></div></div>
                <span style="font-size:11px;font-weight:700;color:${accentColor}">${p.progress}%</span>
              </div>

              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex" style="padding-left:6px">${membersHtml}</div>
                <div class="text-end">
                  <div class="fs-small" style="font-weight:600">${done}/${totalTasks} tasks</div>
                  <div style="font-size:11px;${overdue?'color:var(--fs-danger);font-weight:600':'color:var(--fs-text-muted)'}">${FS.date.format(p.endDate)}</div>
                </div>
              </div>
            </div>
          </div>`;
      }).join(''));
    },



    _openModal(projectId = null) {
      if (projectId) {
        const p = this._projectsData.find(x => x.id === projectId) || FS.db.find('projects', projectId);
        if (!p) return;
        $('#proj-modal-title').text('Chỉnh sửa dự án');
        $('#proj-modal-id').val(p.id);
        $('#proj-modal-name').val(p.name);
        $('#proj-modal-code').val(p.code);
        $('#proj-modal-desc').val(p.description || '');
        $('#proj-modal-status').val(p.status.toLowerCase());
        $('#proj-modal-priority').val(p.priority.toLowerCase());
        $('#proj-modal-start').val(FS.date.toInput(p.startDate));
        $('#proj-modal-end').val(FS.date.toInput(p.endDate));
        $('#proj-modal-client').val(p.client || '');
        $('#proj-modal-budget').val(p.budget || '');
      } else {
        $('#proj-modal-title').text('Tạo dự án mới');
        $('#proj-modal-id').val('');
        $('#proj-modal-name').val('');
        $('#proj-modal-code').val('FS-' + String(this._projectsData.length + 1).padStart(3, '0'));
        $('#proj-modal-desc').val('');
        $('#proj-modal-status').val('active');
        $('#proj-modal-priority').val('medium');
        $('#proj-modal-start').val(FS.date.toInput(new Date().toISOString()));
        $('#proj-modal-end').val('');
        $('#proj-modal-client').val('');
        $('#proj-modal-budget').val('');
      }
      $('#proj-modal-overlay').show();
    },

    async _saveModal() {
      const name = $('#proj-modal-name').val().trim();
      if (!name) { FS.toast('Vui lòng nhập tên dự án!', 'warning'); return; }

      const id = $('#proj-modal-id').val();
      const isNew = !id;

      const payload = {
        code: $('#proj-modal-code').val() || 'FS-000',
        name: name,
        description: $('#proj-modal-desc').val() || '',
        status: $('#proj-modal-status').val() || 'active',
        priority: $('#proj-modal-priority').val() || 'medium',
        startDate: $('#proj-modal-start').val() ? new Date($('#proj-modal-start').val()).toISOString() : null,
        endDate: $('#proj-modal-end').val() ? new Date($('#proj-modal-end').val()).toISOString() : null,
        progress: isNew ? 0 : (this._projectsData.find(p => p.id === id)?.progress || 0),
        client: $('#proj-modal-client').val().trim() || '',
        budget: $('#proj-modal-budget').val() ? parseFloat($('#proj-modal-budget').val()) : null
      };

      try {
        let response;
        if (isNew) {
          response = await FS.apiCall({
            url: FS.API_BASE + '/api/v1/projects',
            type: 'POST',
            data: payload
          });
        } else {
          response = await FS.apiCall({
            url: FS.API_BASE + '/api/v1/projects/' + id,
            type: 'PUT',
            data: payload
          });
        }

        if (response && response.success) {
          FS.toast(isNew ? 'Tạo dự án thành công!' : 'Cập nhật thành công!', 'success');
          $('#proj-modal-overlay').hide();
          await this._loadData();
          if (FS.syncSidebarProjects) FS.syncSidebarProjects();
          return;
        } else {
          FS.toast('Máy chủ phản hồi lỗi khi lưu dự án.', 'error');
        }
      } catch (err) {
        console.error('API save project failed:', err);
        FS.toast('Không thể lưu dự án lên máy chủ. Vui lòng thử lại!', 'error');
      }
    },

    _bindEvents() {
      const self = this;

      // Pagination links
      $(document).off('click.proj-page').on('click.proj-page', '.proj-page-link', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'), 10);
        if (p && p !== self._page) {
          self._page = p;
          self._render();
        }
      });

      // View toggle
      $(document).off('click.proj-toggle').on('click.proj-toggle', '.view-toggle', function () {
        $('.view-toggle').removeClass('active').css({ background: '', color: '' });
        $(this).addClass('active');
        self._view = $(this).data('view');
        self._render();
      });

      // Filters
      $('#proj-search').off('input').on('input', function () {
        self._filter.search = this.value;
        self._render();
      });
      $('#proj-filter-status').off('change').on('change', function () {
        self._filter.status = this.value;
        self._render();
      });
      $('#proj-filter-priority').off('change').on('change', function () {
        self._filter.priority = this.value;
        self._render();
      });
      $('#proj-filter-reset').off('click').on('click', function () {
        self._filter = { search: '', status: '', priority: '' };
        $('#proj-search').val('');
        $('#proj-filter-status').val('');
        $('#proj-filter-priority').val('');
        self._render();
      });

      // Open detail
      $(document).off('click.proj-view').on('click.proj-view', '.proj-view-btn', function (e) {
        e.stopPropagation();
        FS.projectDetail.open($(this).data('proj-id'));
      });
      $(document).off('click.proj-row').on('click.proj-row', '#proj-table-body tr', function () {
        FS.projectDetail.open($(this).data('proj-id'));
      });

      // Edit button
      $(document).off('click.proj-edit').on('click.proj-edit', '.proj-edit-btn', function (e) {
        e.stopPropagation();
        self._openModal($(this).data('proj-id'));
      });

      // New project
      $('#proj-new-btn').off('click').on('click', function () {
        self._openModal();
      });

      // Modal
      $('#proj-modal-close, #proj-modal-cancel').off('click').on('click', () => $('#proj-modal-overlay').hide());
      $('#proj-modal-overlay').off('click').on('click', function (e) {
        if ($(e.target).is('#proj-modal-overlay')) $('#proj-modal-overlay').hide();
      });
      $('#proj-modal-save').off('click').on('click', () => self._saveModal());
    }
  };

})(window.FS = window.FS || {}, jQuery);
