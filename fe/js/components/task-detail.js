/**
 * FlowSpace — Task Detail Component (Offcanvas)
 * Module 3: Connected to RESTful APIs (/api/v1/tasks/{id}, /subtasks, /comments)
 */
(function (FS, $) {
  'use strict';

  FS.taskDetail = {
    _taskId: null,
    _taskData: null,

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    async open(taskId) {
      this._taskId = taskId;

      try {
        const response = await $.ajax({
          url: FS.API_BASE + '/api/v1/tasks/' + taskId,
          type: 'GET',
          headers: this._getAuthHeaders()
        });

        if (response && response.success && response.data) {
          const t = response.data;
          this._taskData = {
            id: t.id,
            code: t.code,
            title: t.title,
            description: t.description || '',
            projectId: t.projectId,
            projectName: t.projectName || '',
            assigneeId: t.assigneeId,
            assigneeName: t.assigneeName || '',
            assigneeAvatar: t.assigneeAvatar || '',
            assigneeColor: t.assigneeColor || '',
            status: (t.status || 'todo').toLowerCase(),
            priority: (t.priority || 'medium').toLowerCase(),
            startDate: t.startDate,
            dueDate: t.dueDate,
            estimatedHours: t.estimatedHours || 0,
            loggedHours: t.loggedHours || 0,
            subtasks: t.subtasks || [],
            comments: t.comments || []
          };
          this._render(this._taskData);
          return;
        }
      } catch (err) {
        console.warn('Task detail API request failed, falling back to LocalStorage:', err);
      }

      // LocalStorage fallback
      const task = FS.db.find('tasks', taskId);
      if (!task) return;
      this._taskData = task;
      this._render(task);
    },

    _render(task) {
      const project = FS.db.find('projects', task.projectId);
      const assigneeName = task.assigneeName || (FS.db.find('users', task.assigneeId)?.name || '—');
      const assigneeAvatar = task.assigneeAvatar || (FS.db.find('users', task.assigneeId)?.avatar || '');
      const assigneeColor = task.assigneeColor || (FS.db.find('users', task.assigneeId)?.color || 'av-indigo');

      const progress = task.estimatedHours
        ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
        : 0;
      const overdue = FS.date.isOverdue(task.dueDate) && task.status !== 'done';

      const subtasksHtml = (task.subtasks || []).map(st => `
        <div class="d-flex align-items-center gap-2 py-1">
          <input type="checkbox" class="form-check-input task-subtask-check" data-subtask-id="${st.id}" ${st.done ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer">
          <span style="font-size:13px;${st.done ? 'text-decoration:line-through;color:var(--fs-text-muted)' : ''}">${FS.str.escape(st.title)}</span>
        </div>
      `).join('') || '<p class="fs-small text-muted">Chưa có sub-task</p>';

      const commentsHtml = (task.comments || []).map(c => {
        const uName = c.userName || (FS.db.find('users', c.userId)?.name || 'Unknown');
        const uAvatar = c.userAvatar || (FS.db.find('users', c.userId)?.avatar || 'U');
        const uColor = c.userColor || (FS.db.find('users', c.userId)?.color || 'av-indigo');

        return `
          <div class="d-flex gap-2 mb-3">
            <div class="fs-avatar fs-avatar-sm ${uColor}" title="${FS.str.escape(uName)}">${uAvatar}</div>
            <div style="flex:1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong style="font-size:13px">${FS.str.escape(uName)}</strong>
                <span class="fs-small">${FS.date.relative(c.createdAt)}</span>
              </div>
              <div style="font-size:13px;background:var(--fs-bg-secondary);padding:8px 12px;border-radius:var(--fs-radius)">${FS.str.escape(c.text)}</div>
            </div>
          </div>`;
      }).join('') || '<p class="fs-small text-muted">Chưa có bình luận</p>';

      const avatarHtml = assigneeAvatar
        ? `<div class="fs-avatar fs-avatar-sm ${assigneeColor}" title="${FS.str.escape(assigneeName)}">${assigneeAvatar}</div>`
        : FS.user.avatar(task.assigneeId, 'fs-avatar-sm');

      const html = `
        <div class="fs-offcanvas open" id="task-detail-panel">
          <div class="fs-offcanvas-header">
            <div>
              <span class="fs-small" style="color:var(--fs-accent)">${task.code}</span>
              <h5 class="fs-h5 mt-1 mb-0">${FS.str.escape(task.title)}</h5>
            </div>
            <button class="btn btn-ghost btn-icon btn-sm fs-offcanvas-close" id="task-detail-close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="fs-offcanvas-body">

            <!-- Badges row -->
            <div class="d-flex flex-wrap gap-2 mb-4">
              ${FS.badge.status(task.status)}
              ${FS.badge.priority(task.priority)}
              ${overdue ? '<span class="fs-badge badge-danger"><i class="bi bi-exclamation-triangle"></i>Quá hạn</span>' : ''}
            </div>

            <!-- Meta grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
              <div>
                <div class="fs-label mb-1">Dự án</div>
                <div style="font-size:13px">${FS.str.escape(task.projectName || (project ? project.name : '—'))}</div>
              </div>
              <div>
                <div class="fs-label mb-1">Người thực hiện</div>
                <div class="d-flex align-items-center gap-2">
                  ${avatarHtml}
                  <span style="font-size:13px">${FS.str.escape(assigneeName)}</span>
                </div>
              </div>
              <div>
                <div class="fs-label mb-1">Ngày bắt đầu</div>
                <div style="font-size:13px">${FS.date.format(task.startDate)}</div>
              </div>
              <div>
                <div class="fs-label mb-1">Hạn hoàn thành</div>
                <div style="font-size:13px;${overdue ? 'color:var(--fs-danger);font-weight:600' : ''}">${FS.date.format(task.dueDate)}</div>
              </div>
              <div>
                <div class="fs-label mb-1">Ước tính</div>
                <div style="font-size:13px">${task.estimatedHours || 0}h</div>
              </div>
              <div>
                <div class="fs-label mb-1">Đã ghi nhận</div>
                <div style="font-size:13px">${task.loggedHours || 0}h</div>
              </div>
            </div>

            <!-- Progress -->
            <div class="mb-4">
              <div class="d-flex justify-content-between mb-1">
                <span class="fs-label">Tiến độ</span>
                <span style="font-size:12px;font-weight:600;color:var(--fs-accent)">${progress}%</span>
              </div>
              <div class="fs-progress">
                <div class="fs-progress-bar" style="width:${progress}%"></div>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-4">
              <div class="fs-label mb-2">Mô tả</div>
              <p style="font-size:13px;color:var(--fs-text-secondary);line-height:1.6">${FS.str.escape(task.description) || 'Chưa có mô tả.'}</p>
            </div>

            <hr class="fs-divider">

            <!-- Sub-tasks -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="fs-label">Sub-tasks (${(task.subtasks||[]).filter(s=>s.done).length}/${(task.subtasks||[]).length})</div>
              </div>
              <div id="task-subtasks">${subtasksHtml}</div>
              <div class="d-flex gap-2 mt-2">
                <input type="text" class="fs-input form-control-sm" id="new-subtask-input" placeholder="Thêm sub-task mới..." style="font-size:12px">
                <button class="btn btn-primary btn-sm" id="new-subtask-btn" style="white-space:nowrap;font-size:12px">Thêm</button>
              </div>
            </div>

            <hr class="fs-divider">

            <!-- Comments -->
            <div>
              <div class="fs-label mb-3">Bình luận</div>
              <div id="task-comments">${commentsHtml}</div>
              <div class="d-flex gap-2 mt-3">
                ${FS.user.avatar(FS.auth.getSession()?.userId, 'fs-avatar-sm')}
                <div style="flex:1">
                  <textarea class="fs-textarea" id="task-comment-input" rows="2" placeholder="Viết bình luận..." style="min-height:0;resize:none"></textarea>
                  <button class="btn btn-primary btn-sm mt-1" id="task-comment-submit">
                    <i class="bi bi-send"></i> Gửi
                  </button>
                </div>
              </div>
            </div>

          </div>
          <div class="fs-offcanvas-footer">
            ${FS.auth.hasLevel(2) ? `<button class="btn btn-outline btn-sm" id="task-edit-btn"><i class="bi bi-pencil"></i> Chỉnh sửa</button>` : ''}
            <button class="btn btn-ghost btn-sm ms-auto fs-offcanvas-close" id="task-detail-close2">Đóng</button>
          </div>
        </div>
        <div class="fs-offcanvas-backdrop show" id="task-detail-backdrop"></div>
      `;

      $('#task-detail-panel, #task-detail-backdrop').remove();
      $('body').append(html);

      const self = this;

      // Close handlers
      $(document).off('click.task-close').on('click.task-close', '#task-detail-close, #task-detail-close2, #task-detail-backdrop', () => {
        self._hide();
      });

      // Subtask toggle
      $(document).off('change.subtask-toggle').on('change.subtask-toggle', '.task-subtask-check', function () {
        const stId = $(this).data('subtask-id');
        const checked = this.checked;
        const $label = $(this).next('span');

        $.ajax({
          url: FS.API_BASE + '/api/v1/tasks/subtasks/' + stId + '/toggle',
          type: 'PATCH',
          headers: self._getAuthHeaders()
        }).done(function (res) {
          if (res && res.success) {
            $label.css(checked ? { textDecoration: 'line-through', color: 'var(--fs-text-muted)' } : { textDecoration: '', color: '' });
          }
        }).fail(function () {
          $label.css(checked ? { textDecoration: 'line-through', color: 'var(--fs-text-muted)' } : { textDecoration: '', color: '' });
        });
      });

      // Add Subtask
      $(document).off('click.subtask-add').on('click.subtask-add', '#new-subtask-btn', function () {
        const title = $('#new-subtask-input').val().trim();
        if (!title || !self._taskId) return;

        $.ajax({
          url: FS.API_BASE + '/api/v1/tasks/' + self._taskId + '/subtasks',
          type: 'POST',
          contentType: 'application/json',
          headers: self._getAuthHeaders(),
          data: JSON.stringify({ title: title })
        }).done(function (res) {
          if (res && res.success && res.data) {
            const st = res.data;
            const newHtml = `
              <div class="d-flex align-items-center gap-2 py-1">
                <input type="checkbox" class="form-check-input task-subtask-check" data-subtask-id="${st.id}" style="width:16px;height:16px;cursor:pointer">
                <span style="font-size:13px">${FS.str.escape(st.title)}</span>
              </div>`;
            $('#task-subtasks').append(newHtml);
            $('#new-subtask-input').val('');
            FS.toast('Thêm sub-task thành công!', 'success');
          }
        });
      });

      // Submit comment
      $(document).off('click.comment-submit').on('click.comment-submit', '#task-comment-submit', function () {
        const text = $('#task-comment-input').val().trim();
        if (!text || !self._taskId) return;
        const session = FS.auth.getSession();

        $.ajax({
          url: FS.API_BASE + '/api/v1/tasks/' + self._taskId + '/comments',
          type: 'POST',
          contentType: 'application/json',
          headers: self._getAuthHeaders(),
          data: JSON.stringify({ text: text })
        }).done(function (res) {
          if (res && res.success && res.data) {
            const c = res.data;
            const uName = c.userName || session.name;
            const uAvatar = c.userAvatar || session.avatar;
            const uColor = c.userColor || session.color || 'av-indigo';

            const newHtml = `
              <div class="d-flex gap-2 mb-3">
                <div class="fs-avatar fs-avatar-sm ${uColor}" title="${FS.str.escape(uName)}">${uAvatar}</div>
                <div style="flex:1">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <strong style="font-size:13px">${FS.str.escape(uName)}</strong>
                    <span class="fs-small">Vừa xong</span>
                  </div>
                  <div style="font-size:13px;background:var(--fs-bg-secondary);padding:8px 12px;border-radius:var(--fs-radius)">${FS.str.escape(c.text)}</div>
                </div>
              </div>`;
            $('#task-comments').append(newHtml);
            $('#task-comment-input').val('');
            FS.toast('Đã gửi bình luận', 'success');
          }
        });
      });

      // Edit Task button
      $(document).off('click.task-detail-edit').on('click.task-detail-edit', '#task-edit-btn', function () {
        self._hide();
        if (FS.pages.tasks && FS.pages.tasks._openModal) {
          FS.pages.tasks._openModal(self._taskId);
        }
      });
    },

    _hide() {
      $('#task-detail-panel').css('right', '-520px');
      setTimeout(() => {
        $('#task-detail-panel, #task-detail-backdrop').remove();
      }, 300);
    }
  };

})(window.FS = window.FS || {}, jQuery);
