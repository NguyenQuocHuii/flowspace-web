/**
 * FlowSpace — Projects Page Module
 */
(function (FS, $) {
  'use strict';

  FS.pages.projects = {
    _view: 'list',
    _filter: { search: '', status: '', priority: '' },

    init() {
      // Show create button for managers+
      if (FS.auth.hasLevel(2)) {
        $('#proj-new-btn').show();
      }
      this._render();
      this._bindEvents();
    },

    _getData() {
      let projects = FS.db.get('projects');
      const { search, status, priority } = this._filter;
      if (search) {
        const q = search.toLowerCase();
        projects = projects.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      if (status) projects = projects.filter(p => p.status === status);
      if (priority) projects = projects.filter(p => p.priority === priority);
      return projects;
    },

    _renderTable() {
      const projects = this._getData();
      $('#proj-count-label').text(`${projects.length} dự án`);

      if (!projects.length) {
        $('#proj-table-body').html('<tr><td colspan="8"><div class="fs-empty"><i class="bi bi-folder2"></i><h5>Không tìm thấy dự án</h5><p>Thử thay đổi bộ lọc hoặc tạo dự án mới</p></div></td></tr>');
        return;
      }

      $('#proj-table-body').html(projects.map((p, idx) => {
        const members = (p.members || []).slice(0, 3).map(id => {
          const u = FS.db.find('users', id);
          return u ? `<div class="fs-avatar fs-avatar-sm ${u.color}" title="${u.name}" style="margin-left:-6px;border:2px solid #fff">${u.avatar}</div>` : '';
        }).join('');
        const overdue = FS.date.isOverdue(p.endDate) && p.status !== 'done';

        return `
          <tr class="hover-row" data-proj-id="${p.id}">
            <td style="color:var(--fs-text-muted);font-size:12px">${p.code}</td>
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
              <div class="d-flex" style="padding-left:6px">${members}</div>
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
      const projects = this._getData();
      $('#proj-count-label').text(`${projects.length} dự án`);

      if (!projects.length) {
        $('#proj-card-grid').html('<div class="col-12"><div class="fs-empty"><i class="bi bi-folder2"></i><h5>Không tìm thấy dự án</h5></div></div>');
        return;
      }

      $('#proj-card-grid').html(projects.map(p => {
        const members = (p.members || []).slice(0, 4).map(id => {
          const u = FS.db.find('users', id);
          return u ? `<div class="fs-avatar fs-avatar-sm ${u.color}" title="${u.name}" style="margin-left:-8px;border:2px solid #fff">${u.avatar}</div>` : '';
        }).join('');
        const overdue = FS.date.isOverdue(p.endDate) && p.status !== 'done';
        const tasks   = FS.db.get('tasks').filter(t => t.projectId === p.id);
        const done    = tasks.filter(t => t.status === 'done').length;

        const colorMap = { active: 'var(--fs-accent)', on_hold: 'var(--fs-warning)', done: 'var(--fs-success)' };
        const accentColor = colorMap[p.status] || 'var(--fs-accent)';

        return `
          <div class="col-12 col-md-6 col-xl-4">
            <div class="fs-card proj-view-btn" data-proj-id="${p.id}" style="cursor:pointer;height:100%">
              <!-- Top stripe -->
              <div style="height:4px;background:${accentColor};margin:-20px -20px 16px;border-radius:var(--fs-radius-lg) var(--fs-radius-lg) 0 0"></div>
              <div class="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <div class="fs-small" style="color:var(--fs-accent);margin-bottom:3px">${p.code}</div>
                  <h6 style="font-weight:600;font-size:14px;margin:0;line-height:1.3">${FS.str.escape(p.name)}</h6>
                </div>
                ${FS.badge.status(p.status)}
              </div>
              <p class="fs-small truncate mb-3" style="max-height:36px;overflow:hidden;line-height:1.5">${FS.str.escape(p.description || '')}</p>

              <!-- Progress -->
              <div class="d-flex align-items-center gap-2 mb-3">
                <div class="fs-progress" style="flex:1"><div class="fs-progress-bar" style="width:${p.progress}%;background:${accentColor}"></div></div>
                <span style="font-size:11px;font-weight:700;color:${accentColor}">${p.progress}%</span>
              </div>

              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex" style="padding-left:8px">${members}</div>
                <div class="text-end">
                  <div class="fs-small">${done}/${tasks.length} tasks</div>
                  <div style="font-size:11px;${overdue?'color:var(--fs-danger);font-weight:600':'color:var(--fs-text-muted)'}">${FS.date.format(p.endDate)}</div>
                </div>
              </div>
            </div>
          </div>`;
      }).join(''));
    },

    _render() {
      if (this._view === 'list') {
        $('#proj-list-view').show();
        $('#proj-card-view').hide();
        this._renderTable();
      } else {
        $('#proj-list-view').hide();
        $('#proj-card-view').show();
        this._renderCards();
      }
    },

    _openModal(projectId = null) {
      if (projectId) {
        const p = FS.db.find('projects', projectId);
        if (!p) return;
        $('#proj-modal-title').text('Chỉnh sửa dự án');
        $('#proj-modal-id').val(p.id);
        $('#proj-modal-name').val(p.name);
        $('#proj-modal-code').val(p.code);
        $('#proj-modal-desc').val(p.description);
        $('#proj-modal-status').val(p.status);
        $('#proj-modal-priority').val(p.priority);
        $('#proj-modal-start').val(FS.date.toInput(p.startDate));
        $('#proj-modal-end').val(FS.date.toInput(p.endDate));
      } else {
        $('#proj-modal-title').text('Tạo dự án mới');
        $('#proj-modal-id').val('');
        $('#proj-modal-name').val('');
        $('#proj-modal-code').val('FS-' + String(FS.db.get('projects').length + 1).padStart(3, '0'));
        $('#proj-modal-desc').val('');
        $('#proj-modal-status').val('active');
        $('#proj-modal-priority').val('medium');
        $('#proj-modal-start').val(FS.date.toInput(new Date().toISOString()));
        $('#proj-modal-end').val('');
      }
      $('#proj-modal-overlay').show();
    },

    _saveModal() {
      const name = $('#proj-modal-name').val().trim();
      if (!name) { FS.toast('Vui lòng nhập tên dự án!', 'warning'); return; }

      const id = $('#proj-modal-id').val();
      const isNew = !id;

      {
        const project = {
          id: id || FS.db.newId(),
          code:        $('#proj-modal-code').val() || 'FS-000',
          name,
          description: $('#proj-modal-desc').val(),
          status:      $('#proj-modal-status').val(),
          priority:    $('#proj-modal-priority').val(),
          startDate:   $('#proj-modal-start').val() ? new Date($('#proj-modal-start').val()).toISOString() : null,
          endDate:     $('#proj-modal-end').val() ? new Date($('#proj-modal-end').val()).toISOString() : null,
          progress:    isNew ? 0 : (FS.db.find('projects', id)?.progress || 0),
          ownerId:     isNew ? FS.auth.getSession()?.userId : FS.db.find('projects', id)?.ownerId,
          members:     isNew ? [FS.auth.getSession()?.userId] : FS.db.find('projects', id)?.members,
          tags:        isNew ? [] : FS.db.find('projects', id)?.tags,
          createdAt:   isNew ? new Date().toISOString() : FS.db.find('projects', id)?.createdAt
        };
        FS.db.save('projects', project);
        FS.auth._appendLog && FS.auth._appendLog(FS.auth.getSession()?.userId, isNew ? 'CREATE' : 'UPDATE', 'Project', `${isNew?'Tạo':'Cập nhật'} dự án ${name}`);
        $('#proj-modal-overlay').hide();
        this._render();
        FS.toast(isNew ? 'Tạo dự án thành công!' : 'Cập nhật thành công!', 'success');
      }
    },

    _bindEvents() {
      const self = this;

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
      $(document).on('click.proj-row', '#proj-table-body tr', function () {
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
