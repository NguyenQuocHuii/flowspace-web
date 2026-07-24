/**
 * FlowSpace — Gantt Chart Module (SaaS Enterprise Edition 2026)
 * Complete Implementation with CPM, Handles, Reschedule API & Rollback
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
    _milestonesData: [],
    _linksData: [],
    _resourcesData: [],
    _criticalPath: new Set(),
    _searchTimeout: null,
    _rescheduleDebounce: null,

    async init() {
      // 1. Initial local render
      this._tasksData = FS.db.get('tasks') || [];
      this._projectsData = FS.db.get('projects') || [];
      
      this._populateFilters();
      this._render();
      this._bindEvents();

      // 2. Load live data from API
      await this._loadProjects();
    },

    async _loadProjects() {
      try {
        const projsRes = await FS.apiCall({ url: FS.API_BASE + '/api/v1/projects', type: 'GET' });
        if (projsRes?.success && Array.isArray(projsRes.data) && projsRes.data.length > 0) {
          this._projectsData = projsRes.data;
          this._populateFilters();
          
          if (!this._projectFilter && this._projectsData.length > 0) {
            this._projectFilter = this._projectsData[0].id;
            $('#gantt-filter-project').val(this._projectFilter);
          }
          await this._loadGanttData();
        }
      } catch (err) {
        console.warn('Load projects failed:', err);
      }
    },

    async _loadGanttData() {
      if (!this._projectFilter) return;
      
      try {
        const res = await FS.apiCall({ url: FS.API_BASE + `/api/v1/gantt/${this._projectFilter}`, type: 'GET' });
        if (res?.success && res.data) {
          this._tasksData = res.data.tasks || [];
          this._milestonesData = res.data.milestones || [];
          this._linksData = res.data.links || [];
          this._resourcesData = res.data.resources || [];
          
          // Real CPM from Server
          this._criticalPath = new Set(res.data.criticalPath || []);
        }
      } catch (err) {
        console.warn('Gantt API load failed, using local fallback:', err);
      } finally {
        this._render();
      }
    },

    _drawDependencyLines() {
      const svg = document.getElementById('gantt-svg-layer');
      const container = document.getElementById('gantt-timeline-container');
      if (!svg || !container) return;
      svg.innerHTML = '';
      
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      
      const links = this._linksData;
      const criticalSet = this._criticalPath;
      const headerHeight = 56;
      
      links.forEach(link => {
        const sourceEls = document.querySelectorAll(`.g-task-bar[data-task-id="${link.source}"]`);
        const targetEls = document.querySelectorAll(`.g-task-bar[data-task-id="${link.target}"]`);
        if (!sourceEls.length || !targetEls.length) return;
        
        const sourceEl = sourceEls[0];
        const targetEl = targetEls[0];
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        if (sourceRect.top === 0 || targetRect.top === 0) return;
        
        const isCritical = criticalSet.has(link.source) && criticalSet.has(link.target);
        const color = isCritical ? '#ef4444' : '#94a3b8';
        const strokeWidth = isCritical ? 2.5 : 1.5;

        let sourceX = sourceRect.right - containerRect.left + scrollLeft;
        let sourceY = sourceRect.top - containerRect.top + scrollTop + (sourceRect.height / 2) - headerHeight;
        
        let targetX = targetRect.left - containerRect.left + scrollLeft;
        let targetY = targetRect.top - containerRect.top + scrollTop + (targetRect.height / 2) - headerHeight;
        
        if (link.type === 'StartToStart') {
          sourceX = sourceRect.left - containerRect.left + scrollLeft;
        } else if (link.type === 'FinishToFinish') {
          targetX = targetRect.right - containerRect.left + scrollLeft;
        } else if (link.type === 'StartToFinish') {
          sourceX = sourceRect.left - containerRect.left + scrollLeft;
          targetX = targetRect.right - containerRect.left + scrollLeft;
        }

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
        if (isCritical) path.setAttribute("stroke-dasharray", "none");
        
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        let points = `${targetX-5},${targetY-4} ${targetX},${targetY} ${targetX-5},${targetY+4}`;
        if (link.type === 'FinishToFinish' || link.type === 'StartToFinish') {
          points = `${targetX+5},${targetY-4} ${targetX},${targetY} ${targetX+5},${targetY+4}`;
        }
        arrow.setAttribute("points", points);
        arrow.setAttribute("fill", color);
        
        svg.appendChild(path);
        svg.appendChild(arrow);
      });
    },

    _populateFilters() {
      const projects = this._projectsData || [];
      let filterHtml = '<option value="">Chọn dự án...</option>';
      if (projects.length === 0) {
          filterHtml += '<option value="">(Chưa có dự án)</option>';
      } else {
          filterHtml += projects.map(p => `<option value="${p.id}">${FS.str.escape(p.name)}</option>`).join('');
      }
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
      let milestones = this._milestonesData || [];

      if (this._projectFilter) {
        projects = projects.filter(p => p.id === this._projectFilter);
      }

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

      // Render Body
      let sidebarHtml = '';
      let timelineHtml = '';
      let colorIdx = 0;

      projects.forEach(project => {
        const projTasks = tasks.filter(t => t.projectId === project.id);
        const projMilestones = milestones.filter(m => m.projectId === project.id);
        
        const color = STATUS_COLORS[project.status] || COLORS[colorIdx++ % COLORS.length];
        
        sidebarHtml += `<div class="g-row g-row-project">
          <div class="g-col-name">
            <i class="bi bi-folder-fill" style="color:${color}"></i>
            <span class="title">${FS.str.escape(project.name)}</span>
          </div>
          <div class="g-col-assignee"></div>
          <div class="g-col-status"></div>
        </div>`;

        let projTimelineHtml = '';
        dates.forEach(d => {
          const isToday = d.getTime() === now.getTime();
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          projTimelineHtml += `<div class="g-t-cell${isToday?' today':''}${isWeekend?' weekend':''}" style="width:${cellWidth}px">
            ${isToday ? '<div class="g-today-line"></div>' : ''}
          </div>`;
        });
        timelineHtml += `<div class="g-t-row g-t-row-project">${projTimelineHtml}</div>`;

        // Render Milestones
        projMilestones.forEach(milestone => {
          sidebarHtml += `<div class="g-row" style="background:#fffcf2;">
            <div class="g-col-name" style="padding-left:16px;">
              <i class="bi bi-gem" style="color:#f59e0b;font-size:12px;"></i>
              <span class="title" style="font-weight:600">${FS.str.escape(milestone.name)}</span>
            </div>
            <div class="g-col-assignee"></div>
            <div class="g-col-status">
              <span style="font-size:10px;color:#f59e0b">MILESTONE</span>
            </div>
          </div>`;

          let mTimelineHtml = '';
          dates.forEach(d => {
            const isToday = d.getTime() === now.getTime();
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            let diamondHtml = '';
            
            const mDate = new Date(milestone.date);
            mDate.setHours(0,0,0,0);
            
            if (d.getTime() === mDate.getTime()) {
              diamondHtml = `<div class="g-milestone-diamond" data-milestone-id="${milestone.id}" title="${FS.str.escape(milestone.name)} (${mDate.toLocaleDateString()})"></div>`;
            }
            
            mTimelineHtml += `<div class="g-t-cell${isToday?' today':''}${isWeekend?' weekend':''}" style="width:${cellWidth}px">
              ${isToday ? '<div class="g-today-line"></div>' : ''}
              ${diamondHtml}
            </div>`;
          });
          timelineHtml += `<div class="g-t-row">${mTimelineHtml}</div>`;
        });

        // Task Rows
        projTasks.forEach(task => {
          const assigneeName = task.assigneeName || '—';
          const assigneeInitials = (assigneeName !== '—' ? assigneeName.substring(0,2) : '--').toUpperCase();
          const statusClass = 'g-status-' + task.status;
          const statusText = task.status === 'todo' ? 'Chưa bắt đầu' : 
                            (task.status === 'active' ? 'Đang làm' : 
                            (task.status === 'done' ? 'Hoàn thành' : 'Quá hạn'));
                            
          const resources = this._resourcesData.filter(r => r.taskId === task.id);
          const workloadHtml = resources.length > 0 
                ? `<span class="badge bg-secondary ms-1" style="font-size:9px" title="Workload">${resources[0].allocationPercentage}%</span>` 
                : '';

          sidebarHtml += `<div class="g-row" data-task-id="${task.id}">
            <div class="g-col-name" style="padding-left:16px;">
              <i class="bi bi-${task.status==='done'?'check-circle-fill text-success':'circle'}" style="color:var(--fs-text-muted);font-size:12px;"></i>
              <span class="title" style="${task.status==='done'?'text-decoration:line-through;color:var(--fs-text-muted)':''}">${FS.str.escape(task.title)}</span>
              ${workloadHtml}
            </div>
            <div class="g-col-assignee">
              <div class="g-avatar" title="${FS.str.escape(assigneeName)}">${assigneeInitials}</div>
            </div>
            <div class="g-col-status">
              <div class="g-status-badge ${statusClass}">${statusText}</div>
            </div>
          </div>`;

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
                if (isCritical) barColor = '#ef4444'; // critical red
                
                const progress = task.progress || (task.status === 'done' ? 100 : 0);
                  
                let borderRadius = '';
                if (isFirst && isLast) borderRadius = '6px';
                else if (isFirst) borderRadius = '6px 0 0 6px';
                else if (isLast) borderRadius = '0 6px 6px 0';
                else borderRadius = '0';

                barHtml = `
                  <div class="g-task-bar-wrapper" style="left:${isFirst?'4px':'0'}; right:${isLast?'4px':'0'}">
                    ${isFirst ? `<div class="g-task-handle g-handle-left" data-task-id="${task.id}"></div>` : ''}
                    <div class="g-task-bar${isCritical?' g-critical':''}" data-task-id="${task.id}" style="background:${barColor}; border-radius:${borderRadius};" title="${FS.str.escape(task.title)}">
                      <div class="g-task-progress" style="width:${progress}%"></div>
                      ${isFirst ? `<div class="g-task-title-inner">
                        <span style="opacity:0.9">${progress}%</span>
                      </div>` : ''}
                    </div>
                    ${isLast ? `<div class="g-task-handle g-handle-right" data-task-id="${task.id}"></div>` : ''}
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

      const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());
      if (todayIdx > 0) {
        const $tc = $('#gantt-timeline-container');
        setTimeout(() => {
          $tc.scrollLeft(Math.max(0, (todayIdx - 3) * cellWidth));
        }, 10);
      }

      setTimeout(() => this._drawDependencyLines(), 60);
    },

    _bindEvents() {
      const self = this;

      $('#gantt-filter-project').off('change').on('change', function () {
        self._projectFilter = this.value; 
        self._loadGanttData();
      });
      $('#gantt-filter-status').off('change').on('change', function () {
        self._statusFilter = this.value; self._render();
      });
      $('#gantt-search').off('input').on('input', function() {
        self._searchQuery = this.value;
        clearTimeout(self._searchTimeout);
        self._searchTimeout = setTimeout(() => self._render(), 300);
      });

      $(document).off('click.gantt-zoom').on('click.gantt-zoom', '.gantt-zoom', function () {
        $('.gantt-zoom').removeClass('active');
        $(this).addClass('active');
        self._zoom = $(this).data('zoom');
        self._render();
      });

      $(document).off('click.gantt-task').on('click.gantt-task', '.g-row[data-task-id]', function (e) {
        if (isDragging) return;
        const taskId = $(this).data('task-id');
        if (taskId) FS.taskDetail.open(taskId);
      });

      const $sidebar = $('#gantt-sidebar-content');
      const $timeline = $('#gantt-timeline-container');
      
      $timeline.off('scroll.gantt-sync').on('scroll.gantt-sync', function() {
        $sidebar.scrollTop($(this).scrollTop());
        self._drawDependencyLines();
      });

      $(window).off('resize.gantt').on('resize.gantt', () => self._drawDependencyLines());

      // =========================================================
      // Advanced Drag & Drop: Move, Resize Left, Resize Right
      // =========================================================
      let isDragging = false;
      let dragMode = 'move'; // 'move' | 'resize-left' | 'resize-right' | 'milestone'
      let startX = 0;
      let currentTask = null;
      let currentMilestone = null;
      let originalStart = null;
      let originalEnd = null;
      let originalMilestoneDate = null;
      
      // Mousedown on Bar Handles vs Bar Body vs Milestone
      $(document).off('mousedown.gantt-drag')
        .on('mousedown.gantt-drag', '.g-handle-left, .g-handle-right, .g-task-bar, .g-milestone-diamond', function(e) {
          e.stopPropagation();
          isDragging = true;
          startX = e.clientX;

          const $el = $(this);
          if ($el.hasClass('g-handle-left')) {
            dragMode = 'resize-left';
            const taskId = $el.data('task-id');
            currentTask = self._tasksData.find(t => t.id === taskId);
          } else if ($el.hasClass('g-handle-right')) {
            dragMode = 'resize-right';
            const taskId = $el.data('task-id');
            currentTask = self._tasksData.find(t => t.id === taskId);
          } else if ($el.hasClass('g-milestone-diamond')) {
            dragMode = 'milestone';
            const mId = $el.data('milestone-id');
            currentMilestone = self._milestonesData.find(m => m.id === mId);
            if (currentMilestone) {
              originalMilestoneDate = new Date(currentMilestone.date);
            }
          } else {
            dragMode = 'move';
            const taskId = $el.data('task-id');
            currentTask = self._tasksData.find(t => t.id === taskId);
          }

          if (currentTask && currentTask.startDate && currentTask.dueDate) {
            originalStart = new Date(currentTask.startDate);
            originalEnd = new Date(currentTask.dueDate);
          }
        });
      
      $(document).off('mousemove.gantt').on('mousemove.gantt', function(e) {
        if (!isDragging) return;
        
        let cellWidth = 36;
        if (self._zoom === 'day') cellWidth = 60;
        if (self._zoom === 'month') cellWidth = 24;
        if (self._zoom === 'quarter') cellWidth = 16;
        
        const deltaX = e.clientX - startX;
        const shiftDays = Math.round(deltaX / cellWidth);
        
        if (shiftDays === 0) return;

        if (dragMode === 'milestone' && currentMilestone && originalMilestoneDate) {
          const newDate = new Date(originalMilestoneDate);
          newDate.setDate(originalMilestoneDate.getDate() + shiftDays);
          currentMilestone.date = newDate.toISOString();
          self._render();
          return;
        }

        if (!currentTask || !originalStart || !originalEnd) return;

        if (dragMode === 'move') {
          const newStart = new Date(originalStart);
          newStart.setDate(originalStart.getDate() + shiftDays);
          const newEnd = new Date(originalEnd);
          newEnd.setDate(originalEnd.getDate() + shiftDays);
          
          currentTask.startDate = newStart.toISOString();
          currentTask.dueDate = newEnd.toISOString();
        } else if (dragMode === 'resize-left') {
          const newStart = new Date(originalStart);
          newStart.setDate(originalStart.getDate() + shiftDays);
          if (newStart < originalEnd) {
            currentTask.startDate = newStart.toISOString();
          }
        } else if (dragMode === 'resize-right') {
          const newEnd = new Date(originalEnd);
          newEnd.setDate(originalEnd.getDate() + shiftDays);
          if (newEnd > originalStart) {
            currentTask.dueDate = newEnd.toISOString();
          }
        }
        
        self._render();
      });
      
      $(document).off('mouseup.gantt').on('mouseup.gantt', function() {
        if (!isDragging) return;
        isDragging = false;
        
        // Finalize Reschedule call with Rollback logic
        if (dragMode === 'milestone' && currentMilestone) {
          FS.apiCall({
            url: FS.API_BASE + '/api/v1/gantt/milestones/' + currentMilestone.id,
            type: 'PUT',
            data: JSON.stringify(currentMilestone.date),
            contentType: 'application/json'
          }).catch(err => {
            console.error('Milestone update failed, rolling back:', err);
            if (originalMilestoneDate) currentMilestone.date = originalMilestoneDate.toISOString();
            self._render();
          });
        } else if (currentTask && originalStart && originalEnd) {
          const backupStart = originalStart.toISOString();
          const backupEnd = originalEnd.toISOString();
          const updateSource = dragMode === 'resize-left' ? 'resize_start' : (dragMode === 'resize-right' ? 'resize_end' : 'drag');
          
          FS.apiCall({
            url: FS.API_BASE + '/api/v1/gantt/tasks/' + currentTask.id + '/schedule',
            type: 'PATCH',
            data: {
              taskId: currentTask.id,
              newStartDate: currentTask.startDate,
              newDueDate: currentTask.dueDate,
              source: updateSource
            }
          }).then(res => {
            if (!res?.success) {
              throw new Error(res?.message || 'Reschedule rejected');
            }
            // If cascading tasks were affected, reload gantt timeline
            if (res.data?.affectedTaskIds && res.data.affectedTaskIds.length > 1) {
              self._loadGanttData();
            }
          }).catch(err => {
            console.error('Reschedule rejected by server (Constraint/Cycle):', err);
            // Rollback UI
            currentTask.startDate = backupStart;
            currentTask.dueDate = backupEnd;
            self._render();
            if (typeof FS.toast?.error === 'function') {
              FS.toast.error(err.responseJSON?.message || err.message || 'Không thể dời lịch: Vi phạm quy tắc phụ thuộc (Dependency constraint)!');
            }
          });
        }

        currentTask = null;
        currentMilestone = null;
        originalStart = null;
        originalEnd = null;
        originalMilestoneDate = null;
      });
      
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
        self._loadGanttData();
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);