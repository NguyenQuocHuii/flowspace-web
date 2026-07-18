/**
 * FlowSpace — Task Detail Component (Offcanvas)
 * Dùng chung cho trang Tasks, Kanban, Projects
 */
(function (FS, $) {
  'use strict';

  FS.taskDetail = {
    _taskId: null,

    open(taskId) {
      const task = FS.db.find('tasks', taskId);
      if (!task) return;
      this._taskId = taskId;
      this._render(task);
      this._show();
    },

    _render(task) {
      const project = FS.db.find('projects', task.projectId);
      const assignee = FS.db.find('users', task.assigneeId);
      const progress = task.estimatedHours
        ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
        : 0;
      const overdue = FS.date.isOverdue(task.dueDate) && task.status !== 'done';

      const subtasksHtml = (task.subtasks || []).map(st => `
        <div class="d-flex align-items-center gap-2 py-1">
          <input type="checkbox" class="form-check-input task-subtask-check" data-subtask-id="${st.id}" ${st.done ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer">
          <span style="font-size:13px;${st.done ? 'text-decoration:line-through;color:var(--fs-text-muted)' : ''}">${FS.str.escape(st.title)}</span>
        </div>
      `).join('') || '<p class="fs-small">Chưa có sub-task</p>';

      const commentsHtml = (task.comments || []).map(c => {
        const u = FS.db.find('users', c.userId);
        return `
          <div class="d-flex gap-2 mb-3">
            ${FS.user.avatar(c.userId, 'fs-avatar-sm')}
            <div style="flex:1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong style="font-size:13px">${u ? u.name : 'Unknown'}</strong>
                <span class="fs-small">${FS.date.relative(c.createdAt)}</span>
              </div>
              <div style="font-size:13px;background:var(--fs-bg-secondary);padding:8px 12px;border-radius:var(--fs-radius)">${FS.str.escape(c.text)}</div>
            </div>
          </div>`;
      }).join('') || '<p class="fs-small text-muted">Chưa có bình luận</p>';

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
                <div style="font-size:13px">${project ? project.name : '—'}</div>
              </div>
              <div>
                <div class="fs-label mb-1">Người thực hiện</div>
                <div class="d-flex align-items-center gap-2">
                  ${assignee ? FS.user.avatar(assignee.id, 'fs-avatar-sm') : ''}
                  <span style="font-size:13px">${assignee ? assignee.name : '—'}</span>
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

            <!-- Tags -->
            ${task.tags && task.tags.length ? `
            <div class="mb-4">
              <div class="fs-label mb-2">Tags</div>
              <div class="d-flex flex-wrap gap-1">
                ${task.tags.map(t => `<span class="fs-badge badge-neutral">#${t}</span>`).join('')}
              </div>
            </div>` : ''}

            <hr class="fs-divider">

            <!-- Sub-tasks -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="fs-label">Sub-tasks (${(task.subtasks||[]).filter(s=>s.done).length}/${(task.subtasks||[]).length})</div>
              </div>
              <div id="task-subtasks">${subtasksHtml}</div>
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

      // Remove existing
      $('#task-detail-panel, #task-detail-backdrop').remove();
      $('body').append(html);

      // Bind events
      $(document).on('click', '#task-detail-close, #task-detail-close2, #task-detail-backdrop', () => {
        FS.taskDetail._hide();
      });

      // Subtask toggle
      $(document).on('change', '.task-subtask-check', function () {
        const stId = $(this).data('subtask-id');
        const t = FS.db.find('tasks', FS.taskDetail._taskId);
        if (!t) return;
        const st = t.subtasks.find(x => x.id === stId);
        if (st) st.done = this.checked;
        FS.db.save('tasks', t);
        // Update strikethrough
        const $label = $(this).next('span');
        if (this.checked) {
          $label.css({textDecoration:'line-through', color:'var(--fs-text-muted)'});
        } else {
          $label.css({textDecoration:'', color:''});
        }
      });

      // Submit comment
      $(document).on('click', '#task-comment-submit', function () {
        const text = $('#task-comment-input').val().trim();
        if (!text) return;
        const t = FS.db.find('tasks', FS.taskDetail._taskId);
        if (!t) return;
        const session = FS.auth.getSession();
        const comment = { id: FS.db.newId(), userId: session.userId, text, createdAt: new Date().toISOString() };
        t.comments = t.comments || [];
        t.comments.push(comment);
        FS.db.save('tasks', t);

        const u = FS.db.find('users', session.userId);
        const newHtml = `
          <div class="d-flex gap-2 mb-3">
            ${FS.user.avatar(session.userId, 'fs-avatar-sm')}
            <div style="flex:1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong style="font-size:13px">${u ? u.name : 'Bạn'}</strong>
                <span class="fs-small">Vừa xong</span>
              </div>
              <div style="font-size:13px;background:var(--fs-bg-secondary);padding:8px 12px;border-radius:var(--fs-radius)">${FS.str.escape(text)}</div>
            </div>
          </div>`;
        $('#task-comments').append(newHtml);
        $('#task-comment-input').val('');
        FS.toast('Đã gửi bình luận', 'success');
      });
    },

    _show() { /* panel already shown via 'open' class added in HTML */ },

    _hide() {
      $('#task-detail-panel').css('right', '-520px');
      setTimeout(() => {
        $('#task-detail-panel, #task-detail-backdrop').remove();
      }, 300);
    }
  };

})(window.FS = window.FS || {}, jQuery);
