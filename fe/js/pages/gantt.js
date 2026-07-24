/**
 * ════════════════════════════════════════════════════════════════
 * FlowSpace — Gantt Chart Module (Enterprise SaaS 2026 — Full Redesign)
 * Inspired by Jira Advanced Roadmap / ClickUp / Monday / MS Project
 * ════════════════════════════════════════════════════════════════
 */
(function (FS, $) {
  'use strict';

  /* ─── CONSTANTS ────────────────────────────────────────── */
  const STATUS_COLORS = { todo: '#94a3b8', active: '#6366f1', done: '#10b981', overdue: '#ef4444' };
  const PRIORITY_CLASS = { high: 'gc-priority-high', medium: 'gc-priority-medium', low: 'gc-priority-low' };
  const STATUS_LABELS = { todo: 'Chưa bắt đầu', active: 'Đang làm', done: 'Hoàn thành' };
  const ZOOM_CELLS = { day: 40, week: 36, month: 20, quarter: 14, year: 8 };
  const ZOOM_DAYS  = { day: 14, week: 28, month: 90, quarter: 180, year: 365 };
  const ZOOM_OFFSETS = { day: 3, week: 7, month: 15, quarter: 30, year: 60 };
  const VN_HOLIDAYS = ['01-01','04-30','05-01','09-02'];
  const MONTHS_VI = ['Th01','Th02','Th03','Th04','Th05','Th06','Th07','Th08','Th09','Th10','Th11','Th12'];
  const DAYS_VI = ['CN','T2','T3','T4','T5','T6','T7'];

  /* ─── MODULE ───────────────────────────────────────────── */
  FS.pages.gantt = {
    /* State */
    _zoom: 'week',
    _projectFilter: '',
    _statusFilter: '',
    _priorityFilter: '',
    _assigneeFilter: '',
    _searchQuery: '',
    _tasksData: [],
    _projectsData: [],
    _milestonesData: [],
    _linksData: [],
    _resourcesData: [],
    _criticalPath: new Set(),
    _criticalPathEnabled: true,
    _baselineEnabled: false,
    _selectedTaskIds: new Set(),
    _searchTimeout: null,
    _connection: null,
    _scrollOffset: 0,
    _tableWidth: 520,
    _contextTaskId: null,

    /* ════════════════════════════════════════════════════════
       INIT
       ════════════════════════════════════════════════════════ */
    async init() {
      this._tasksData = FS.db.get('tasks') || [];
      this._projectsData = FS.db.get('projects') || [];
      this._showLoading();
      this._bindEvents();
      await this._loadProjects();
      await this._initSignalR();
    },

    async destroy() {
      if (this._connection) {
        try {
          if (this._projectFilter && this._connection.state === 'Connected')
            await this._connection.invoke('LeaveProject', this._projectFilter);
          await this._connection.stop();
        } catch (e) { /* silent */ }
        this._connection = null;
      }
      $(document).off('.gantt');
      $(window).off('.gantt');
    },

    /* ════════════════════════════════════════════════════════
       DATA LOADING
       ════════════════════════════════════════════════════════ */
    async _loadProjects() {
      try {
        const res = await FS.apiCall({ url: FS.API_BASE + '/api/v1/projects', type: 'GET' });
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          this._projectsData = res.data;
          this._populateProjectFilter();
          if (!this._projectFilter && this._projectsData.length > 0) {
            this._projectFilter = this._projectsData[0].id;
            $('#gantt-filter-project').val(this._projectFilter);
          }
          await this._loadGanttData();
        } else {
          this._showEmpty();
        }
      } catch (err) {
        console.warn('Load projects failed:', err);
        this._showError();
      }
    },

    async _loadGanttData() {
      if (!this._projectFilter) { this._showEmpty(); return; }
      this._showLoading();
      try {
        const res = await FS.apiCall({ url: FS.API_BASE + `/api/v1/gantt/${this._projectFilter}`, type: 'GET' });
        if (res?.success && res.data) {
          this._tasksData = res.data.tasks || [];
          this._milestonesData = res.data.milestones || [];
          this._linksData = res.data.links || [];
          this._resourcesData = res.data.resources || [];
          this._criticalPath = new Set(res.data.criticalPath || []);
          if (this._tasksData.length > 0) {
            this._showContent();
            this._renderAll();
          } else {
            this._showEmpty();
          }
        } else {
          this._showEmpty();
        }
      } catch (err) {
        console.warn('Gantt API failed:', err);
        this._showError();
      }
    },

    /* ════════════════════════════════════════════════════════
       STATE DISPLAY (Loading / Empty / Error / Content)
       ════════════════════════════════════════════════════════ */
    _showLoading() {
      $('#gantt-loading').show();
      $('#gantt-empty, #gantt-error, #gantt-table, #gantt-resizer, #gantt-timeline').hide();
    },
    _showEmpty() {
      $('#gantt-empty').show();
      $('#gantt-loading, #gantt-error, #gantt-table, #gantt-resizer, #gantt-timeline').hide();
    },
    _showError() {
      $('#gantt-error').show();
      $('#gantt-loading, #gantt-empty, #gantt-table, #gantt-resizer, #gantt-timeline').hide();
    },
    _showContent() {
      $('#gantt-table, #gantt-resizer, #gantt-timeline').show();
      $('#gantt-loading, #gantt-empty, #gantt-error').hide();
    },

    /* ════════════════════════════════════════════════════════
       FILTERS
       ════════════════════════════════════════════════════════ */
    _populateProjectFilter() {
      const $s = $('#gantt-filter-project');
      let html = '<option value="">Chọn dự án...</option>';
      this._projectsData.forEach(p => { html += `<option value="${p.id}">${FS.str.escape(p.name)}</option>`; });
      $s.html(html);
    },

    _getFilteredData() {
      let tasks = this._tasksData.slice();
      const q = this._searchQuery.toLowerCase();
      if (this._statusFilter) tasks = tasks.filter(t => t.status === this._statusFilter);
      if (this._priorityFilter) tasks = tasks.filter(t => t.priority === this._priorityFilter);
      if (this._assigneeFilter) tasks = tasks.filter(t => t.assigneeId === this._assigneeFilter);
      if (q) tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.code && t.code.toLowerCase().includes(q)));
      return tasks;
    },

    /* ════════════════════════════════════════════════════════
       DATE HELPERS
       ════════════════════════════════════════════════════════ */
    _buildDates() {
      const now = new Date(); now.setHours(0,0,0,0);
      const days = ZOOM_DAYS[this._zoom] || 28;
      const offset = ZOOM_OFFSETS[this._zoom] || 7;
      const start = new Date(now);
      start.setDate(start.getDate() - offset + this._scrollOffset);
      const dates = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i); dates.push(d);
      }
      return { now, dates, cellW: ZOOM_CELLS[this._zoom] || 36 };
    },

    _isHoliday(d) {
      const mmdd = String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      return VN_HOLIDAYS.includes(mmdd);
    },

    _formatShort(d) { if (!d) return '—'; const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; },

    _daysBetween(a, b) {
      if (!a || !b) return 0;
      const d1 = new Date(a); d1.setHours(0,0,0,0);
      const d2 = new Date(b); d2.setHours(0,0,0,0);
      return Math.max(0, Math.round((d2 - d1) / 86400000));
    },

    _updateDateRange() {
      const { dates } = this._buildDates();
      if (dates.length > 0) {
        const first = dates[0]; const last = dates[dates.length - 1];
        const fmtOpts = { month: 'short', day: 'numeric' };
        const yearOpts = { month: 'short', day: 'numeric', year: 'numeric' };
        const txt = first.toLocaleDateString('vi-VN', fmtOpts) + ' — ' + last.toLocaleDateString('vi-VN', yearOpts);
        $('#gantt-date-range .gc-date-range-text').text(txt);
      }
    },

    /* ════════════════════════════════════════════════════════
       RENDER ALL
       ════════════════════════════════════════════════════════ */
    _renderAll() {
      this._updateDateRange();
      this._renderTaskTable();
      this._renderTimeline();
      setTimeout(() => this._renderDependencies(), 80);
    },

    /* ── RENDER TASK TABLE (LEFT) ──────────────────────────── */
    _renderTaskTable() {
      const tasks = this._getFilteredData();
      const milestones = this._milestonesData || [];
      let html = '';

      // Project Row
      const project = this._projectsData.find(p => p.id === this._projectFilter);
      if (project) {
        html += `<div class="gc-tr gc-tr-project">
          <div class="gc-td gc-td-task"><i class="bi bi-folder-fill" style="color:var(--fs-accent);font-size:13px"></i> <span class="gc-task-title">${FS.str.escape(project.name)}</span></div>
          <div class="gc-td gc-td-assignee"></div>
          <div class="gc-td gc-td-priority"></div>
          <div class="gc-td gc-td-status"><span style="font-size:10px;color:var(--fs-text-muted)">${tasks.length} tasks</span></div>
          <div class="gc-td gc-td-progress"></div>
          <div class="gc-td gc-td-start"></div>
          <div class="gc-td gc-td-end"></div>
          <div class="gc-td gc-td-duration"></div>
        </div>`;
      }

      // Milestone Rows
      milestones.forEach(m => {
        html += `<div class="gc-tr gc-tr-milestone" data-milestone-id="${m.id}">
          <div class="gc-td gc-td-task" style="padding-left:24px"><i class="bi bi-gem" style="color:var(--gc-milestone);font-size:11px"></i> <span class="gc-task-title" style="font-weight:600">${FS.str.escape(m.name)}</span></div>
          <div class="gc-td gc-td-assignee"></div>
          <div class="gc-td gc-td-priority"></div>
          <div class="gc-td gc-td-status"><span class="gc-status-badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;font-size:9px">MILESTONE</span></div>
          <div class="gc-td gc-td-progress"></div>
          <div class="gc-td gc-td-start">${this._formatShort(m.date)}</div>
          <div class="gc-td gc-td-end"></div>
          <div class="gc-td gc-td-duration">0</div>
        </div>`;
      });

      // Task Rows
      tasks.forEach(task => {
        const aName = task.assigneeName || '—';
        const aInit = (aName !== '—' ? aName.substring(0,2) : '--').toUpperCase();
        const isOverdue = FS.date.isOverdue(task.dueDate) && task.status !== 'done';
        const status = isOverdue ? 'overdue' : task.status;
        const statusLabel = isOverdue ? 'Quá hạn' : (STATUS_LABELS[task.status] || task.status);
        const pClass = PRIORITY_CLASS[task.priority] || 'gc-priority-none';
        const progress = task.progress || (task.status === 'done' ? 100 : 0);
        const dur = this._daysBetween(task.startDate, task.dueDate);
        const isCritical = this._criticalPathEnabled && this._criticalPath.has(task.id);
        const isSelected = this._selectedTaskIds.has(task.id);

        html += `<div class="gc-tr${isSelected ? ' gc-tr-selected' : ''}" data-task-id="${task.id}" ${isCritical ? 'data-critical="true"' : ''}>
          <div class="gc-td gc-td-task" style="padding-left:24px">
            <i class="bi bi-${task.status==='done'?'check-circle-fill':'circle'}" style="font-size:12px;color:${STATUS_COLORS[status]||'var(--fs-text-muted)'}"></i>
            <span class="gc-task-title" style="${task.status==='done'?'text-decoration:line-through;opacity:0.6':''}">${FS.str.escape(task.title)}</span>
          </div>
          <div class="gc-td gc-td-assignee"><div class="gc-avatar" title="${FS.str.escape(aName)}">${aInit}</div></div>
          <div class="gc-td gc-td-priority"><span class="gc-priority-dot ${pClass}" title="${task.priority||'none'}"></span></div>
          <div class="gc-td gc-td-status"><span class="gc-status-badge gc-status-${status}">${statusLabel}</span></div>
          <div class="gc-td gc-td-progress"><div class="gc-progress-mini"><div class="gc-progress-mini-fill" style="width:${progress}%"></div></div></div>
          <div class="gc-td gc-td-start">${this._formatShort(task.startDate)}</div>
          <div class="gc-td gc-td-end">${this._formatShort(task.dueDate)}</div>
          <div class="gc-td gc-td-duration">${dur}</div>
        </div>`;
      });

      $('#gantt-table-body').html(html);
    },

    /* ── RENDER TIMELINE (RIGHT) ───────────────────────────── */
    _renderTimeline() {
      const { now, dates, cellW } = this._buildDates();
      const tasks = this._getFilteredData();
      const milestones = this._milestonesData || [];

      // ── Header (Dual Row: Month + Day) ─────────────────────
      let headerTopHtml = '';
      let headerBotHtml = '';
      let lastMonth = -1;
      let monthSpan = 0;
      let monthLabel = '';

      dates.forEach((d, i) => {
        const m = d.getMonth();
        if (m !== lastMonth) {
          if (lastMonth !== -1) {
            headerTopHtml += `<div class="gc-th-cell gc-th-month" style="width:${monthSpan * cellW}px">${monthLabel}</div>`;
          }
          lastMonth = m;
          monthSpan = 1;
          monthLabel = MONTHS_VI[m] + ' ' + d.getFullYear();
        } else {
          monthSpan++;
        }
        if (i === dates.length - 1) {
          headerTopHtml += `<div class="gc-th-cell gc-th-month" style="width:${monthSpan * cellW}px">${monthLabel}</div>`;
        }

        const isToday = d.getTime() === now.getTime();
        const isWknd = d.getDay() === 0 || d.getDay() === 6;
        let cls = 'gc-th-cell gc-th-day';
        if (isToday) cls += ' gc-th-today';
        if (isWknd) cls += ' gc-th-weekend';

        let lbl = '';
        if (this._zoom === 'day') {
          lbl = `<div style="font-size:9px;line-height:1">${DAYS_VI[d.getDay()]}</div><div>${d.getDate()}</div>`;
        } else if (this._zoom === 'week') {
          lbl = `${d.getDate()}`;
        } else {
          lbl = d.getDate() === 1 ? `${d.getDate()}` : (d.getDate() % 5 === 0 ? `${d.getDate()}` : '');
        }
        headerBotHtml += `<div class="${cls}" style="width:${cellW}px">${lbl}</div>`;
      });

      $('#gantt-timeline-header').html(`<div class="gc-timeline-header-row">${headerTopHtml}</div><div class="gc-timeline-header-row">${headerBotHtml}</div>`);

      // ── Body ──────────────────────────────────────────────
      let bodyHtml = '';

      // Project row
      bodyHtml += this._renderTimelineRow(dates, cellW, now, null, 'gc-trow-project');

      // Milestone rows
      milestones.forEach(ms => {
        let rowCells = '';
        dates.forEach(d => {
          const isToday = d.getTime() === now.getTime();
          const isWknd = d.getDay() === 0 || d.getDay() === 6;
          const isHol = this._isHoliday(d);
          let cls = 'gc-tcell';
          if (isWknd) cls += ' gc-tcell-weekend';
          if (isHol) cls += ' gc-tcell-holiday';
          if (isToday) cls += ' gc-tcell-today';

          let diamond = '';
          const mDate = new Date(ms.date); mDate.setHours(0,0,0,0);
          if (d.getTime() === mDate.getTime()) {
            diamond = `<div class="gc-milestone" data-milestone-id="${ms.id}" title="${FS.str.escape(ms.name)}"></div>`;
          }

          rowCells += `<div class="${cls}" style="width:${cellW}px">${isToday ? '<div class="gc-today-line"></div>' : ''}${diamond}</div>`;
        });
        bodyHtml += `<div class="gc-trow">${rowCells}</div>`;
      });

      // Task rows
      tasks.forEach(task => {
        let rowCells = '';
        const tStart = task.startDate ? new Date(task.startDate) : null;
        const tEnd = task.dueDate ? new Date(task.dueDate) : null;
        if (tStart) tStart.setHours(0,0,0,0);
        if (tEnd) tEnd.setHours(23,59,59,999);

        const isCritical = this._criticalPathEnabled && this._criticalPath.has(task.id);
        const isOverdue = FS.date.isOverdue(task.dueDate) && task.status !== 'done';
        let barColor = STATUS_COLORS[task.status] || '#94a3b8';
        if (isOverdue) barColor = STATUS_COLORS.overdue;
        if (isCritical) barColor = '#dc2626';
        const progress = task.progress || (task.status === 'done' ? 100 : 0);

        dates.forEach(d => {
          const isToday = d.getTime() === now.getTime();
          const isWknd = d.getDay() === 0 || d.getDay() === 6;
          const isHol = this._isHoliday(d);
          let cls = 'gc-tcell';
          if (isWknd) cls += ' gc-tcell-weekend';
          if (isHol) cls += ' gc-tcell-holiday';
          if (isToday) cls += ' gc-tcell-today';

          let barHtml = '';
          if (tStart && tEnd) {
            const dMid = new Date(d); dMid.setHours(12,0,0,0);
            if (dMid >= tStart && dMid <= tEnd) {
              const isFirst = dMid.toDateString() === tStart.toDateString();
              const isLast = dMid.toDateString() === new Date(tEnd.getFullYear(), tEnd.getMonth(), tEnd.getDate()).toDateString();

              let br = '0';
              if (isFirst && isLast) br = '6px';
              else if (isFirst) br = '6px 0 0 6px';
              else if (isLast) br = '0 6px 6px 0';

              barHtml = `<div class="gc-bar-wrapper" style="left:${isFirst?'3px':'0'}; right:${isLast?'3px':'0'}">
                ${isFirst ? `<div class="gc-handle gc-handle-l" data-task-id="${task.id}"></div>` : ''}
                <div class="gc-bar${isCritical?' gc-bar-critical':''}" data-task-id="${task.id}" style="background:${barColor};border-radius:${br}" title="${FS.str.escape(task.title)} — ${progress}%">
                  <div class="gc-bar-progress" style="width:${progress}%"></div>
                  <div class="gc-bar-progress-knob" data-task-id="${task.id}" style="left:${progress}%" title="Tiến độ: ${progress}%"></div>
                  ${isFirst ? `<span class="gc-bar-label">${progress > 0 ? progress + '%' : ''}</span>` : ''}
                </div>
                ${isLast ? `<div class="gc-handle gc-handle-r" data-task-id="${task.id}"></div>` : ''}
              </div>`;
            }
          }

          rowCells += `<div class="${cls}" style="width:${cellW}px">${isToday ? '<div class="gc-today-line"></div>' : ''}${barHtml}</div>`;
        });
        bodyHtml += `<div class="gc-trow" data-task-id="${task.id}">${rowCells}</div>`;
      });

      $('#gantt-timeline-body').html(bodyHtml);

      // Scroll to today
      const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());
      if (todayIdx > 0 && this._scrollOffset === 0) {
        setTimeout(() => {
          const $tl = $('#gantt-timeline');
          $tl.scrollLeft(Math.max(0, (todayIdx - 3) * cellW));
        }, 20);
      }
    },

    _renderTimelineRow(dates, cellW, now, content, extraCls) {
      let cells = '';
      dates.forEach(d => {
        const isToday = d.getTime() === now.getTime();
        const isWknd = d.getDay() === 0 || d.getDay() === 6;
        let cls = 'gc-tcell';
        if (isWknd) cls += ' gc-tcell-weekend';
        if (isToday) cls += ' gc-tcell-today';
        cells += `<div class="${cls}" style="width:${cellW}px">${isToday ? '<div class="gc-today-line"></div>' : ''}${content || ''}</div>`;
      });
      return `<div class="gc-trow ${extraCls || ''}">${cells}</div>`;
    },

    /* ── RENDER DEPENDENCIES (SVG) ────────────────────────── */
    _renderDependencies() {
      const svg = document.getElementById('gantt-svg-layer');
      const container = document.getElementById('gantt-timeline');
      if (!svg || !container) return;
      svg.innerHTML = '';

      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      const headerH = 48;

      this._linksData.forEach(link => {
        const srcEls = container.querySelectorAll(`.gc-bar[data-task-id="${link.source}"]`);
        const tgtEls = container.querySelectorAll(`.gc-bar[data-task-id="${link.target}"]`);
        if (!srcEls.length || !tgtEls.length) return;

        const srcR = srcEls[0].getBoundingClientRect();
        const tgtR = tgtEls[0].getBoundingClientRect();
        if (srcR.width === 0 || tgtR.width === 0) return;

        const isCritical = this._criticalPathEnabled && this._criticalPath.has(link.source) && this._criticalPath.has(link.target);
        const color = isCritical ? '#ef4444' : '#94a3b8';
        const sw = isCritical ? 2.5 : 1.5;

        let sx = srcR.right - containerRect.left + scrollLeft;
        let sy = srcR.top - containerRect.top + scrollTop + srcR.height/2 - headerH;
        let tx = tgtR.left - containerRect.left + scrollLeft;
        let ty = tgtR.top - containerRect.top + scrollTop + tgtR.height/2 - headerH;

        if (link.type === 'StartToStart') sx = srcR.left - containerRect.left + scrollLeft;
        else if (link.type === 'FinishToFinish') tx = tgtR.right - containerRect.left + scrollLeft;
        else if (link.type === 'StartToFinish') { sx = srcR.left - containerRect.left + scrollLeft; tx = tgtR.right - containerRect.left + scrollLeft; }

        let d = `M ${sx} ${sy}`;
        if (tx > sx + 15) {
          d += ` L ${sx+10} ${sy} L ${sx+10} ${ty} L ${tx} ${ty}`;
        } else {
          d += ` L ${sx+10} ${sy} L ${sx+10} ${sy+15} L ${tx-10} ${sy+15} L ${tx-10} ${ty} L ${tx} ${ty}`;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d); path.setAttribute("fill", "transparent");
        path.setAttribute("stroke", color); path.setAttribute("stroke-width", sw);
        svg.appendChild(path);

        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        let pts = `${tx-5},${ty-4} ${tx},${ty} ${tx-5},${ty+4}`;
        if (link.type === 'FinishToFinish' || link.type === 'StartToFinish')
          pts = `${tx+5},${ty-4} ${tx},${ty} ${tx+5},${ty+4}`;
        arrow.setAttribute("points", pts); arrow.setAttribute("fill", color);
        svg.appendChild(arrow);
      });
    },

    /* ── MILESTONE MODAL ──────────────────────────────────── */
    _openMilestoneModal(milestone = null) {
      $('#gantt-milestone-id').val(milestone ? milestone.id : '');
      $('#gantt-milestone-name').val(milestone ? milestone.name : '');
      $('#gantt-milestone-date').val(milestone ? milestone.date.substring(0,10) : new Date().toISOString().substring(0,10));
      const users = FS.users || [];
      let uh = '<option value="">Chọn...</option>';
      users.forEach(u => { uh += `<option value="${u.id}" ${milestone && milestone.ownerId === u.id ? 'selected' : ''}>${FS.str.escape(u.name)}</option>`; });
      $('#gantt-milestone-owner').html(uh);
      $('#gantt-milestone-btn-delete').toggle(!!milestone);
      $('#gantt-milestone-modal-title').text(milestone ? 'Chỉnh Sửa Cột Mốc' : 'Thêm Cột Mốc');
      const el = document.getElementById('gantt-milestone-modal');
      if (el) new bootstrap.Modal(el).show();
    },

    /* ════════════════════════════════════════════════════════
       SIGNALR (kept from previous implementation)
       ════════════════════════════════════════════════════════ */
    async _initSignalR() {
      try {
        const session = FS.auth?.getSession ? FS.auth.getSession() : null;
        const token = session?.token || localStorage.getItem('fs_auth_token') || '';
        if (!token || typeof signalR === 'undefined') return;
        this._connection = new signalR.HubConnectionBuilder()
          .withUrl(FS.API_BASE + '/hubs/gantt?access_token=' + encodeURIComponent(token))
          .withAutomaticReconnect().build();
        this._connection.on('TaskScheduleUpdated', p => this._onTaskScheduleUpdated(p));
        this._connection.on('DependencyChanged', p => this._onDependencyChanged(p));
        this._connection.on('MilestoneChanged', p => this._onMilestoneChanged(p));
        this._connection.onreconnected(async () => {
          if (this._projectFilter && this._connection.state === 'Connected')
            await this._connection.invoke('JoinProject', this._projectFilter);
        });
        await this._connection.start();
        if (this._projectFilter) await this._connection.invoke('JoinProject', this._projectFilter);
      } catch (e) { console.warn('Gantt SignalR init failed:', e); }
    },

    async _switchSignalRProject(old, nw) {
      if (!this._connection || this._connection.state !== 'Connected') return;
      try { if (old) await this._connection.invoke('LeaveProject', old); if (nw) await this._connection.invoke('JoinProject', nw); } catch(e){}
    },

    _getCurrentUserId() { const s = FS.auth?.getSession ? FS.auth.getSession() : null; return s?.user?.id || ''; },

    _onTaskScheduleUpdated(p) {
      if (p.changedBy && this._getCurrentUserId() && p.changedBy.toLowerCase() === this._getCurrentUserId().toLowerCase()) return;
      const t = this._tasksData.find(x => x.id === p.taskId);
      if (t) { if (p.newStartDate) t.startDate = p.newStartDate; if (p.newDueDate) t.dueDate = p.newDueDate; }
      if (p.affectedTaskIds?.length > 1) this._loadGanttData(); else this._renderAll();
      if (typeof FS.toast === 'function') FS.toast('Lịch trình vừa được cập nhật realtime!', 'info');
    },
    _onDependencyChanged(p) {
      if (p.changedBy && this._getCurrentUserId() && p.changedBy.toLowerCase() === this._getCurrentUserId().toLowerCase()) return;
      this._loadGanttData();
    },
    _onMilestoneChanged(p) {
      if (p.changedBy && this._getCurrentUserId() && p.changedBy.toLowerCase() === this._getCurrentUserId().toLowerCase()) return;
      if (p.action === 'create' && p.milestone) this._milestonesData.push(p.milestone);
      else if (p.action === 'update' && p.milestone) { const i = this._milestonesData.findIndex(m => m.id === p.milestone.id); if (i !== -1) this._milestonesData[i] = p.milestone; }
      else if (p.action === 'delete' && p.milestoneId) this._milestonesData = this._milestonesData.filter(m => m.id !== p.milestoneId);
      else { this._loadGanttData(); return; }
      this._renderAll();
    },

    /* ════════════════════════════════════════════════════════
       EVENTS
       ════════════════════════════════════════════════════════ */
    _bindEvents() {
      const self = this;

      // ── Filters ───────────────────────────────────────
      $('#gantt-filter-project').off('change').on('change', async function() {
        const old = self._projectFilter; self._projectFilter = this.value;
        await self._switchSignalRProject(old, self._projectFilter);
        await self._loadGanttData();
      });
      $('#gantt-filter-status').off('change').on('change', function() { self._statusFilter = this.value; self._renderAll(); });
      $('#gantt-filter-priority').off('change').on('change', function() { self._priorityFilter = this.value; self._renderAll(); });
      $('#gantt-filter-assignee').off('change').on('change', function() { self._assigneeFilter = this.value; self._renderAll(); });
      $('#gantt-search').off('input').on('input', function() {
        self._searchQuery = this.value;
        clearTimeout(self._searchTimeout);
        self._searchTimeout = setTimeout(() => self._renderAll(), 250);
      });

      // ── Zoom ──────────────────────────────────────────
      $(document).off('click.gantt-zoom').on('click.gantt-zoom', '.gc-zoom-btn', function() {
        $('.gc-zoom-btn').removeClass('active').attr('aria-checked','false');
        $(this).addClass('active').attr('aria-checked','true');
        self._zoom = $(this).data('zoom');
        self._scrollOffset = 0;
        self._renderAll();
      });

      // ── Navigation ────────────────────────────────────
      $('#gantt-btn-today').off('click').on('click', () => { self._scrollOffset = 0; self._renderAll(); });
      $('#gantt-btn-prev').off('click').on('click', () => { self._scrollOffset -= 7; self._renderAll(); });
      $('#gantt-btn-next').off('click').on('click', () => { self._scrollOffset += 7; self._renderAll(); });

      // ── Toggles ───────────────────────────────────────
      $('#gantt-toggle-critical').off('change').on('change', function() { self._criticalPathEnabled = this.checked; self._renderAll(); });
      $('#gantt-toggle-baseline').off('change').on('change', function() { self._baselineEnabled = this.checked; self._renderAll(); });

      // ── Actions ───────────────────────────────────────
      $('#gantt-btn-add-milestone').off('click').on('click', () => {
        if (!self._projectFilter) { if (typeof FS.toast === 'function') FS.toast('Vui lòng chọn dự án!', 'warning'); return; }
        self._openMilestoneModal();
      });
      $('#gantt-btn-fullscreen').off('click').on('click', () => {
        const el = document.getElementById('gantt-page');
        if (!document.fullscreenElement) el.requestFullscreen().catch(()=>{});
        else document.exitFullscreen();
      });
      $('#gantt-btn-refresh').off('click').on('click', () => self._loadGanttData());
      $('#gantt-btn-retry').off('click').on('click', () => self._loadGanttData());

      // ── Milestone Modal ───────────────────────────────
      $(document).off('click.gantt-ms-click').on('click.gantt-ms-click', '.gc-milestone', function(e) {
        e.stopPropagation();
        const m = self._milestonesData.find(x => x.id === $(this).data('milestone-id'));
        if (m) self._openMilestoneModal(m);
      });
      $('#gantt-milestone-btn-save').off('click').on('click', async () => {
        const id = $('#gantt-milestone-id').val(), name = $('#gantt-milestone-name').val().trim(), date = $('#gantt-milestone-date').val(), ownerId = $('#gantt-milestone-owner').val() || null;
        if (!name || !date) { if (typeof FS.toast === 'function') FS.toast('Vui lòng nhập đủ tên và ngày!', 'warning'); return; }
        try {
          if (id) {
            await FS.apiCall({ url: FS.API_BASE + `/api/v1/gantt/milestones/${id}`, type: 'PUT', data: JSON.stringify(date), contentType: 'application/json' });
            const m = self._milestonesData.find(x => x.id === id); if (m) { m.name = name; m.date = date; m.ownerId = ownerId; }
          } else {
            const res = await FS.apiCall({ url: FS.API_BASE + '/api/v1/gantt/milestones', type: 'POST', data: JSON.stringify({ name, date: new Date(date).toISOString(), ownerId, projectId: self._projectFilter }), contentType: 'application/json' });
            if (res?.success && res.data) self._milestonesData.push(res.data);
          }
          bootstrap.Modal.getInstance(document.getElementById('gantt-milestone-modal'))?.hide();
          self._renderAll();
          if (typeof FS.toast === 'function') FS.toast(id ? 'Cập nhật cột mốc!' : 'Tạo cột mốc mới!', 'success');
        } catch(e) { if (typeof FS.toast === 'function') FS.toast('Lỗi lưu cột mốc!', 'error'); }
      });
      $('#gantt-milestone-btn-delete').off('click').on('click', async () => {
        const id = $('#gantt-milestone-id').val(); if (!id || !confirm('Xóa cột mốc này?')) return;
        try {
          await FS.apiCall({ url: FS.API_BASE + `/api/v1/gantt/milestones/${id}`, type: 'DELETE' });
          self._milestonesData = self._milestonesData.filter(m => m.id !== id);
          bootstrap.Modal.getInstance(document.getElementById('gantt-milestone-modal'))?.hide();
          self._renderAll(); if (typeof FS.toast === 'function') FS.toast('Đã xóa cột mốc!', 'success');
        } catch(e) { if (typeof FS.toast === 'function') FS.toast('Lỗi xóa!', 'error'); }
      });

      // ── Task Row Click ────────────────────────────────
      $(document).off('click.gantt-row').on('click.gantt-row', '.gc-tr[data-task-id]', function(e) {
        if (isDragging) return;
        const tid = $(this).data('task-id');
        if (e.ctrlKey || e.metaKey) {
          if (self._selectedTaskIds.has(tid)) self._selectedTaskIds.delete(tid); else self._selectedTaskIds.add(tid);
          self._renderAll();
        } else {
          if (tid && FS.taskDetail) FS.taskDetail.open(tid);
        }
      });

      // ── Context Menu ──────────────────────────────────
      $(document).off('contextmenu.gantt').on('contextmenu.gantt', '.gc-tr[data-task-id], .gc-bar[data-task-id]', function(e) {
        e.preventDefault();
        self._contextTaskId = $(this).data('task-id');
        const $menu = $('#gantt-context-menu');
        $menu.css({ left: e.clientX, top: e.clientY, display: 'block' }).attr('aria-hidden', 'false');
      });
      $(document).off('click.gantt-ctx-close').on('click.gantt-ctx-close', function() {
        $('#gantt-context-menu').hide().attr('aria-hidden', 'true');
      });
      $(document).off('click.gantt-ctx-action').on('click.gantt-ctx-action', '.gc-ctx-item', function() {
        const action = $(this).data('action');
        if (!self._contextTaskId) return;
        if (action === 'detail' && FS.taskDetail) FS.taskDetail.open(self._contextTaskId);
        else if (action === 'delete') { if (confirm('Xóa công việc?')) console.log('Delete task', self._contextTaskId); }
        self._contextTaskId = null;
      });

      // ── Sync Scroll ───────────────────────────────────
      const $table = $('#gantt-table-body');
      const $timeline = $('#gantt-timeline');
      $timeline.off('scroll.gantt-sync').on('scroll.gantt-sync', function() {
        $table.scrollTop($(this).scrollTop());
        self._renderDependencies();
      });
      $(window).off('resize.gantt').on('resize.gantt', () => self._renderDependencies());

      // ── Resizer ───────────────────────────────────────
      let isResizing = false;
      const $resizer = $('#gantt-resizer');
      const $gcTable = $('#gantt-table');
      $resizer.off('mousedown.gantt-resize').on('mousedown.gantt-resize', function(e) {
        isResizing = true; $resizer.addClass('gc-resizing'); e.preventDefault();
      });
      $(document).off('mousemove.gantt-resize').on('mousemove.gantt-resize', function(e) {
        if (!isResizing) return;
        const bodyLeft = $('#gantt-body').offset().left;
        let newW = e.clientX - bodyLeft;
        newW = Math.max(320, Math.min(700, newW));
        $gcTable.css('width', newW + 'px');
        self._tableWidth = newW;
      });
      $(document).off('mouseup.gantt-resize').on('mouseup.gantt-resize', function() {
        if (isResizing) { isResizing = false; $resizer.removeClass('gc-resizing'); }
      });

      // ── Keyboard ──────────────────────────────────────
      $(document).off('keydown.gantt-keys').on('keydown.gantt-keys', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 't' || e.key === 'T') { self._scrollOffset = 0; self._renderAll(); }
        else if (e.key === 'r' || e.key === 'R') self._loadGanttData();
        else if (e.key === 'f' || e.key === 'F') $('#gantt-btn-fullscreen').click();
        else if (e.key === 'ArrowLeft') { self._scrollOffset -= 3; self._renderAll(); }
        else if (e.key === 'ArrowRight') { self._scrollOffset += 3; self._renderAll(); }
        else if (e.key === '1') { $('.gc-zoom-btn[data-zoom="day"]').click(); }
        else if (e.key === '2') { $('.gc-zoom-btn[data-zoom="week"]').click(); }
        else if (e.key === '3') { $('.gc-zoom-btn[data-zoom="month"]').click(); }
        else if (e.key === '4') { $('.gc-zoom-btn[data-zoom="quarter"]').click(); }
        else if (e.key === '5') { $('.gc-zoom-btn[data-zoom="year"]').click(); }
        else if (e.key === 'Escape') { self._selectedTaskIds.clear(); self._renderAll(); }
        else if (e.key === '?') { new bootstrap.Modal(document.getElementById('gantt-shortcuts-modal')).show(); }
      });

      // ── Legend shortcuts link ────────────────────────
      $(document).off('click.gantt-legend-shortcut').on('click.gantt-legend-shortcut', '.gc-legend-shortcut', function() {
        new bootstrap.Modal(document.getElementById('gantt-shortcuts-modal')).show();
      });

      // ═══════════════════════════════════════════════════
      // DRAG & DROP (Move, Resize, Progress, Milestone)
      // ═══════════════════════════════════════════════════
      let isDragging = false;
      let dragMode = 'move';
      let startX = 0;
      let currentTask = null;
      let currentMilestone = null;
      let originalStart = null;
      let originalEnd = null;
      let originalMilestoneDate = null;
      let originalProgress = 0;

      $(document).off('mousedown.gantt-drag')
        .on('mousedown.gantt-drag', '.gc-handle-l, .gc-handle-r, .gc-bar-progress-knob, .gc-bar, .gc-milestone', function(e) {
          e.stopPropagation();
          isDragging = true;
          startX = e.clientX;
          const $el = $(this);
          if ($el.hasClass('gc-handle-l')) { dragMode = 'resize-left'; currentTask = self._tasksData.find(t => t.id === $el.data('task-id')); }
          else if ($el.hasClass('gc-handle-r')) { dragMode = 'resize-right'; currentTask = self._tasksData.find(t => t.id === $el.data('task-id')); }
          else if ($el.hasClass('gc-bar-progress-knob')) { dragMode = 'progress'; currentTask = self._tasksData.find(t => t.id === $el.data('task-id')); if (currentTask) originalProgress = currentTask.progress || 0; }
          else if ($el.hasClass('gc-milestone')) { dragMode = 'milestone'; currentMilestone = self._milestonesData.find(m => m.id === $el.data('milestone-id')); if (currentMilestone) originalMilestoneDate = new Date(currentMilestone.date); }
          else { dragMode = 'move'; currentTask = self._tasksData.find(t => t.id === $el.data('task-id')); }
          if (currentTask && currentTask.startDate && currentTask.dueDate) { originalStart = new Date(currentTask.startDate); originalEnd = new Date(currentTask.dueDate); }
        });

      $(document).off('mousemove.gantt-drag').on('mousemove.gantt-drag', function(e) {
        if (!isDragging) return;
        const cellW = ZOOM_CELLS[self._zoom] || 36;
        const deltaX = e.clientX - startX;

        if (dragMode === 'progress' && currentTask) {
          const barEl = document.querySelector(`.gc-bar[data-task-id="${currentTask.id}"]`);
          if (barEl) {
            const bw = barEl.getBoundingClientRect().width || 100;
            currentTask.progress = Math.min(100, Math.max(0, Math.round((originalProgress + (deltaX / bw) * 100) / 5) * 5));
            self._renderAll();
          }
          return;
        }

        const shift = Math.round(deltaX / cellW);
        if (shift === 0) return;

        if (dragMode === 'milestone' && currentMilestone && originalMilestoneDate) {
          const nd = new Date(originalMilestoneDate); nd.setDate(nd.getDate() + shift);
          currentMilestone.date = nd.toISOString(); self._renderAll(); return;
        }
        if (!currentTask || !originalStart || !originalEnd) return;

        if (dragMode === 'move') {
          const ns = new Date(originalStart); ns.setDate(ns.getDate() + shift);
          const ne = new Date(originalEnd); ne.setDate(ne.getDate() + shift);
          currentTask.startDate = ns.toISOString(); currentTask.dueDate = ne.toISOString();
        } else if (dragMode === 'resize-left') {
          const ns = new Date(originalStart); ns.setDate(ns.getDate() + shift);
          const max = new Date(originalEnd); max.setDate(max.getDate() - 1);
          if (ns <= max) currentTask.startDate = ns.toISOString();
        } else if (dragMode === 'resize-right') {
          const ne = new Date(originalEnd); ne.setDate(ne.getDate() + shift);
          const min = new Date(originalStart); min.setDate(min.getDate() + 1);
          if (ne >= min) currentTask.dueDate = ne.toISOString();
        }
        self._renderAll();
      });

      $(document).off('mouseup.gantt-drag').on('mouseup.gantt-drag', function() {
        if (!isDragging) return;
        isDragging = false;

        if (dragMode === 'progress' && currentTask) {
          const bp = originalProgress;
          FS.apiCall({ url: FS.API_BASE + '/api/v1/gantt/tasks/' + currentTask.id + '/reschedule', type: 'PATCH', data: { startDate: currentTask.startDate, dueDate: currentTask.dueDate, progress: currentTask.progress } })
            .then(r => { if (!r?.success) throw new Error(); if (typeof FS.toast === 'function') FS.toast(`Tiến độ ${currentTask.progress}%`, 'success'); })
            .catch(() => { currentTask.progress = bp; self._renderAll(); if (typeof FS.toast === 'function') FS.toast('Lỗi cập nhật tiến độ!', 'error'); });
        } else if (dragMode === 'milestone' && currentMilestone) {
          FS.apiCall({ url: FS.API_BASE + '/api/v1/gantt/milestones/' + currentMilestone.id, type: 'PUT', data: JSON.stringify(currentMilestone.date), contentType: 'application/json' })
            .catch(() => { if (originalMilestoneDate) currentMilestone.date = originalMilestoneDate.toISOString(); self._renderAll(); if (typeof FS.toast === 'function') FS.toast('Lỗi cập nhật milestone!', 'error'); });
        } else if (currentTask && originalStart && originalEnd) {
          const bs = originalStart.toISOString(), be = originalEnd.toISOString();
          const src = dragMode === 'resize-left' ? 'resize_start' : (dragMode === 'resize-right' ? 'resize_end' : 'drag');
          FS.apiCall({ url: FS.API_BASE + '/api/v1/gantt/tasks/' + currentTask.id + '/schedule', type: 'PATCH', data: { taskId: currentTask.id, newStartDate: currentTask.startDate, newDueDate: currentTask.dueDate, source: src } })
            .then(r => { if (!r?.success) throw new Error(r?.message); if (r.data?.affectedTaskIds?.length > 1) self._loadGanttData(); })
            .catch(err => { currentTask.startDate = bs; currentTask.dueDate = be; self._renderAll(); if (typeof FS.toast === 'function') FS.toast(err.responseJSON?.message || 'Lỗi dời lịch!', 'error'); });
        }
        currentTask = null; currentMilestone = null; originalStart = null; originalEnd = null; originalMilestoneDate = null;
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);