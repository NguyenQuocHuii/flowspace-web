(function (FS, $) {
  'use strict';

  FS.pages.approvals = {
    _statusFilter: 'pending',
    _page: 1,
    PAGE_SIZE: 6,
    _requestsData: [],

    async init() {
      // 0ms instant load from local database cache
      this._requestsData = FS.db.get('requests') || [];
      this._render();
      this._bindEvents();

      // Background fetch
      await this._loadData();
    },

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    async _loadData() {
      try {
        await FS.loadUsersCache();

        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/approvals/pending',
          type: 'GET'
        });

        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          this._requestsData = response.data.map(r => ({
            id: r.id,
            type: (r.type || 'leave').toLowerCase(),
            title: r.title,
            description: r.description || '',
            requesterId: r.requesterId,
            requesterName: r.requesterName || '',
            status: (r.status || 'pending').toLowerCase(),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            approvals: (r.approvals || []).map(a => ({
              id: a.id,
              level: a.level,
              role: a.role,
              approverId: a.approverId,
              approverName: a.approverName || '',
              status: (a.status || 'pending').toLowerCase(),
              note: a.note || '',
              updatedAt: a.updatedAt
            }))
          }));
          $('#approvals-offline-banner').remove();
        } else if (!this._requestsData.length) {
          this._requestsData = FS.db.get('requests') || [];
        }
      } catch (err) {
        console.warn('Pending approvals API request failed, using local fallback:', err);
        if (!this._requestsData.length) {
          this._requestsData = FS.db.get('requests') || [];
        }
      } finally {
        this._render();
      }
    },

    _getFilteredData() {
      let requests = [...this._requestsData];
      const isManagerOrAbove = FS.auth.getRoleLevel() >= 2;

      if (this._statusFilter) {
        const filterVal = this._statusFilter.toLowerCase();
        requests = requests.filter(r => {
          const reqStatus = (r.status || 'pending').toLowerCase();
          if (filterVal === 'pending') {
            return reqStatus === 'pending';
          }
          return reqStatus === filterVal;
        });
      }

      return requests;
    },

    _render() {
      try {
        const allFiltered = this._getFilteredData();
        const total = allFiltered.length;
        const pendingCount = this._requestsData.filter(r => (r.status || '').toLowerCase() === 'pending').length;

        $('#approvals-pending-badge').text(`${pendingCount} chờ duyệt`);
        if (pendingCount > 0) $('#nav-approval-badge').text(pendingCount).show();
        else $('#nav-approval-badge').hide();

        const totalPages = Math.ceil(total / this.PAGE_SIZE) || 1;
        if (this._page > totalPages) this._page = totalPages;
        if (this._page < 1) this._page = 1;

        const start = (this._page - 1) * this.PAGE_SIZE;
        const pagedRequests = allFiltered.slice(start, start + this.PAGE_SIZE);

        if (!total) {
          $('#approvals-list').html('<div class="fs-empty"><i class="bi bi-inbox-fill"></i><h5>Không có yêu cầu nào trong danh mục này</h5></div>');
          this._renderPagination(0, 1);
          return;
        }

        const sessionRole = (FS.auth.getSession()?.role || 'employee').toLowerCase();

        $('#approvals-list').html(pagedRequests.map(r => {
          const requesterName = r.requesterName || (FS.user.get(r.requesterId)?.name || '—');
          const myStep = (r.approvals || []).find(a => (a.status || '').toLowerCase() === 'pending') || (r.approvals || [])[0];
          const isPending = (r.status || '').toLowerCase() === 'pending';
          return `
            <div class="fs-card mb-2" style="border-radius:var(--fs-radius-md);border-left:3px solid ${isPending ? 'var(--fs-warning)' : r.status === 'approved' ? 'var(--fs-success)' : 'var(--fs-danger)'}">
              <div class="d-flex align-items-start gap-3">
                <div>
                  ${FS.user.avatar(r.requesterId)}
                </div>
                <div style="flex:1;min-width:0">
                  <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span style="font-size:13px;font-weight:600">${FS.str.escape(r.title)}</span>
                    ${FS.badge.reqType(r.type)}
                    ${FS.badge.status(r.status)}
                  </div>
                  <p style="font-size:12px;color:var(--fs-text-secondary);margin-bottom:8px" class="truncate">${FS.str.escape(r.description)}</p>
                  <div class="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
                    <span class="fs-small"><i class="bi bi-person me-1"></i>${FS.str.escape(requesterName)}</span>
                    <span class="fs-small"><i class="bi bi-calendar3 me-1"></i>${FS.date.format(r.createdAt)}</span>
                    ${myStep ? `<span class="fs-small text-muted"><i class="bi bi-shield-check me-1"></i>Cấp: ${FS.auth.getRoleLabel(myStep.role || 'manager')}</span>` : ''}
                  </div>
                  ${isPending && FS.auth.getRoleLevel() >= 2 ? `
                    <div class="mt-3 d-flex gap-2">
                      <button class="btn btn-sm btn-success app-action-btn approvals-accept-btn" data-req-id="${r.id}" data-approval-id="${myStep?.id || ''}" data-action="approved"><i class="bi bi-check-lg"></i> Phê duyệt</button>
                      <button class="btn btn-sm btn-danger app-action-btn approvals-reject-btn" data-req-id="${r.id}" data-approval-id="${myStep?.id || ''}" data-action="rejected"><i class="bi bi-x-lg"></i> Từ chối</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>`;
        }).join(''));

        this._renderPagination(total, totalPages);
      } catch (err) {
        console.error('Approvals render error:', err);
        $('#approvals-list').html('<div class="fs-empty"><i class="bi bi-inbox-fill"></i><h5>Không có yêu cầu nào cần duyệt</h5></div>');
        this._renderPagination(0, 1);
      }
    },

    _renderPagination(total, totalPages) {
      const $ul = $('#approvals-pagination-ul');
      const $info = $('#approvals-pagination-info');

      if (total === 0) {
        $info.text('Hiển thị 0 trong 0 yêu cầu');
        $ul.html('');
        return;
      }

      const start = (this._page - 1) * this.PAGE_SIZE + 1;
      const end = Math.min(this._page * this.PAGE_SIZE, total);
      $info.text(`Hiển thị ${start}-${end} trong ${total} yêu cầu`);

      let html = '';

      if (this._page === 1) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">&laquo; Trước</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link approvals-page-link" data-page="${this._page - 1}" href="#">&laquo; Trước</a></li>`;
      }

      for (let p = 1; p <= totalPages; p++) {
        if (p === this._page) {
          html += `<li class="page-item active" aria-current="page"><span class="page-link">${p}</span></li>`;
        } else {
          html += `<li class="page-item"><a class="page-link approvals-page-link" data-page="${p}" href="#">${p}</a></li>`;
        }
      }

      if (this._page === totalPages) {
        html += `<li class="page-item disabled" aria-disabled="true"><span class="page-link">Sau &raquo;</span></li>`;
      } else {
        html += `<li class="page-item"><a class="page-link approvals-page-link" data-page="${this._page + 1}" href="#">Sau &raquo;</a></li>`;
      }

      $ul.html(html);
    },

    async _processApproval(reqId, approvalId, decision) {
      if (approvalId) {
        try {
          const response = await $.ajax({
            url: FS.API_BASE + '/api/v1/approvals/' + approvalId + '/action',
            type: 'POST',
            contentType: 'application/json',
            headers: this._getAuthHeaders(),
            data: JSON.stringify({ status: decision, note: decision === 'approved' ? 'Đã phê duyệt qua trang Approvals' : 'Từ chối qua trang Approvals' })
          });

          if (response && response.success) {
            FS.toast(decision === 'approved' ? '✅ Đã phê duyệt!' : '❌ Đã từ chối', decision === 'approved' ? 'success' : 'error');
            await this._loadData();
            return;
          }
        } catch (err) {
          console.warn('Process approval API failed, falling back to LocalStorage:', err);
        }
      }

      // LocalStorage fallback
      const r = FS.db.find('requests', reqId);
      const session = FS.auth.getSession();
      if (r) {
        const myStep = r.approvals.find(a => a.role === session?.role);
        if (myStep) {
          myStep.status = decision;
          myStep.approverId = session?.userId;
          myStep.updatedAt = new Date().toISOString();
          const stillPending = r.approvals.some(a => a.status === 'pending');
          if (!stillPending) {
            r.status = r.approvals.every(a => a.status === 'approved') ? 'approved' : 'rejected';
          }
          FS.db.save('requests', r);
        }
      }
      await this._loadData();
      FS.toast(decision === 'approved' ? '✅ Đã phê duyệt!' : '❌ Đã từ chối', decision === 'approved' ? 'success' : 'error');
    },

    _bindEvents() {
      const self = this;

      $(document).off('click.approv-page').on('click.approv-page', '.approvals-page-link', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'), 10);
        if (p && p !== self._page) {
          self._page = p;
          self._render();
        }
      });

      $('#approvals-filter').off('change').on('change', function () { self._statusFilter = this.value; self._render(); });

      $(document).off('click.approv-accept').on('click.approv-accept', '.approvals-accept-btn', function (e) {
        e.stopPropagation();
        const reqId = $(this).data('req-id');
        const approvalId = $(this).data('approval-id');
        self._processApproval(reqId, approvalId, 'approved');
      });

      $(document).off('click.approv-return').on('click.approv-return', '.approvals-return-btn', function (e) {
        e.stopPropagation();
        const reqId = $(this).data('req-id');
        const approvalId = $(this).data('approval-id');
        FS.confirm('Trả lại yêu cầu này để yêu cầu bổ sung/chỉnh sửa?', () => self._processApproval(reqId, approvalId, 'returned'), { danger: false, confirmText: 'Trả lại', cancelText: 'Hủy' });
      });

      $(document).off('click.approv-reject').on('click.approv-reject', '.approvals-reject-btn', function (e) {
        e.stopPropagation();
        const reqId = $(this).data('req-id');
        const approvalId = $(this).data('approval-id');
        FS.confirm('Từ chối yêu cầu này?', () => self._processApproval(reqId, approvalId, 'rejected'), { danger: true, confirmText: 'Từ chối', cancelText: 'Hủy' });
      });
    }
  };
})(window.FS = window.FS || {}, jQuery);