/**
 * FlowSpace — Notification + Search Module
 * Component toàn cục: chuông thông báo + modal tìm kiếm
 */
(function (FS, $) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     NOTIFICATIONS
  ═══════════════════════════════════════════════════════════ */
  FS.notifModule = {
    _isLoading: false,
    _hasError: false,
    
    init() {
      this.render();
      this.bindEvents();
    },

    render() {
      const session = FS.auth.getSession();
      if (!session) return;
      
      this._isLoading = true;
      this._hasError = false;
      this._updateStates();
      
      // Simulate API call delay for loading state demo
      setTimeout(() => {
        try {
          const count = FS.notifications.unreadCount(session.userId);
          this.updateBadge(count);
          this.renderDropdown(session.userId);
          this._isLoading = false;
          this._hasError = false;
          this._updateStates();
        } catch (error) {
          this._isLoading = false;
          this._hasError = true;
          this._updateStates();
          console.error('Notification render error:', error);
        }
      }, 300);
    },
    
    _updateStates() {
      const $loading = $('#notif-loading');
      const $empty = $('#notif-empty');
      const $error = $('#notif-error');
      const $list = $('#fs-notif-list');
      
      // Hide all states first
      $loading.hide();
      $empty.hide();
      $error.hide();
      
      if (this._isLoading) {
        $loading.show();
        $list.children('.notif-item').hide();
      } else if (this._hasError) {
        $error.show();
        $list.children('.notif-item').hide();
      }
      // Empty state is handled in renderDropdown
    },

    updateBadge(count) {
      const $badge = $('#fs-notif-badge');
      const $indicator = $('#fs-notif-indicator');
      const $unreadCount = $('#notif-unread-count');
      
      if (count > 0) {
        $badge.text(count > 99 ? '99+' : count).show();
        $indicator.show();
        $unreadCount.text(`${count} chưa đọc`).show();
      } else {
        $badge.hide();
        $indicator.hide();
        $unreadCount.hide();
      }
    },

    renderDropdown(userId) {
      const notifs = FS.notifications.getForUser(userId);
      const notifIcon = type => ({
        task:     'bi-check-square text-accent',
        comment:  'bi-chat-dots text-info',
        approval: 'bi-shield-check text-success',
        deadline: 'bi-clock text-warning',
        mention:  'bi-at text-accent',
        project:  'bi-folder2 text-info',
        overdue:  'bi-exclamation-triangle text-danger'
      })[type] || 'bi-bell';
      
      const priorityClass = priority => {
        if (priority === 'high') return 'priority-high';
        if (priority === 'medium') return 'priority-medium';
        return '';
      };

      if (!notifs || notifs.length === 0) {
        $('#notif-empty').show();
        $('#fs-notif-list').children('.notif-item').remove();
        return;
      }
      
      $('#notif-empty').hide();

      const avatarForNotif = (notif) => {
        if (notif.senderAvatar) return `<div class="fs-avatar fs-avatar-sm" style="background:${notif.senderColor || 'var(--fs-accent)'}">${notif.senderAvatar}</div>`;
        return '';
      };

      const items = notifs.slice(0, 8).map(n => `
        <div class="notif-item ${n.read ? 'read' : 'unread'} ${priorityClass(n.priority)}" data-notif-id="${n.id}" role="button" tabindex="0">
          <div class="notif-dot"></div>
          <div class="notif-content">
            <div class="notif-text">${FS.str.escape(n.text)}</div>
            <div class="notif-time">${FS.date.relative(n.createdAt)}</div>
          </div>
          ${avatarForNotif(n)}
          <i class="bi ${notifIcon(n.type)}" style="font-size:16px;flex-shrink:0"></i>
        </div>
      `).join('');

      $('#fs-notif-list').children('.notif-item').remove();
      $('#fs-notif-list').append(items);
    },

    bindEvents() {
      // Toggle dropdown
      $('#fs-notif-btn').on('click', function (e) {
        e.stopPropagation();
        const $drop = $('#fs-notif-dropdown');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        $drop.toggleClass('show');
        $(this).attr('aria-expanded', !isExpanded);
        
        // Refresh notifications when opening
        if (!isExpanded) {
          FS.notifModule.render();
        }
      });

      // Keyboard support for notification button
      $('#fs-notif-btn').on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $(this).trigger('click');
        }
        if (e.key === 'Escape') {
          $('#fs-notif-dropdown').removeClass('show');
          $(this).attr('aria-expanded', 'false');
        }
      });

      // Close on outside click
      $(document).on('click', function (e) {
        if (!$(e.target).closest('#fs-notif-dropdown, #fs-notif-btn').length) {
          $('#fs-notif-dropdown').removeClass('show');
          $('#fs-notif-btn').attr('aria-expanded', 'false');
        }
      });

      // Mark single as read
      $(document).on('click', '.notif-item', function () {
        const notifId = $(this).data('notif-id');
        const session = FS.auth.getSession();
        if (session) {
          FS.notifications.markRead(session.userId, notifId);
          $(this).removeClass('unread').addClass('read');
          $(this).find('.notif-dot').css('background', 'transparent');
          FS.notifModule.render();
        }
      });
      
      // Keyboard support for notification items
      $(document).on('keydown', '.notif-item', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $(this).trigger('click');
        }
      });

      // Mark all as read
      $('#fs-notif-mark-all').on('click', function () {
        const session = FS.auth.getSession();
        if (session) {
          FS.notifications.markAllRead(session.userId);
          FS.notifModule.render();
          FS.toast('Đã đánh dấu tất cả là đã đọc', 'success');
        }
      });

      // View all notifications → mark all read & close
      $(document).on('click', '#fs-notif-view-all', function (e) {
        e.preventDefault();
        const session = FS.auth.getSession();
        if (session) {
          FS.notifications.markAllRead(session.userId);
          FS.notifModule.render();
        }
        $('#fs-notif-dropdown').removeClass('show');
        $('#fs-notif-btn').attr('aria-expanded', 'false');
        FS.toast('Tất cả thông báo đã được hiển thị', 'info');
      });
    }
  };

  /* ═══════════════════════════════════════════════════════════
     GLOBAL SEARCH
  ═══════════════════════════════════════════════════════════ */
  FS.searchModule = {
    _results: [],
    _selected: -1,

    init() {
      this.bindEvents();
    },

    open() {
      $('#fs-search-modal').addClass('show');
      $('#fs-search-input-main').val('').trigger('focus');
      $('#fs-search-results').html(this._renderEmpty());
      this._selected = -1;
      // Prevent body scroll when modal is open
      $('body').css('overflow', 'hidden');
    },

    close() {
      $('#fs-search-modal').removeClass('show');
      $('body').css('overflow', '');
    },

    search(query) {
      if (!query || query.trim().length < 2) {
        $('#fs-search-results').html(this._renderEmpty());
        return;
      }

      const q = query.toLowerCase();
      const results = { tasks: [], projects: [], documents: [], users: [] };

      // Search tasks
      FS.db.get('tasks').forEach(t => {
        if ((t.title + t.description + t.code).toLowerCase().includes(q)) {
          results.tasks.push(t);
        }
      });

      // Search projects
      FS.db.get('projects').forEach(p => {
        if ((p.name + p.description + p.code).toLowerCase().includes(q)) {
          results.projects.push(p);
        }
      });

      // Search documents
      FS.db.get('documents').forEach(d => {
        if ((d.name + (d.content || '')).toLowerCase().includes(q)) {
          results.documents.push(d);
        }
      });

      // Search users
      FS.db.get('users').forEach(u => {
        if ((u.name + u.email + u.position).toLowerCase().includes(q)) {
          results.users.push(u);
        }
      });

      this._results = [...results.tasks, ...results.projects, ...results.documents, ...results.users];
      $('#fs-search-results').html(this._renderResults(results));
    },

    _renderEmpty() {
      return `<div class="fs-search-result-group">
        <div style="padding:32px;text-align:center;color:var(--fs-text-muted)">
          <i class="bi bi-search" style="font-size:32px;opacity:0.3;display:block;margin-bottom:8px"></i>
          <p style="font-size:13px">Nhập để tìm kiếm task, dự án, tài liệu...</p>
        </div>
      </div>`;
    },

    _renderResults(results) {
      let html = '';
      const sections = [
        { key: 'tasks',     label: 'Công việc',  icon: 'bi-check-square' },
        { key: 'projects',  label: 'Dự án',      icon: 'bi-folder2' },
        { key: 'documents', label: 'Tài liệu',   icon: 'bi-file-text' },
        { key: 'users',     label: 'Người dùng', icon: 'bi-person' }
      ];

      let hasAny = false;
      sections.forEach(s => {
        if (!results[s.key] || !results[s.key].length) return;
        hasAny = true;
        html += `<div class="fs-search-result-group">
          <div class="fs-search-result-header">${s.label}</div>`;
        results[s.key].slice(0, 4).forEach(item => {
          const name = item.title || item.name || item.code || '';
          const sub  = item.code || item.email || item.description || '';
          html += `
            <div class="fs-search-result-item" data-type="${s.key}" data-id="${item.id}">
              <div class="fs-search-result-icon"><i class="bi ${s.icon}"></i></div>
              <div class="fs-search-result-text">
                <h6>${FS.str.escape(FS.str.truncate(name, 50))}</h6>
                <p>${FS.str.escape(FS.str.truncate(sub, 60))}</p>
              </div>
            </div>`;
        });
        html += '</div>';
      });

      if (!hasAny) {
        html = `<div style="padding:32px;text-align:center;color:var(--fs-text-muted)">
          <p>Không tìm thấy kết quả nào</p></div>`;
      }

      return html;
    },

    bindEvents() {
      // Open via button
      $('#fs-search-trigger').on('click', () => this.open());
      
      // Keyboard support for search trigger
      $('#fs-search-trigger').on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          FS.searchModule.open();
        }
      });

      // Ctrl+K shortcut
      $(document).on('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.open();
        }
        if (e.key === 'Escape') this.close();
      });

      // Close on backdrop click
      $('#fs-search-modal').on('click', e => {
        if ($(e.target).is('#fs-search-modal')) this.close();
      });

      // Search input
      $('#fs-search-input-main').on('input', e => {
        this.search(e.target.value);
      });

      // Click result
      $(document).on('click', '.fs-search-result-item', e => {
        const $item = $(e.currentTarget);
        const type  = $item.data('type');
        const id    = $item.data('id');
        this.close();

        // Navigate with force to reload page even if already there
        if (type === 'tasks') {
          FS.router.go('tasks', { force: true });
          setTimeout(() => { if (FS.taskDetail) FS.taskDetail.open(id); }, 600);
        }
        if (type === 'projects') {
          FS.router.go('projects', { force: true });
          setTimeout(() => { if (FS.projectDetail) FS.projectDetail.open(id); }, 600);
        }
        if (type === 'documents') FS.router.go('documents', { force: true });
        if (type === 'users')     FS.router.go('users', { force: true });
      });
      
      // Keyboard navigation for search results
      $(document).on('keydown', '.fs-search-result-item', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          $(this).trigger('click');
        }
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);
