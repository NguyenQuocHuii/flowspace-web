/**
 * FlowSpace — Time Tracking Module
 */
(function (FS) {
  'use strict';

  FS.pages.timetracking = {
    _timer: null,
    _seconds: 0,
    _state: 'idle', // 'idle' | 'running' | 'paused'
    _chart: null,
    _period: 'week',

    init() {
      this._populateTaskSelect();
      this._renderLogs();
      this._renderChart();
      this._renderControls();
      this._bindEvents();
    },

    _populateTaskSelect() {
      const tasks    = FS.db.get('tasks').filter(t => t.status !== 'done');
      const session  = FS.auth.getSession();
      const myTasks  = FS.auth.isDirector() ? tasks : tasks.filter(t => t.assigneeId === session?.userId);
      const opts = myTasks.map(t => {
        const p = FS.db.find('projects', t.projectId);
        return `<option value="${t.id}">[${t.code}] ${t.title} ${p?'· '+p.name:''}</option>`;
      }).join('');
      document.getElementById('tt-task-select').innerHTML = '<option value="">-- Chọn công việc --</option>' + opts;
      document.getElementById('tt-modal-task').innerHTML  = '<option value="">-- Chọn công việc --</option>' + opts;
    },

    _tick() {
      this._seconds++;
      this._updateDisplay();
    },

    _updateDisplay() {
      const h = String(Math.floor(this._seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((this._seconds % 3600) / 60)).padStart(2, '0');
      const s = String(this._seconds % 60).padStart(2, '0');
      document.getElementById('tt-display').textContent = `${h}:${m}:${s}`;
    },

    _renderControls() {
      const $wrap = document.getElementById('tt-controls-wrap');
      const $taskSelect = document.getElementById('tt-task-select');
      const $noteWrap = document.getElementById('tt-note-wrap');
      const $status = document.getElementById('tt-status');
      const $display = document.getElementById('tt-display');

      if (this._state === 'idle') {
        $wrap.innerHTML = `
          <button class="btn btn-primary" id="tt-start-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-play-fill"></i> Bắt đầu
          </button>
        `;
        $taskSelect.disabled = false;
        $noteWrap.style.display = 'none';
        $display.style.color = 'var(--fs-text)';
        $status.textContent = 'Chọn công việc và nhấn bắt đầu';
      } else if (this._state === 'running') {
        $wrap.innerHTML = `
          <button class="btn btn-warning" id="tt-pause-btn" style="min-width:120px;padding:10px;color:white">
            <i class="bi bi-pause-fill"></i> Tạm dừng
          </button>
          <button class="btn btn-danger" id="tt-stop-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-stop-fill"></i> Kết thúc
          </button>
        `;
        $taskSelect.disabled = true;
        $noteWrap.style.display = '';
        $display.style.color = 'var(--fs-accent)';
        $status.textContent = 'Đang ghi nhận thời gian...';
      } else if (this._state === 'paused') {
        $wrap.innerHTML = `
          <button class="btn btn-success" id="tt-resume-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-play-fill"></i> Tiếp tục
          </button>
          <button class="btn btn-danger" id="tt-stop-btn" style="min-width:120px;padding:10px">
            <i class="bi bi-stop-fill"></i> Kết thúc
          </button>
        `;
        $taskSelect.disabled = true;
        $noteWrap.style.display = '';
        $display.style.color = 'var(--fs-text-muted)';
        $status.textContent = 'Đang tạm dừng đếm...';
      }
    },

    _startTimer() {
      const taskId = document.getElementById('tt-task-select').value;
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

    _stopTimer() {
      clearInterval(this._timer);
      this._timer = null;

      const secondsRecorded = this._seconds;
      
      // Save log
      if (secondsRecorded >= 60) {
        const taskId = document.getElementById('tt-task-select').value;
        const hours  = Math.round(secondsRecorded / 360) / 10; // round to 0.1h
        const note   = document.getElementById('tt-note').value;
        this._saveLog(taskId, hours, note);
      } else {
        FS.toast('Cần ít nhất 1 phút để ghi nhận', 'warning');
        document.getElementById('tt-status').textContent = 'Cần ít nhất 1 phút để ghi nhận';
      }

      this._state = 'idle';
      this._seconds = 0;
      this._updateDisplay();
      this._renderControls();
    },

    _saveLog(taskId, hours, note = '') {
      if (!taskId || !hours) return;
      const session  = FS.auth.getSession();
      const task     = FS.db.find('tasks', taskId);
      if (!task) return;

      const log = {
        id: FS.db.newId(),
        taskId,
        userId:    session?.userId,
        projectId: task.projectId,
        hours,
        date:      new Date().toISOString(),
        note
      };
      const logs = FS.db.get('time_logs');
      logs.unshift(log);
      FS.db.set('time_logs', logs);

      // Update task loggedHours
      task.loggedHours = (task.loggedHours || 0) + hours;
      FS.db.save('tasks', task);

      FS.toast(`✅ Đã ghi nhận ${hours}h cho "${task.title}"`, 'success');
      document.getElementById('tt-status').textContent = `Đã lưu ${hours}h — ${new Date().toLocaleTimeString('vi-VN')}`;
      document.getElementById('tt-note').value = '';
      this._renderLogs();
      this._renderChart();
    },

    _getLogs() {
      const session = FS.auth.getSession();
      const logs    = FS.db.get('time_logs');
      const now     = new Date();

      return logs.filter(l => {
        if (!FS.auth.isDirector() && l.userId !== session?.userId) return false;
        if (this._period === 'week') {
          const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
          return new Date(l.date) >= weekStart;
        }
        if (this._period === 'month') {
          return new Date(l.date).getMonth() === now.getMonth() && new Date(l.date).getFullYear() === now.getFullYear();
        }
        return true;
      });
    },

    _renderLogs() {
      const logs  = this._getLogs();
      const total = logs.reduce((s, l) => s + (l.hours || 0), 0);

      document.getElementById('tt-total-badge').textContent = `${Math.round(total * 10) / 10}h tổng`;

      if (!logs.length) {
        document.getElementById('tt-log-body').innerHTML =
          '<tr><td colspan="6"><div class="fs-empty"><i class="bi bi-clock"></i><p>Chưa có log giờ nào</p></div></td></tr>';
        return;
      }

      document.getElementById('tt-log-body').innerHTML = logs.slice(0, 30).map(l => {
        const task = FS.db.find('tasks', l.taskId);
        const proj = task ? FS.db.find('projects', task.projectId) : null;
        return `
          <tr>
            <td style="font-size:13px">${task ? FS.str.escape(task.title) : '—'}</td>
            <td style="font-size:12px;color:var(--fs-text-secondary)">${proj ? proj.name : '—'}</td>
            <td style="font-size:12px;color:var(--fs-text-muted)">${FS.date.format(l.date)}</td>
            <td>
              <span class="fs-badge badge-accent">${l.hours}h</span>
            </td>
            <td style="font-size:12px;color:var(--fs-text-secondary)">${l.note || '—'}</td>
            <td>
              <button class="btn btn-ghost btn-icon btn-sm tt-delete-log" data-log-id="${l.id}" title="Xoá">
                <i class="bi bi-trash3" style="font-size:12px;color:var(--fs-danger)"></i>
              </button>
            </td>
          </tr>`;
      }).join('');
    },

    _renderChart() {
      const ctx = document.getElementById('tt-project-chart');
      if (!ctx) return;
      if (this._chart) { try { this._chart.destroy(); } catch(e){} }

      const logs     = this._getLogs();
      const projects = FS.db.get('projects');
      const data     = {};
      const colors   = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];

      logs.forEach(l => {
        const p = FS.db.find('projects', l.projectId);
        const name = p ? p.name : 'Khác';
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
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ctx.raw + 'h' } }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { callback: v => v + 'h' } }
          }
        }
      });
    },

    _bindEvents() {
      const self = this;

      // Dynamic control buttons using event delegation
      const $wrap = document.getElementById('tt-controls-wrap');
      if ($wrap) {
        $wrap.addEventListener('click', function(e) {
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

      // Delete log
      document.addEventListener('click', function (e) {
        if (e.target.closest('.tt-delete-log')) {
          const logId = e.target.closest('.tt-delete-log').dataset.logId;
          FS.confirm('Xoá bản ghi giờ này?', () => {
            FS.db.remove('time_logs', logId);
            self._renderLogs();
            self._renderChart();
            FS.toast('Đã xoá', 'success');
          }, { danger: true, confirmText: 'Xoá' });
        }
      });

      // Manual log modal
      document.getElementById('tt-add-manual-btn')?.addEventListener('click', function () {
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('tt-modal-date').value = today;
        document.getElementById('tt-modal-overlay').style.display = 'flex';
      });
      document.getElementById('tt-modal-close')?.addEventListener('click', () => {
        document.getElementById('tt-modal-overlay').style.display = 'none';
      });
      document.getElementById('tt-modal-cancel')?.addEventListener('click', () => {
        document.getElementById('tt-modal-overlay').style.display = 'none';
      });
      document.getElementById('tt-modal-save')?.addEventListener('click', function () {
        const taskId = document.getElementById('tt-modal-task').value;
        const hours  = parseFloat(document.getElementById('tt-modal-hours').value);
        const note   = document.getElementById('tt-modal-note').value;
        if (!taskId) { FS.toast('Chọn công việc!', 'warning'); return; }
        if (!hours || hours <= 0) { FS.toast('Giờ không hợp lệ!', 'warning'); return; }
        self._saveLog(taskId, hours, note);
        document.getElementById('tt-modal-overlay').style.display = 'none';
      });
      document.getElementById('tt-modal-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
      });
    }
  };

})(window.FS = window.FS || {});