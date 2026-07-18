/**
 * FlowSpace — Calendar Page Module
 * Uses FullCalendar.js
 */
(function (FS) {
  'use strict';

  FS.pages.calendar = {
    _calendar: null,
    _projectFilter: '',

    init() {
      this._populateFilters();
      this._renderCalendar();
      this._bindEvents();
    },

    _populateFilters() {
      const projects = FS.db.get('projects');
      document.getElementById('cal-filter-project').innerHTML +=
        projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    },

    _getEvents() {
      let tasks = FS.db.get('tasks');
      if (this._projectFilter) {
        tasks = tasks.filter(t => t.projectId === this._projectFilter);
      }

      const statusColors = {
        todo:        '#94a3b8',
        in_progress: '#6366f1',
        review:      '#f59e0b',
        done:        '#10b981'
      };

      const events = tasks
        .filter(t => t.dueDate)
        .map(t => {
          const project = FS.db.find('projects', t.projectId);
          const overdue = t.status !== 'done' && new Date(t.dueDate) < new Date();
          return {
            id:    t.id,
            title: t.title,
            start: t.startDate || t.dueDate,
            end:   t.dueDate,
            backgroundColor: overdue ? '#ef4444' : statusColors[t.status] || '#6366f1',
            extendedProps: { task: t, projectName: project ? project.name : '' }
          };
        });

      // Add some "meeting" events for realism
      const now = new Date();
      const addMeeting = (title, dayOffset, hour = 10, color = '#8b5cf6') => {
        const d = new Date(now);
        d.setDate(d.getDate() + dayOffset);
        d.setHours(hour, 0, 0, 0);
        const end = new Date(d); end.setHours(hour + 1);
        events.push({ title, start: d.toISOString(), end: end.toISOString(), backgroundColor: color, extendedProps: { isMeeting: true } });
      };
      addMeeting('Sprint Review', 0, 15);
      addMeeting('Team Standup', 1, 9);
      addMeeting('Demo khách hàng', 3, 14, '#f59e0b');
      addMeeting('1-on-1 với TN', 5, 11, '#ec4899');
      addMeeting('Sprint Planning', 7, 10);

      return events;
    },

    _renderCalendar() {
      const el = document.getElementById('calendar-el');
      if (!el || typeof FullCalendar === 'undefined') return;

      if (this._calendar) { this._calendar.destroy(); }

      const self = this;
      this._calendar = new FullCalendar.Calendar(el, {
        locale:          'vi',
        initialView:     'dayGridMonth',
        headerToolbar: {
          left:   'prev,next today',
          center: 'title',
          right:  'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
          today: 'Hôm nay',
          month: 'Tháng',
          week:  'Tuần',
          day:   'Ngày'
        },
        events:          this._getEvents(),
        eventClick(info) {
          const task = info.event.extendedProps.task;
          if (task) {
            FS.taskDetail.open(task.id);
          } else if (info.event.extendedProps.isMeeting) {
            FS.toast(`📅 ${info.event.title}`, 'info', 2000);
          }
        },
        dayMaxEvents: 3,
        moreLinkText: n => `+${n} nữa`,
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        height: 'auto',
        firstDay: 1 // Monday
      });

      this._calendar.render();
    },

    _bindEvents() {
      const self = this;
      document.getElementById('cal-filter-project')?.addEventListener('change', function () {
        self._projectFilter = this.value;
        self._renderCalendar();
      });
    }
  };

})(window.FS = window.FS || {});