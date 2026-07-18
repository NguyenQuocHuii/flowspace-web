/**
 * FlowSpace — Tasks Page Module
 */
(function (FS, $) {
  'use strict';

  const PAGE_SIZE = 10;

  FS.pages.tasks = {
    _filter: { search: '', status: '', priority: '', project: '', assignee: '' },
    _page: 1,

    init() {
      this._populateFilters();
      this._render();
      this._bindEvents();
    },

    _populateFilters() {
      // Projects dropdown
      const projects = FS.db.get('projects');
      const $projSel = $('#task-filter-project, #task-modal-project');
      const projOpts = projects.map(p => `<option value="${p.id}">${FS.str.escape(p.name)}</option>`).join('');
      $('#task-filter-project').html('<option value="">Tất cả dự án</option>').append(projOpts);
      $('#task-modal-project').html('<option value="">-- Chọn dự án --</option>' + projOpts);

      // Users dropdown
      const users = FS.db.get('users');
      const userOpts = users.map(u => `<option value="${u.id}">${FS.str.escape(u.name)}</option>`).join('');
      $('#task-filter-assignee').html('<option value="">Tất cả người thực hiện</option>').append(userOpts);
      $('#task-modal-assignee').html('<option value="">-- Chọn người thực hiện --</option>' + userOpts);
    },

    _getData() {
      let tasks = FS.db.get('tasks');
      const session = FS.auth.getSession();
      const { search, status, priority, project, assignee } = this._filter;

      if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t => (t.title + t.code + (t.description||'')).toLowerCase().includes(q));
      }
      if (status)   tasks = tasks.filter(t => t.status === status);
      if (priority) tasks = tasks.filter(t => t.priority === priority);
      if (project)  tasks = tasks.filter(t => t.projectId === project);
      if (assignee) tasks = tasks.filter(t => t.assigneeId === assignee);

      return tasks;
    },

    _render() {
      const all   = this._getData();
      const total = all.length;
      const start = (this._page - 1) * PAGE_SIZE;
      const tasks = all.slice(start, start + PAGE_SIZE);

      $('#tasks-count-label').text(`${total} công việc`);

      if (!tasks.length) {
        $('#tasks-table-body').html('<tr><td colspan="8"><div class="fs-empty"><i class="bi bi-check-square"></i><h5>Không tìm thấy công việc</h5><p>Thử thay đổi bộ lọc hoặc tạo công việc mới</p></div></td></tr>');
        $('#tasks-pagination-info').text('');
        $('#tasks-pagination-btns').html('');
        return;
      }

      $('#tasks-table-body').html(tasks.map(t => {
        const project  = FS.db.find('projects', t.projectId);
        const overdue  = FS.date.isOverdue(t.dueDate) && t.status !== 'done';
        const isDone   = t.status === 'done';

        return `
          <tr class="hover-row task-row" data-task-id="${t.id}">
            <td>
              <button class="btn btn-ghost btn-icon btn-sm task-done-toggle" data-task-id="${t.id}" title="${isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}" style="color:${isDone ? 'var(--fs-success)' : 'var(--fs-border)'}">
                <i class="bi bi-${isDone ? 'check-circle-fill' : 'circle'}" style="font-size:16px"></i>
              </button>
            </td>
            <td>
              <div style="font-size:13px;font-weight:500;${isDone ? 'text-decoration:line-through;color:var(--fs-text-muted)' : ''}">${FS.str.escape(t.title)}</div>
              <div class="fs-small">${t.code} ${t.tags?.length ? '· ' + t.tags.slice(0,2).map(tag=>'#'+tag).join(' ') : ''}</div>
            </td>
            <td style="font-size:12px;color:var(--fs-text-secondary)">${project ? project.name : '—'}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${FS.user.avatar(t.assigneeId, 'fs-avatar-sm')}
                <span style="font-size:12px">${FS.user.name(t.assigneeId).split(' ').pop()}</span>
              </div>
            </td>
            <td>${FS.badge.priority(t.priority)}</td>
            <td>${FS.badge.status(t.status)}</td>
            <td style="font-size:12px;${overdue ? 'color:var(--fs-danger);font-weight:600' : 'color:var(--fs-text-muted)'}">
              ${overdue ? '<i class="bi bi-exclamation-triangle-fill me-1"></i>' : ''}${FS.date.format(t.dueDate)}
            </td>
            <td>
              <button class="btn btn-ghost btn-icon btn-sm task-edit-btn" data-task-id="${t.id}" title="Chỉnh sửa" onclick="event.stopPropagation()">
                <i class="bi bi-pencil"></i>
              </button>
            </td>
          </tr>`;
      }).join(''));

      // Pagination
      const totalPages = Math.ceil(total / PAGE_SIZE);
      $('#tasks-pagination-info').text(`Hiển thị ${start+1}–${Math.min(start+PAGE_SIZE, total)} / ${total}`);

      if (totalPages <= 1) {
        $('#tasks-pagination-btns').html('');
        return;
      }
      const self = this;
      let paginHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        paginHtml += `<button class="btn btn-sm ${i === self._page ? 'btn-primary' : 'btn-ghost'} page-btn" data-page="${i}">${i}</button>`;
      }
      $('#tasks-pagination-btns').html(paginHtml);
    },

    _openModal(taskId = null) {
      const projects = FS.db.get('projects');
      const users    = FS.db.get('users');
      const projOpts = projects.map(p => `<option value="${p.id}">${FS.str.escape(p.name)}</option>`).join('');
      const userOpts = users.map(u => `<option value="${u.id}">${FS.str.escape(u.name)}</option>`).join('');
      $('#task-modal-project').html('<option value="">-- Chọn dự án --</option>' + projOpts);
      $('#task-modal-assignee').html('<option value="">-- Chọn người thực hiện --</option>' + userOpts);

      if (taskId) {
        const t = FS.db.find('tasks', taskId);
        if (!t) return;
        $('#task-modal-title').text('Chỉnh sửa công việc');
        $('#task-modal-id').val(t.id);
        $('#task-modal-name').val(t.title);
        $('#task-modal-desc').val(t.description);
        $('#task-modal-project').val(t.projectId);
        $('#task-modal-assignee').val(t.assigneeId);
        $('#task-modal-priority').val(t.priority);
        $('#task-modal-status').val(t.status);
        $('#task-modal-start').val(FS.date.toInput(t.startDate));
        $('#task-modal-due').val(FS.date.toInput(t.dueDate));
        $('#task-modal-est').val(t.estimatedHours || '');
      } else {
        $('#task-modal-title').text('Tạo công việc mới');
        $('#task-modal-id').val('');
        $('#task-modal-name, #task-modal-desc').val('');
        $('#task-modal-priority').val('medium');
        $('#task-modal-status').val('todo');
        $('#task-modal-start').val(FS.date.toInput(new Date().toISOString()));
        $('#task-modal-due, #task-modal-est').val('');
        // Default assignee = current user
        const session = FS.auth.getSession();
        if (session) $('#task-modal-assignee').val(session.userId);
      }
      $('#task-modal-overlay').show();
    },

    _saveModal() {
      const title = $('#task-modal-name').val().trim();
      if (!title) { FS.toast('Vui lòng nhập tiêu đề!', 'warning'); return; }

      const projectId = $('#task-modal-project').val();
      if (!projectId) { FS.toast('Vui lòng chọn dự án!', 'warning'); return; }

      const id = $('#task-modal-id').val();
      const isNew = !id;

      const rawPriority = $('#task-modal-priority').val();
      const priority = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1);

      void priority;

      {
        const tasks   = FS.db.get('tasks');
        const newCode = 'T-' + String(tasks.length + 1).padStart(3, '0');
        const task = {
          id: id || FS.db.newId(),
          code:          isNew ? newCode : FS.db.find('tasks', id).code,
          title,
          description:   $('#task-modal-desc').val(),
          projectId:     $('#task-modal-project').val(),
          assigneeId:    $('#task-modal-assignee').val(),
          priority:      $('#task-modal-priority').val(),
          status:        $('#task-modal-status').val(),
          startDate:     $('#task-modal-start').val() ? new Date($('#task-modal-start').val()).toISOString() : null,
          dueDate:       $('#task-modal-due').val() ? new Date($('#task-modal-due').val()).toISOString() : null,
          estimatedHours: parseInt($('#task-modal-est').val()) || 0,
          loggedHours:   isNew ? 0 : FS.db.find('tasks', id).loggedHours,
          subtasks:      isNew ? [] : FS.db.find('tasks', id).subtasks,
          comments:      isNew ? [] : FS.db.find('tasks', id).comments,
          tags:          isNew ? [] : FS.db.find('tasks', id).tags,
          createdBy:     isNew ? FS.auth.getSession()?.userId : FS.db.find('tasks', id).createdBy,
          createdAt:     isNew ? new Date().toISOString() : FS.db.find('tasks', id).createdAt
        };
        FS.db.save('tasks', task);
        $('#task-modal-overlay').hide();
        this._render();
        FS.toast(isNew ? 'Tạo công việc thành công!' : 'Cập nhật thành công!', 'success');
      }
    },

    _bindEvents() {
      const self = this;

      // Search
      $('#task-search').off('input').on('input', function () {
        self._filter.search = this.value; self._page = 1; self._render();
      });
      // Filter selects
      $('#task-filter-status, #task-filter-priority, #task-filter-project, #task-filter-assignee').off('change').on('change', function () {
        const key = this.id.replace('task-filter-', '').replace('-', '_');
        // Map id names to filter keys
        const keyMap = {
          'status': 'status', 'priority': 'priority', 'project': 'project', 'assignee': 'assignee'
        };
        self._filter[keyMap[this.id.replace('task-filter-', '')] || ''] = this.value;
        self._page = 1;
        self._render();
      });
      // Reset
      $('#task-filter-reset').off('click').on('click', function () {
        self._filter = { search: '', status: '', priority: '', project: '', assignee: '' };
        $('#task-search').val('');
        $('#task-filter-status, #task-filter-priority, #task-filter-project, #task-filter-assignee').val('');
        self._page = 1; self._render();
      });

      // Pagination
      $(document).off('click.task-page').on('click.task-page', '.page-btn', function () {
        self._page = parseInt($(this).data('page')); self._render();
      });

      // Row click → open detail
      $(document).off('click.task-row').on('click.task-row', '.task-row', function () {
        FS.taskDetail.open($(this).data('task-id'));
      });

      // Done toggle
      $(document).off('click.task-done').on('click.task-done', '.task-done-toggle', function (e) {
        e.stopPropagation();
        const taskId = $(this).data('task-id');
        const t = FS.db.find('tasks', taskId);
        if (!t) return;

        const newStatus = (t.status === 'done') ? 'in_progress' : 'done';

        t.status = newStatus;
        if (t.status === 'done') t.completedAt = new Date().toISOString();
        FS.db.save('tasks', t);
        self._render();
        FS.toast(t.status === 'done' ? 'Đã đánh dấu hoàn thành! ✅' : 'Đã mở lại task', 'success');
      });

      // Edit button
      $(document).off('click.task-edit').on('click.task-edit', '.task-edit-btn', function (e) {
        e.stopPropagation();
        self._openModal($(this).data('task-id'));
      });

      // New task
      $('#task-new-btn').off('click').on('click', function () { self._openModal(); });

      // Modal controls
      $('#task-modal-close, #task-modal-cancel').off('click').on('click', () => $('#task-modal-overlay').hide());
      $('#task-modal-overlay').off('click').on('click', function (e) {
        if ($(e.target).is('#task-modal-overlay')) $('#task-modal-overlay').hide();
      });
      $('#task-modal-save').off('click').on('click', () => self._saveModal());
    }
  };

})(window.FS = window.FS || {}, jQuery);