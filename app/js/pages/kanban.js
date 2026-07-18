/**
 * FlowSpace — Kanban Board Module
 * SortableJS drag-and-drop between columns
 */
(function (FS, $) {
  'use strict';

  const COLUMNS = [
    { id: 'todo',        label: 'Chưa bắt đầu', color: '#64748b', bg: '#f1f5f9' },
    { id: 'in_progress', label: 'Đang làm',     color: '#6366f1', bg: '#eef2ff' },
    { id: 'review',      label: 'Chờ duyệt',    color: '#f59e0b', bg: '#fefce8' },
    { id: 'done',        label: 'Hoàn thành',   color: '#10b981', bg: '#f0fdf4' }
  ];

  FS.pages.kanban = {
    _sortables: [],
    _filter: { project: '', employee: '', department: '' },

    init() {
      this._populateFilters();
      this._renderBoard();
      this._bindEvents();
    },

    _populateFilters() {
      // Projects
      const projects = FS.db.get('projects');
      $('#kanban-filter-project').html('<option value="">Tất cả dự án</option>' + 
        projects.map(p => `<option value="${p.id}">${FS.str.escape(p.name)}</option>`).join('')
      );
      
      // Employees
      const users = FS.db.get('users');
      $('#kanban-filter-employee').html('<option value="">Tất cả nhân viên</option>' + 
        users.map(u => `<option value="${u.id}">${FS.str.escape(u.name)}</option>`).join('')
      );

      // Departments
      const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
      $('#kanban-filter-department').html('<option value="">Tất cả phòng ban</option>' +
        departments.map(d => `<option value="${d}">${FS.str.escape(d)}</option>`).join('')
      );
    },

    _getData() {
      let tasks = FS.db.get('tasks');
      const { project, employee, department } = this._filter;
      
      if (project) {
        tasks = tasks.filter(t => t.projectId === project);
      }
      
      if (employee) {
        tasks = tasks.filter(t => t.assigneeId === employee);
      }
      
      if (department) {
        tasks = tasks.filter(t => {
          const user = FS.db.find('users', t.assigneeId);
          return user && user.department === department;
        });
      }
      
      return tasks;
    },

    _renderBoard() {
      // Destroy old sortables
      this._sortables.forEach(s => { try { s.destroy(); } catch(e){} });
      this._sortables = [];

      const tasks = this._getData();
      const $board = $('#kanban-board');

      $board.html(COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const cards = colTasks.map(t => this._cardHtml(t)).join('');

        return `
          <div class="kanban-col">
            <div class="kanban-col-header" style="background:${col.bg};border:1.5px solid ${col.color}20;color:${col.color}">
              <div class="d-flex align-items-center gap-2">
                <span class="kanban-col-count" style="background:${col.color}20;color:${col.color}">${colTasks.length}</span>
                ${col.label}
              </div>
            </div>
            <div class="kanban-col-body" id="kanban-col-${col.id}" data-status="${col.id}">
              ${cards}
              <button class="kanban-add-btn" data-status="${col.id}">
                <i class="bi bi-plus"></i> Thêm task
              </button>
            </div>
          </div>`;
      }).join(''));

      // Init SortableJS on each column
      const self = this;
      COLUMNS.forEach(col => {
        const el = document.getElementById('kanban-col-' + col.id);
        if (!el) return;

        const sortable = Sortable.create(el, {
          group:     'kanban',
          animation: 200,
          ghostClass:    'sortable-ghost',
          dragClass:     'sortable-drag',
          draggable:     '.kanban-card',
          handle:        '.kanban-card',
          onEnd(evt) {
            const taskId   = evt.item.dataset.taskId;
            const newStatus = evt.to.dataset.status;
            const task = FS.db.find('tasks', taskId);
            if (task && task.status !== newStatus) {
              task.status = newStatus;
              if (newStatus === 'done') task.completedAt = new Date().toISOString();
              FS.db.save('tasks', task);
              self._updateColCount(evt.from.dataset.status);
              self._updateColCount(newStatus);
              FS.toast(`Đã chuyển sang "${COLUMNS.find(c=>c.id===newStatus)?.label}"`, 'success');
            }
          }
        });
        this._sortables.push(sortable);
      });
    },

    _cardHtml(task) {
      const project  = FS.db.find('projects', task.projectId);
      const overdue  = FS.date.isOverdue(task.dueDate) && task.status !== 'done';
      const subtasksDone = (task.subtasks || []).filter(s => s.done).length;
      const subtasksTotal = (task.subtasks || []).length;

      return `
        <div class="kanban-card" data-task-id="${task.id}">
          <div class="kanban-card-title">${FS.str.escape(task.title)}</div>
          ${project ? `<div class="fs-small mb-2" style="color:var(--fs-accent)">${FS.str.escape(project.name)}</div>` : ''}
          <div class="kanban-card-meta">
            <div class="d-flex align-items-center gap-1 flex-wrap">
              ${FS.badge.priority(task.priority)}
              ${subtasksTotal > 0 ? `<span class="fs-badge badge-neutral"><i class="bi bi-check2-square"></i>${subtasksDone}/${subtasksTotal}</span>` : ''}
            </div>
            <div class="d-flex align-items-center gap-2">
              ${overdue ? `<i class="bi bi-clock-history" style="color:var(--fs-danger);font-size:12px" title="Quá hạn"></i>` : ''}
              <span style="font-size:11px;color:${overdue?'var(--fs-danger)':'var(--fs-text-muted)'};font-weight:${overdue?'600':'400'}">${FS.date.short(task.dueDate)}</span>
              ${FS.user.avatar(task.assigneeId, 'fs-avatar-sm')}
            </div>
          </div>
        </div>`;
    },

    _updateColCount(status) {
      const tasks = this._getData().filter(t => t.status === status);
      const col   = COLUMNS.find(c => c.id === status);
      const $header = $(`#kanban-col-${status}`).siblings('.kanban-col-header').find('.kanban-col-count');
      $header.text(tasks.length);
    },

    _bindEvents() {
      const self = this;

      // Filters
      $('#kanban-filter-project').off('change').on('change', function () {
        self._filter.project = this.value; self._renderBoard();
      });
      $('#kanban-filter-employee').off('change').on('change', function () {
        self._filter.employee = this.value; self._renderBoard();
      });
      $('#kanban-filter-department').off('change').on('change', function () {
        self._filter.department = this.value; self._renderBoard();
      });

      // Card click → open detail
      $(document).off('click.kanban-card').on('click.kanban-card', '.kanban-card', function () {
        FS.taskDetail.open($(this).data('task-id'));
      });

      // Add task button
      $(document).off('click.kanban-add').on('click.kanban-add', '.kanban-add-btn', function () {
        // Switch to tasks page with new task modal
        FS.router.go('tasks');
        setTimeout(() => $('#task-new-btn').click(), 500);
      });

      // Header new btn
      $('#kanban-new-btn').off('click').on('click', function () {
        FS.router.go('tasks');
        setTimeout(() => $('#task-new-btn').click(), 500);
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);