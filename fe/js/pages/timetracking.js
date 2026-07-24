/**
 * FlowSpace — Time Tracking Module
 * Module 4: Connected to Backend .NET 8 Web API (/api/v1/timetracking/logs)
 */
(function (FS) {
  'use strict';

  FS.pages.timetracking = {
    _timer: null,
    _seconds: 0,
    _state: 'idle', // 'idle' | 'running' | 'paused'
    _chart: null,
    _period: 'week',
    _page: 1,
    PAGE_SIZE: 6,
    _logsData: [],
    _tasksList: [],
    _editingLogId: null, // null when creating, id when editing

    async init() {
      // 1. Render the shell immediately, then let API data become the source of truth.
      this._logsData = [];
      this._tasksList = FS.db.get('tasks') || [];
      this._populateTaskSelect();
      this._renderControls();
      this._renderLogs();
      this._renderChart();
      this._bindEvents();

      // 2. Load reference data first so edit modal/task labels stay in sync with backend logs.
      await Promise.all([this._loadProjects(), this._loadTasks()]);
      await this._loadLogs();
    },

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    _isGuid(value) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
    },

    _sameId(a, b) {
      return String(a || '').toLowerCase() === String(b || '').toLowerCase();
    },

    _normalizeApiLog(l) {
      return {
        id: l.id,
        taskId: l.taskId,
        taskCode: l.taskCode || '',
        taskTitle: l.taskTitle || l.title || '',
        userId: l.userId,
        userName: l.userName || '',
        hours: Number(l.hours) || 0,
        note: l.description || l.note || '',
        date: l.loggedDate || l.date || '',
        projectName: l.projectName || '',
        projectId: l.projectId || '',
        createdAt: l.createdAt,
        source: 'api'
      };
    },

    _getApiErrorMessage(err, fallback) {
      return err?.xhr?.responseJSON?.message || err?.xhr?.responseJSON?.error || err?.message || fallback;
    },

    _isOwner(log) {
      const session = FS.auth.getSession();
      return FS.auth.isDirector() || (log.userId && session && this._sameId(log.userId, session.userId));
    },

    _canEditLog(log) {
      if (!this._isOwner(log)) return false;
      if (log.approved) return false;
      // Check project closure via task lookup or direct projectId on the log
      const projectId = log.projectId || (FS.db.find('tasks', log.taskId) || {}).projectId;
      if (projectId) {
        const project = FS.db.find('projects', projectId);
        if (project && (project.isClosed || project.status === 'closed')) return false;
      }
      // Disallow if accounting period is locked
      if (typeof FS.isAccountingLocked === 'function' && FS.isAccountingLocked(log.date)) {
        return false;
      }
      return true;
    },

    _canPersistLog(log) {
      return log && log.source === 'api' && this._isGuid(log.id) && this._isGuid(log.taskId);
    },
    async _loadLogs() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/timetracking/logs',
          type: 'GET'
        });

        if (response && response.success && Array.isArray(response.data)) {
          this._logsData = response.data.map(l => this._normalizeApiLog(l));
          $('#timetracking-offline-banner').remove();
        } else if (!this._logsData.length) {
          this._logsData = (FS.db.get('time_logs') || []).map(l => ({ ...l, source: 'local' }));
        }
      } catch (err) {
        console.warn('TimeTracking API request failed:', err);
        if (!this._logsData.length) {
          this._logsData = (FS.db.get('time_logs') || []).map(l => ({ ...l, source: 'local' }));
        }
      } finally {
        this._renderLogs();
        this._renderChart();
      }
    },

    async _loadProjects() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/projects',
          type: 'GET'
        });
        if (response && response.success && Array.isArray(response.data)) {
          FS.db.set('projects', response.data);
        }
      } catch (err) {
        console.warn('Projects API request failed in timetracking:', err);
      }
    },

    async _loadTasks() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/tasks',
          type: 'GET'
        });
        if (response && response.success && Array.isArray(response.data)) {
          this._tasksList = response.data.map(t => ({
            id: t.id,
            code: t.code,
            title: t.title,
            projectName: t.projectName || '',
            projectId: t.projectId,
            assigneeId: t.assigneeId
          }));
          FS.db.set('tasks', this._tasksList);
          $('#timetracking-offline-banner').remove();
        } else {
          this._tasksList = [];
        }
      } catch (err) {
        console.warn('Tasks API request failed:', err);
        this._tasksList = [];
        if (!$('#timetracking-offline-banner').length) {
          $('#page-content').prepend('<div id="timetracking-offline-banner" class="fs-login-alert show" style="display:flex; margin-bottom:16px"><i class="bi bi-exclamation-triangle-fill"></i><span>Không thể kết nối máy chủ. Hiện đang hiển thị dữ liệu công việc tạm thời ngoại tuyến.</span></div>');
        }
      } finally {
        this._populateTaskSelect();
      }
    },

    _populateTaskSelect() {
      const tasks = this._tasksList || [];
      const session = FS.auth.getSession();
      const myTasks = FS.auth.isDirector()
        ? tasks
        : tasks.filter(t => this._sameId(t.assigneeId, session?.userId) || !t.assigneeId);
      const opts = myTasks.map(t => {
        const p = FS.db.find('projects', t.projectId);
        return `<option value="${t.id}">[${t.code}] ${FS.str.escape(t.title)} ${p ? '· ' + FS.str.escape(p.name) : ''}</option>`;
      }).join('');

      const $sel1 = document.getElementById('tt-task-select');
      const $sel2 = document.getElementById('tt-modal-task');
      if ($sel1) $sel1.innerHTML = '<option value="">-- Chọn công việc --</option>' + opts;
      if ($sel2) $sel2.innerHTML = '<option value="">-- Chọn công việc --</option>' + opts;
    },

    _tick() {
      this._seconds++;
      this._updateDisplay();
    },

    _updateDisplay() {
      const h = String(Math.floor(this._seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((this._seconds % 3600) / 60)).padStart(2, '0');
      const s = String(this._seconds % 60).padStart(2, '0');
      const el = document.getElementById('tt-display');
      if (el) el.textContent = `${h}:${m}:${s}`;
    },

    _renderControls() {
      const $wrap = document.getElementById('tt-controls-wrap');
      const $taskSelect = document.getElementById('tt-task-select');
      const $noteWrap = document.getElementById('tt-note-wrap');
      const $status = document.getElementById('tt-status');
      const $display = document.getElementById('tt-display');

      if (!$wrap) return;

      if (this._state === 'idle') {
        $wrap.innerHTML = `
          <button class="btn btn-primary" id="tt-start-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-play-fill"></i> Bắt đầu
          </button>
        `;
        if ($taskSelect) $taskSelect.disabled = false;
        if ($noteWrap) $noteWrap.style.display = 'none';
        if ($display) $display.style.color = 'var(--fs-text)';
        if ($status) $status.textContent = 'Chọn công việc và nhấn bắt đầu';
      } else if (this._state === 'running') {
        $wrap.innerHTML = `
          <button class="btn btn-warning" id="tt-pause-btn" style="min-width:120px;padding:10px;color:white">
            <i class="bi bi-pause-fill"></i> Tạm dừng
          </button>
          <button class="btn btn-danger" id="tt-stop-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-stop-fill"></i> Kết thúc
          </button>
        `;
        if ($taskSelect) $taskSelect.disabled = true;
        if ($noteWrap) $noteWrap.style.display = '';
        if ($display) $display.style.color = 'var(--fs-accent)';
        if ($status) $status.textContent = 'Đang ghi nhận thời gian...';
      } else if (this._state === 'paused') {
        $wrap.innerHTML = `
          <button class="btn btn-success" id="tt-resume-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-play-fill"></i> Tiếp tục
          </button>
          <button class="btn btn-danger" id="tt-stop-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-stop-fill"></i> Kết thúc
          </button>
        `;
        if ($taskSelect) $taskSelect.disabled = true;
        if ($noteWrap) $noteWrap.style.display = '';
        if ($display) $display.style.color = 'var(--fs-text-muted)';
        if ($status) $status.textContent = 'Đang tạm dừng đếm...';
      }
    },

    _startTimer() {
      const taskId = document.getElementById('tt-task-select')?.value;
      if (!taskId) { FS.toast('Vui lòng chọn công việc trước!', 'warning'); return; }
      this._state = 'running';
      this._seconds = 0;
      this._updateDisplay();
      this._timer = setInterval(() => this._tick(), 1000);
      this._renderControls();
    },

    _pauseTimer() {
      this._state = 'paused';
      clearInterval(this._timer);
      this._timer = null;
      this._renderControls();
    },

    _resumeTimer() {
      this._state = 'running';
      this._timer = setInterval(() => this._tick(), 1000);
      this._renderControls();
    },

    async _stopTimer() {
      clearInterval(this._timer);
      this._timer = null;

      const secondsRecorded = this._seconds;

      if (secondsRecorded >= 60) {
        const taskId = document.getElementById('tt-task-select')?.value;
        const hours = Math.round(secondsRecorded / 360) / 10;
        const note = document.getElementById('tt-note')?.value || '';
        await this._saveLog(taskId, hours, note);
      } else {
        FS.toast('Cần ít nhất 1 phút để ghi nhận', 'warning');
        const $status = document.getElementById('tt-status');
        if ($status) $status.textContent = 'Cần ít nhất 1 phút để ghi nhận';
      }

      this._state = 'idle';
      this._seconds = 0;
      this._updateDisplay();
      this._renderControls();
    },

    async _saveLog(taskId, hours, note = '', loggedDate = null) {
      if (!taskId || !hours) return;

      const payload = {
        taskId: taskId,
        hours: hours,
        description: note,
        loggedDate: loggedDate ? new Date(loggedDate).toISOString() : new Date().toISOString()
      };

      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/timetracking/logs',
          type: 'POST',
          data: payload
        });

        if (response && response.success) {
          FS.toast(`✅ Đã ghi nhận ${hours}h làm việc!`, 'success');
          const $status = document.getElementById('tt-status');
          if ($status) $status.textContent = `Đã lưu ${hours}h — ${new Date().toLocaleTimeString('vi-VN')}`;
          const $note = document.getElementById('tt-note');
          if ($note) $note.value = '';
          await this._loadLogs();
          this._renderLogs();
          this._renderChart();
          return true;
        } else {
          FS.toast('Máy chủ phản hồi lỗi khi ghi nhận thời gian.', 'error');
        }
      } catch (err) {
        console.error('Save time log API failed:', err);
        FS.toast('Không thể lưu nhật ký thời gian lên máy chủ. Vui lòng thử lại!', 'error');
      }
      return false;
    },

    async _updateLog(logId, taskId, hours, note = '', loggedDate = null) {
      if (!this._isGuid(logId) || !this._isGuid(taskId) || !hours) {
        FS.toast('Bản ghi giờ làm chưa đồng bộ hoặc dữ liệu không hợp lệ.', 'warning');
        return false;
      }
      const payload = {
        taskId: taskId,
        hours: hours,
        description: note,
        loggedDate: loggedDate ? new Date(loggedDate).toISOString() : new Date().toISOString()
      };
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/timetracking/logs/' + logId,
          type: 'PUT',
          data: payload
        });
        if (response && response.success) {
          FS.toast('✅ Cập nhật log thành công!', 'success');
          await this._loadLogs();
          this._renderLogs();
          this._renderChart();
          return true;
        } else {
          FS.toast(response?.message || 'Máy chủ trả về lỗi khi cập nhật log.', 'error');
        }
      } catch (err) {
        console.error('Update time log API failed:', err);
        FS.toast(this._getApiErrorMessage(err, 'Không thể cập nhật log thời gian.'), 'error');
      }
      return false;
    },

    _openEditModal(log) {
      if (!this._isGuid(log.id) || !this._isGuid(log.taskId)) {
        FS.toast('Bản ghi này chưa đồng bộ với máy chủ nên không thể chỉnh sửa.', 'warning');
        return;
      }

      // Populate modal fields with existing log data
      const $task = document.getElementById('tt-modal-task');
      const $hours = document.getElementById('tt-modal-hours');
      const $note = document.getElementById('tt-modal-note');
      const $date = document.getElementById('tt-modal-date');
      if ($task) {
        const taskId = String(log.taskId || '');
        const hasOption = Array.from($task.options).some(opt => this._sameId(opt.value, taskId));
        if (!hasOption && taskId) {
          const option = new Option(log.taskTitle || 'Công việc đã ghi log', taskId, true, true);
          $task.add(option, $task.options[1] || null);
        }
        $task.value = taskId;
      }
      if ($hours) $hours.value = log.hours;
      if ($note) $note.value = log.note || '';
      if ($date) $date.value = log.date ? log.date.slice(0,10) : '';

      // Set editing state
      this._editingLogId = log.id;

      // Update modal UI (title and button)
      const $title = document.getElementById('tt-modal-title');
      if ($title) $title.textContent = 'Cập nhật bản ghi giờ';
      const $saveBtn = document.getElementById('tt-modal-save');
      if ($saveBtn) $saveBtn.textContent = 'Cập nhật';

      // Show modal
      const $ov = document.getElementById('tt-modal-overlay');
      if ($ov) $ov.style.display = 'flex';
    },

    _getFilteredLogs() {
      const session = FS.auth.getSession();
      const now = new Date();

      return this._logsData.filter(l => {
        if (!FS.auth.isDirector() && !this._sameId(l.userId, session?.userId)) return false;
        if (this._period === 'week') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0,0,0,0);
          return new Date(l.date) >= weekStart;
        }
        if (this._period === 'month') {
          return new Date(l.date).getMonth() === now.getMonth() && new Date(l.date).getFullYear() === now.getFullYear();
        }
        return true;
      });
    },

    _renderLogs() {
      const logs = this._getFilteredLogs();
      const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);

      const $badge = document.getElementById('tt-total-badge');
      if ($badge) $badge.textContent = `${Math.round(totalHours * 10) / 10}h tổng`;

      const totalItems = logs.length;
      const totalPages = Math.ceil(totalItems / this.PAGE_SIZE) || 1;
      if (this._page > totalPages) this._page = totalPages;
      if (this._page < 1) this._page = 1;

      const start = (this._page - 1) * this.PAGE_SIZE;
      const pagedLogs = logs.slice(start, start + this.PAGE_SIZE);

      const $body = document.getElementById('tt-log-body');
      if ($body) {
        if (!logs.length) {
          $body.innerHTML = '<tr><td colspan="6"><div class="fs-empty"><i class="bi bi-clock"></i><p>Chưa có log giờ nào</p></div></td></tr>';
        } else {
          $body.innerHTML = pagedLogs.map(l => {
            const taskTitle = l.taskTitle || '—';
            const projName = l.projectName || '—';
            const note = l.note || '';
            const canPersist = this._canPersistLog(l);
            const canEdit = canPersist && this._canEditLog(l);
            const disabledReason = canPersist ? 'Bạn không có quyền thao tác bản ghi này' : 'Bản ghi chưa đồng bộ với máy chủ';
            const editBtn = canEdit
              ? `<button class="btn btn-ghost btn-icon btn-sm tt-edit-log text-accent" data-log-id="${l.id}" title="Sửa ghi chú/giờ">
                  <i class="bi bi-pencil"></i>
                </button>`
              : `<button class="btn btn-ghost btn-icon btn-sm" type="button" disabled title="${FS.str.escape(disabledReason)}">
                  <i class="bi bi-pencil"></i>
                </button>`;
            const deleteBtn = canEdit
              ? `<button class="btn btn-ghost btn-icon btn-sm tt-delete-log text-danger" data-log-id="${l.id}" title="Xóa bản ghi">
                  <i class="bi bi-trash3"></i>
                </button>`
              : `<button class="btn btn-ghost btn-icon btn-sm" type="button" disabled title="${FS.str.escape(disabledReason)}">
                  <i class="bi bi-trash3"></i>
                </button>`;
            return `
              <tr>
                <td style="font-size:13px"><span class="tt-task-title" title="${FS.str.escape(taskTitle)}">${FS.str.escape(taskTitle)}</span></td>
                <td style="font-size:12px;color:var(--fs-text-secondary)"><span class="tt-project-name" title="${FS.str.escape(projName)}">${FS.str.escape(projName)}</span></td>
                <td class="tt-date-cell" style="font-size:12px;color:var(--fs-text-muted)">${FS.date.format(l.date)}</td>
                <td class="tt-hours-cell"><span class="fs-badge badge-accent">${l.hours}h</span></td>
                <td style="font-size:12px;color:var(--fs-text-secondary)"><span class="tt-note-text" title="${FS.str.escape(note || 'Không có ghi chú')}">${FS.str.escape(note || '—')}</span></td>
                <td class="tt-actions-cell"><div class="tt-row-actions d-flex">${editBtn}${deleteBtn}</div></td>
              </tr>`;
          }).join('');
        }
      }

      this._renderPagination(totalItems, totalPages);
    },

    _renderPagination(total, totalPages) {
      const $ul = $('#tt-pagination-ul');
      const $info = $('#tt-pagination-info');

      if (total === 0) {
        $info.text('Hiển thị 0 trong 0 nhật ký giờ làm');
        $ul.html('');
        return;
      }

      const start = (this._page - 1) * this.PAGE_SIZE + 1;
      const end = Math.min(this._page * this.PAGE_SIZE, total);
      $info.text(`Hiển thị ${start}-${end} trong ${total} nhật ký giờ làm`);

      let html = '';

      // Nút quay lại bị vô hiệu hóa khi ở trang 1
      if (this._page === 1) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">&laquo; Trước</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link tt-page-link" data-page="${this._page - 1}" href="#">&laquo; Trước</a></li>`;
      }

      // Danh sách trang
      for (let p = 1; p <= totalPages; p++) {
        if (p === this._page) {
          html += `<li class="page-item active" aria-current="page"><span class="page-link">${p}</span></li>`;
        } else {
          html += `<li class="page-item"><a class="page-link tt-page-link" data-page="${p}" href="#">${p}</a></li>`;
        }
      }

      // Nút trang tiếp theo
      if (this._page === totalPages) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">Sau &raquo;</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link tt-page-link" data-page="${this._page + 1}" href="#">Sau &raquo;</a></li>`;
      }

      $ul.html(html);
    },

    _renderChart() {
      const ctx = document.getElementById('tt-project-chart');
      if (!ctx) return;
      if (this._chart) { try { this._chart.destroy(); } catch (e) {} }

      const logs = this._getFilteredLogs();
      const data = {};
      const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];

      logs.forEach(l => {
        const name = l.projectName || 'Dự án chung';
        data[name] = (data[name] || 0) + (l.hours || 0);
      });

      const labels = Object.keys(data);
      const values = Object.values(data);

      this._chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ctx.raw + 'h' } }
          },
          scales: {
            x: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { callback: v => v + 'h' } },
            y: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                font: { size: window.innerWidth < 768 ? 10 : 12 },
                callback: function (val) {
                  const label = this.getLabelForValue(val);
                  if (window.innerWidth < 768 && label.length > 14) {
                    return label.substring(0, 12) + '...';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    },

    _bindEvents() {
      const self = this;

      // Pagination links
      $(document).off('click.tt-page').on('click.tt-page', '.tt-page-link', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'), 10);
        if (p && p !== self._page) {
          self._page = p;
          self._renderLogs();
        }
      });

      const $wrap = document.getElementById('tt-controls-wrap');
      if ($wrap) {
        $wrap.addEventListener('click', function (e) {
          const startBtn = e.target.closest('#tt-start-btn');
          const pauseBtn = e.target.closest('#tt-pause-btn');
          const resumeBtn = e.target.closest('#tt-resume-btn');
          const stopBtn = e.target.closest('#tt-stop-btn');

          if (startBtn) {
            self._startTimer();
          } else if (pauseBtn) {
            self._pauseTimer();
          } else if (resumeBtn) {
            self._resumeTimer();
          } else if (stopBtn) {
            self._stopTimer();
          }
        });
      }

      // Period filter
      document.getElementById('tt-period-select')?.addEventListener('change', function () {
        self._period = this.value; self._renderLogs(); self._renderChart();
      });

      // Delete / Edit log
      $(document).off('click.tt-actions').on('click.tt-actions', '.tt-delete-log, .tt-edit-log', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $btn = $(this);
        if ($btn.prop('disabled')) return;
        
        const isDeleteBtn = $btn.hasClass('tt-delete-log');
        const isEditBtn = $btn.hasClass('tt-edit-log');
        const logId = $btn.data('logId');
        
        if (isDeleteBtn) {
          const confirmed = await FS.confirm({
            title: 'Xóa bản ghi giờ',
            message: 'Bạn có chắc muốn xóa bản ghi giờ làm này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            type: 'danger'
          });
          if (!confirmed) return;
          try {
            const response = await FS.apiCall({
              url: FS.API_BASE + '/api/v1/timetracking/logs/' + logId,
              type: 'DELETE'
            });
            if (!response || response.success !== true) {
              throw new Error(response?.message || 'Delete time log failed');
            }
          } catch (err) {
            console.error('Delete time log API failed:', err);
            FS.toast(self._getApiErrorMessage(err, 'Không thể xóa bản ghi giờ làm.'), 'error');
            return;
          }
          await self._loadLogs();
          self._renderLogs();
          self._renderChart();
          FS.toast('Đã xóa bản ghi giờ làm', 'success');
        } else if (isEditBtn) {
          const log = self._logsData.find(l => String(l.id).toLowerCase() === String(logId).toLowerCase());
          if (log) {
            self._openEditModal(log);
          }
        }
      });

      // Manual log modal (Add / Edit)
      const openManualModal = function () {
        self._editingLogId = null;
        const $title = document.getElementById('tt-modal-title');
        if ($title) $title.textContent = 'Ghi giờ thủ công';
        const $saveBtn = document.getElementById('tt-modal-save');
        if ($saveBtn) $saveBtn.textContent = 'Lưu giờ';
        const today = new Date().toISOString().slice(0, 10);
        const $d = document.getElementById('tt-modal-date');
        if ($d) $d.value = today;
        const $task = document.getElementById('tt-modal-task');
        const $hours = document.getElementById('tt-modal-hours');
        const $note = document.getElementById('tt-modal-note');
        if ($task) $task.value = '';
        if ($hours) $hours.value = '1';
        if ($note) $note.value = '';
        const $ov = document.getElementById('tt-modal-overlay');
        if ($ov) $ov.style.display = 'flex';
      };

      document.getElementById('tt-add-manual-btn')?.addEventListener('click', openManualModal);
      document.getElementById('tt-manual-log-btn')?.addEventListener('click', openManualModal);
      document.getElementById('tt-modal-close')?.addEventListener('click', () => {
        const $ov = document.getElementById('tt-modal-overlay');
        if ($ov) $ov.style.display = 'none';
      });
      document.getElementById('tt-modal-cancel')?.addEventListener('click', () => {
        const $ov = document.getElementById('tt-modal-overlay');
        if ($ov) $ov.style.display = 'none';
      });
      document.getElementById('tt-modal-save')?.addEventListener('click', async function () {
        const saveBtn = this;
        if (saveBtn.disabled) return;

        const taskId = document.getElementById('tt-modal-task')?.value;
        const hours = parseFloat(document.getElementById('tt-modal-hours')?.value);
        const note = document.getElementById('tt-modal-note')?.value || '';
        const date = document.getElementById('tt-modal-date')?.value;
        if (!taskId) { FS.toast('Chọn công việc!', 'warning'); return; }
        if (!hours || hours <= 0) { FS.toast('Giờ không hợp lệ!', 'warning'); return; }
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Đang lưu';
        try {
          const saved = self._editingLogId
            ? await self._updateLog(self._editingLogId, taskId, hours, note, date)
            : await self._saveLog(taskId, hours, note, date);
          if (!saved) return;
          self._editingLogId = null;
          const $ov = document.getElementById('tt-modal-overlay');
          if ($ov) $ov.style.display = 'none';
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      });
      document.getElementById('tt-modal-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
      });
    }
  };
})(window.FS = window.FS || {});
