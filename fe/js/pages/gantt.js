/**
 * FlowSpace — Gantt Chart Module (SaaS Enterprise Edition)
 */
(function (FS, $) {
  'use strict';

  const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#f97316'];
  const STATUS_COLORS = {
    todo: '#94a3b8', active: '#3b82f6', done: '#10b981', overdue: '#ef4444'
  };

  FS.pages.gantt = {
    _zoom: 'week', // 'day' | 'week' | 'month' | 'quarter'
    _projectFilter: '',
    _statusFilter: '',
    _searchQuery: '',
    _tasksData: [],
    _projectsData: [],
    _criticalPath: new Set(),
    _searchTimeout: null,

    async init() {
      // 1. Render immediately from local seed data for zero-latency feel
      this._tasksData = FS.db.get('tasks') || [];
      this._projectsData = FS.db.get('projects') || [];
      
      this._populateFilters();
      this._render();
      this._bindEvents();

      // 2. Fetch live data from backend api
      await this._loadData();
    },

    async _loadData() {
      try {
        try {
          await FS.loadUsersCache();
        } catch (e) {
          console.warn('loadUsersCache failed:', e);
        }

        const [tasksRes, projsRes] = await Promise.all([
          FS.apiCall({ url: FS.API_BASE + '/api/v1/tasks', type: 'GET' }),
          FS.apiCall({ url: FS.API_BASE + '/api/v1/projects', type: 'GET' })
        ]);

        if (tasksRes?.success && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
          const apiTasks = tasksRes.data.map(t => ({
            id: t.id,
            code: t.code,
            title: t.title,
            description: t.description || '',
            projectId: t.projectId,
            assigneeId: t.assigneeId,
            assigneeName: t.assigneeName || '',
            status: (t.status || 'todo').toLowerCase(),
            priority: (t.priority || 'medium').toLowerCase(),
            startDate: t.startDate,
            dueDate: t.dueDate,
            estimatedHours: t.estimatedHours || 0,
            loggedHours: t.loggedHours || 0,
            dependsOn: t.dependsOn || []
          }));
          const mergedMap = new Map();
          (FS.db.get('tasks') || []).forEach(s => mergedMap.set(s.id, s));
          apiTasks.forEach(a => mergedMap.set(a.id, a));
          this._tasksData = Array.from(mergedMap.values());
        } else if (!this._tasksData.length) {
          this._tasksData = FS.db.get('tasks') || [];
        }

        if (projsRes?.success && Array.isArray(projsRes.data) && projsRes.data.length > 0) {
          this._projectsData = projsRes.data;
        } else if (!this._projectsData.length) {
          this._projectsData = FS.db.get('projects') || [];
        }

      } catch (err) {
        console.warn('Gantt API load failed:', err);
      } finally {
        this._populateFilters();
        this._render();
      }
    },

    _calculateCriticalPath(tasks) {
      const adj = {};
      const duration = {};
      const inDegree = {};
      
      tasks.forEach(t => {
        adj[t.id] = [];
        inDegree[t.id] = 0;
        let d = 0;
        if (t.startDate && t.dueDate) {
          d = Math.max(1, Math.ceil((new Date(t.dueDate) - new Date(t.startDate)) / (1000*60*60*24)));
        }
        duration[t.id] = d;
      });
      
      tasks.forEach(t => {
        if (t.dependsOn && t.dependsOn.length > 0) {
          t.dependsOn.forEach(dep => {
            if (adj[dep]) {
              adj[dep].push(t.id);
              inDegree[t.id] = (inDegree[t.id] || 0) + 1;
            }
          });
        }
      });
      
      const earlyFinish = {};
      const earlyStart = {};
      tasks.forEach(t => { earlyFinish[t.id] = 0; earlyStart[t.id] = 0; });
      
      const q = [];
      tasks.forEach(t => { if (inDegree[t.id] === 0) q.push(t.id); });
      
      const topoOrder = [];
      while(q.length > 0) {
        const u = q.shift();
        topoOrder.push(u);
        earlyFinish[u] = earlyStart[u] + duration[u];
        
        adj[u].forEach(v => {
          earlyStart[v] = Math.max(earlyStart[v], earlyFinish[u]);
          inDegree[v]--;
          if (inDegree[v] === 0) q.push(v);
        });
      }
      
      let maxEF = 0;
      tasks.forEach(t => { if (earlyFinish[t.id] > maxEF) maxEF = earlyFinish[t.id]; });
      
      const lateFinish = {};
      const lateStart = {};
      tasks.forEach(t => { lateFinish[t.id] = maxEF; lateStart[t.id] = maxEF; });
      
      for (let i = topoOrder.length - 1; i >= 0; i--) {
        const u = topoOrder[i];
        if (adj[u].length === 0) {
          lateFinish[u] = maxEF;
        } else {
          let minLS = maxEF;
          adj[u].forEach(v => { if (lateStart[v] < minLS) minLS = lateStart[v]; });
          lateFinish[u] = minLS;
        }
        lateStart[u] = lateFinish[u] - duration[u];
      }
      
      const criticalSet = new Set();
      tasks.forEach(t => {
        if (earlyStart[t.id] === lateStart[t.id] && duration[t.id] > 0) {
          criticalSet.add(t.id);
        }
      });
      
      return criticalSet;
    },

    _drawDependencyLines() {
      const svg = document.getElementById('gantt-svg-layer');
      const container = document.getElementById('gantt-timeline-container');
      if (!svg || !container) return;
      svg.innerHTML = '';
      
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      
      const tasks = this._tasksData;
      const criticalSet = this._criticalPath;
      const headerHeight = 56;
      
      tasks.forEach(task => {
        if (task.dependsOn && task.dependsOn.length > 0) {
          const targetEls = document.querySelectorAll(`.g-task-bar[data-task-id="${task.id}"]`);
          if (!targetEls.length) return;
          const targetEl = targetEls[0];
          const targetRect = targetEl.getBoundingClientRect();
          
          if (targetRect.top === 0) return; // not rendered or hidden
          
          const targetX = targetRect.left - containerRect.left + scrollLeft;
          const targetY = targetRect.top - containerRect.top + scrollTop + (targetRect.height / 2) - headerHeight;
          
          task.dependsOn.forEach(depId => {
            const sourceEls = document.querySelectorAll(`.g-task-bar[data-task-id="${depId}"]`);
            if (!sourceEls.length) return;
            const sourceEl = sourceEls[sourceEls.length - 1];
            const sourceRect = sourceEl.getBoundingClientRect();
            
            if (sourceRect.top === 0) return;
            
            const sourceX = sourceRect.right - containerRect.left + scrollLeft;
            const sourceY = sourceRect.top - containerRect.top + scrollTop + (sourceRect.height / 2) - headerHeight;
            
            const isCritical = criticalSet.has(task.id) && criticalSet.has(depId);
            const color = isCritical ? '#ef4444' : '#cbd5e1';
            const strokeWidth = isCritical ? 2 : 1.5;
            
            let pathD = `M ${sourceX} ${sourceY}`;
            if (targetX > sourceX + 15) {
              pathD += ` L ${sourceX + 10} ${sourceY} L ${sourceX + 10} ${targetY} L ${targetX} ${targetY}`;
            } else {
              pathD += ` L ${sourceX + 10} ${sourceY} L ${sourceX + 10} ${sourceY + 15} L ${targetX - 10} ${sourceY + 15} L ${targetX - 10} ${targetY} L ${targetX} ${targetY}`;
            }
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("fill", "transparent");
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", strokeWidth);
            if (!isCritical) path.setAttribute("stroke-dasharray", "4 4");
            
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            arrow.setAttribute("points", `${targetX-5},${targetY-4} ${targetX},${targetY} ${targetX-5},${targetY+4}`);
            arrow.setAttribute("fill", color);
            
            svg.appendChild(path);
            svg.appendChild(arrow);
          });
        }
      });
    },

    _populateFilters() {
      const projects = this._projectsData || [];
      const filterHtml = '<option value="">Tất cả dự án</option>' +
        projects.map(p => `<option value="${p.id}">${FS.str.escape(p.name)}</option>`).join('');
      const $proj = $('#gantt-filter-project');
      if ($proj.html() !== filterHtml) {
        $proj.html(filterHtml);
      }
    },

    _updateKPIs(filteredTasks, filteredProjects) {
      $('#gantt-stat-projects').text(filteredProjects.length);
      $('#gantt-stat-tasks').text(filteredTasks.length);
      const activeCount = filteredTasks.filter(t => t.status === 'active').length;
      $('#gantt-stat-active').text(activeCount);
      const overdueCount = filteredTasks.filter(t => FS.date.isOverdue(t.dueDate) && t.status !== 'done').length;
      $('#gantt-stat-overdue').text(overdueCount);
    },

    _render() {
      const now = new Date();
      now.setHours(0,0,0,0);
      
      let projects = this._projectsData || [];
      let tasks = this._tasksData || [];

      // Filter Projects
      if (this._projectFilter) {
        projects = projects.filter(p => p.id === this._projectFilter);
      }

      // Filter Tasks
      const q = this._searchQuery.toLowerCase();
      const statusF = this._statusFilter;
      tasks = tasks.filter(t => {
        let match = true;
        if (this._projectFilter && t.projectId !== this._projectFilter) match = false;
        if (statusF && t.status !== statusF) match = false;
        if (q && !t.title.toLowerCase().includes(q) && !(t.code && t.code.toLowerCase().includes(q))) match = false;
        return match;
      });

      this._updateKPIs(tasks, projects);
      this._criticalPath = this._calculateCriticalPath(tasks);

      // Setup Dates Array based on Zoom
      let days = 28;
      let startOffset = 7;
      let cellWidth = 36;
      
      if (this._zoom === 'day') { days = 14; startOffset = 3; cellWidth = 60; }
      if (this._zoom === 'month') { days = 90; startOffset = 15; cellWidth = 24; }
      if (this._zoom === 'quarter') { days = 180; startOffset = 30; cellWidth = 16; }
      
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startOffset);
      const dates = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d);
      }

      const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];
      const monthNames = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

      // Render Header
      let headerHtml = '';
      dates.forEach(d => {
        const isToday = d.getTime() === now.getTime();
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        let topLbl = '', botLbl = '';
        if (this._zoom === 'day' || this._zoom === 'week') {
          topLbl = dayNames[d.getDay()];
          botLbl = d.getDate();
        } else {
          const isFirst = d.getDate() === 1;
          topLbl = isFirst ? `T${d.getMonth()+1}` : '';
          botLbl = d.getDate();
        }
        
        headerHtml += `<div class="g-t-header-cell${isToday?' today':''}${isWeekend?' weekend':''}" style="width:${cellWidth}px">
          <div class="top-lbl" style="color:${topLbl.startsWith('T')?'var(--fs-accent)':''}">${topLbl}</div>
          <div class="bot-lbl">${botLbl}</div>
        </div>`;
      });
      $('#gantt-timeline-header').html(headerHtml);

      // Render Body (Sidebar + Timeline)
      let sidebarHtml = '';
      let timelineHtml = '';
      let colorIdx = 0;

      projects.forEach(project => {
        const projTasks = tasks.filter(t => t.projectId === project.id);
        if (projTasks.length === 0 && (this._searchQuery || this._statusFilter)) return; // hide empty projects when searching
        
        const color = STATUS_COLORS[project.status] || COLORS[colorIdx++ % COLORS.length];
        
        // Sidebar Row for Project
        sidebarHtml += `<div class="g-row g-row-project">
          <div class="g-col-name">
            <i class="bi bi-folder-fill" style="color:${color}"></i>
            <span class="title">${FS.str.escape(project.name)}</span>
          </div>
          <div class="g-col-assignee"></div>
          <div class="g-col-status"></div>
        </div>`;

        // Timeline Row for Project
        let projTimelineHtml = '';
        dates.forEach(d => {
          const isToday = d.getTime() === now.getTime();
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          
          let barHtml = '';
          const pStart = project.startDate ? new Date(project.startDate) : null;
          const pEnd = project.endDate ? new Date(project.endDate) : null;
          
          if (pStart && pEnd) {
            pStart.setHours(0,0,0,0); pEnd.setHours(23,59,59,999);
            const dMid = new Date(d); dMid.setHours(12,0,0,0);
            if (dMid >= pStart && dMid <= pEnd) {
              const isFirst = dMid.toDateString() === pStart.toDateString();
              const isLast = dMid.toDateString() === new Date(pEnd.getFullYear(), pEnd.getMonth(), pEnd.getDate()).toDateString();
              barHtml = `<div class="g-project-bar" style="left:${isFirst?'8px':'0'}; right:${isLast?'8px':'0'}"></div>`;
            }
          }
          
          projTimelineHtml += `<div class="g-t-cell${isToday?' today':''}${isWeekend?' weekend':''}" style="width:${cellWidth}px">
            ${isToday ? '<div class="g-today-line"></div>' : ''}
            ${barHtml}
          </div>`;
        });
        timelineHtml += `<div class="g-t-row g-t-row-project">${projTimelineHtml}</div>`;

        // Task Rows
        projTasks.forEach(task => {
          const user = FS.user.get(task.assigneeId);
          const assigneeName = task.assigneeName || (user?.name || '—');
          const assigneeInitials = (user?.name ? user.name.substring(0,2) : '--').toUpperCase();
          const statusClass = 'g-status-' + task.status;
          const statusText = task.status === 'todo' ? 'Chưa bắt đầu' : 
                            (task.status === 'active' ? 'Đang làm' : 
                            (task.status === 'done' ? 'Hoàn thành' : 'Quá hạn'));

          // Sidebar Row for Task
          sidebarHtml += `<div class="g-row" data-task-id="${task.id}">
            <div class="g-col-name" style="padding-left:16px;">
              <i class="bi bi-${task.status==='done'?'check-circle-fill text-success':'circle'}" style="color:var(--fs-text-muted);font-size:12px;"></i>
              <span class="title" style="${task.status==='done'?'text-decoration:line-through;color:var(--fs-text-muted)':''}">${FS.str.escape(task.title)}</span>
            </div>
            <div class="g-col-assignee">
              <div class="g-avatar" title="${FS.str.escape(assigneeName)}">${assigneeInitials}</div>
            </div>
            <div class="g-col-status">
              <div class="g-status-badge ${statusClass}">${statusText}</div>
            </div>
          </div>`;

          // Timeline Row for Task
          let taskTimelineHtml = '';
          dates.forEach(d => {
            const isToday = d.getTime() === now.getTime();
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            
            let barHtml = '';
            const tStart = task.startDate ? new Date(task.startDate) : null;
            const tEnd = task.dueDate ? new Date(task.dueDate) : null;
            
            if (tStart && tEnd) {
              tStart.setHours(0,0,0,0); tEnd.setHours(23,59,59,999);
              const dMid = new Date(d); dMid.setHours(12,0,0,0);
              
              if (dMid >= tStart && dMid <= tEnd) {
                const isFirst = dMid.toDateString() === tStart.toDateString();
                const isLast = dMid.toDateString() === new Date(tEnd.getFullYear(), tEnd.getMonth(), tEnd.getDate()).toDateString();
                
                const isCritical = this._criticalPath.has(task.id);
                const isOverdue = FS.date.isOverdue(task.dueDate) && task.status !== 'done';
                let barColor = STATUS_COLORS[task.status] || color;
                if (isOverdue) barColor = STATUS_COLORS.overdue;
                if (isCritical) barColor = '#dc2626'; // critical red
                
                const progress = task.estimatedHours
                  ? Math.min(100, Math.round(((task.loggedHours||0) / task.estimatedHours) * 100))
                  : (task.status === 'done' ? 100 : 0);
                  
                let borderRadius = '';
                if (isFirst && isLast) borderRadius = '6px';
                else if (isFirst) borderRadius = '6px 0 0 6px';
                else if (isLast) borderRadius = '0 6px 6px 0';
                else borderRadius = '0';

                barHtml = `
                  <div class="g-task-bar-wrapper" style="left:${isFirst?'4px':'0'}; right:${isLast?'4px':'0'}">
                    ${isFirst ? '<div class="g-dep-handle g-dep-left"></div>' : ''}
                    <div class="g-task-bar" data-task-id="${task.id}" style="background:${barColor}; border-radius:${borderRadius};" title="${FS.str.escape(task.title)}">
                      <div class="g-task-progress" style="width:${progress}%"></div>
                      ${isFirst ? `<div class="g-task-title-inner">
                        <span style="opacity:0.9">${progress}%</span>
                      </div>` : ''}
                    </div>
                    ${isLast ? '<div class="g-dep-handle g-dep-right"></div>' : ''}
                  </div>`;
              }
            }
            
            taskTimelineHtml += `<div class="g-t-cell${isToday?' today':''}${isWeekend?' weekend':''}" style="width:${cellWidth}px">
              ${isToday ? '<div class="g-today-line"></div>' : ''}
              ${barHtml}
            </div>`;
          });
          timelineHtml += `<div class="g-t-row" data-task-id="${task.id}">${taskTimelineHtml}</div>`;
        });
      });

      $('#gantt-sidebar-content').html(sidebarHtml);
      $('#gantt-timeline-content').html(timelineHtml);

      // Auto scroll to today
      const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());
      if (todayIdx > 0) {
        const $tc = $('#gantt-timeline-container');
        // setTimeout to ensure DOM is rendered before scroll
        setTimeout(() => {
          $tc.scrollLeft(Math.max(0, (todayIdx - 3) * cellWidth));
        }, 10);
      }

      setTimeout(() => this._drawDependencyLines(), 60);
    },

    _bindEvents() {
      const self = this;

      // Filter events
      $('#gantt-filter-project').off('change').on('change', function () {
        self._projectFilter = this.value; self._render();
      });
      $('#gantt-filter-status').off('change').on('change', function () {
        self._statusFilter = this.value; self._render();
      });
      $('#gantt-search').off('input').on('input', function() {
        self._searchQuery = this.value;
        clearTimeout(self._searchTimeout);
        self._searchTimeout = setTimeout(() => self._render(), 300);
      });

      // Zoom events
      $(document).off('click.gantt-zoom').on('click.gantt-zoom', '.gantt-zoom', function () {
        $('.gantt-zoom').removeClass('active');
        $(this).addClass('active');
        self._zoom = $(this).data('zoom');
        self._render();
      });

      // Open task detail on click
      $(document).off('click.gantt-task').on('click.gantt-task', '.g-row[data-task-id], .g-task-bar[data-task-id]', function (e) {
        if (isDragging) return; // Ignore if dragging
        const taskId = $(this).data('task-id');
        if (taskId) FS.taskDetail.open(taskId);
      });

      // Sync scroll between timeline and sidebar
      const $sidebar = $('#gantt-sidebar-content');
      const $timeline = $('#gantt-timeline-container');
      
      $timeline.off('scroll.gantt-sync').on('scroll.gantt-sync', function() {
        $sidebar.scrollTop($(this).scrollTop());
        self._drawDependencyLines();
      });

      $(window).off('resize.gantt').on('resize.gantt', () => self._drawDependencyLines());

      // Simple Dragging Simulation for Timeline Bars
      let isDragging = false;
      let startX = 0;
      let currentTask = null;
      let initialStart = null;
      let initialEnd = null;
      
      $(document).off('mousedown.gantt-bar').on('mousedown.gantt-bar', '.g-task-bar', function(e) {
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        const taskId = $(this).data('task-id');
        currentTask = self._tasksData.find(t => t.id === taskId);
        if (currentTask && currentTask.startDate && currentTask.dueDate) {
          initialStart = new Date(currentTask.startDate);
          initialEnd = new Date(currentTask.dueDate);
        }
      });
      
      $(document).off('mousemove.gantt').on('mousemove.gantt', function(e) {
        if (!isDragging || !currentTask || !initialStart || !initialEnd) return;
        const deltaX = e.clientX - startX;
        let cellWidth = 36;
        if (self._zoom === 'day') cellWidth = 60;
        if (self._zoom === 'month') cellWidth = 24;
        if (self._zoom === 'quarter') cellWidth = 16;
        
        const shiftDays = Math.round(deltaX / cellWidth);
        
        if (shiftDays !== 0) {
          const newStart = new Date(initialStart);
          newStart.setDate(initialStart.getDate() + shiftDays);
          const newEnd = new Date(initialEnd);
          newEnd.setDate(initialEnd.getDate() + shiftDays);
          
          currentTask.startDate = newStart.toISOString();
          currentTask.dueDate = newEnd.toISOString();
          
          FS.apiCall({
            url: FS.API_BASE + '/api/v1/tasks/' + currentTask.id,
            type: 'PUT',
            data: {
              title: currentTask.title,
              description: currentTask.description,
              assigneeId: currentTask.assigneeId,
              status: currentTask.status,
              priority: currentTask.priority,
              startDate: currentTask.startDate,
              dueDate: currentTask.dueDate,
              estimatedHours: currentTask.estimatedHours,
              loggedHours: currentTask.loggedHours || 0
            }
          }).catch(err => {
            console.error('Drag Gantt update failed:', err);
          });

          self._render();
          startX = e.clientX;
          initialStart = new Date(currentTask.startDate);
          initialEnd = new Date(currentTask.dueDate);
        }
      });
      
      $(document).off('mouseup.gantt').on('mouseup.gantt', function() {
        if (isDragging) {
          setTimeout(() => { isDragging = false; }, 100); // prevent click event
          currentTask = null;
        }
      });
      
      // Fullscreen logic
      $('#gantt-btn-fullscreen').on('click', () => {
        const elem = document.getElementById('gantt-page');
        if (!document.fullscreenElement) {
          elem.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      });

      $('#gantt-btn-refresh').on('click', () => {
        self._loadData();
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);