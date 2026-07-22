(function (FS, $) {
  'use strict';

  FS.pages.approvals = {
    _statusFilter: 'pending',
    _requestsData: [],

    async init() {
      if (!FS.auth.isTeamLead()) {
        document.getElementById('approvals-list').innerHTML = '<div class="fs-empty"><i class="bi bi-shield-lock"></i><h5>Không có quyền truy cập</h5><p>Tính năng này dành cho Trưởng nhóm trở lên.</p></div>';
        return;
      }
      await this._loadData();
      this._bindEvents();
    },

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    async _loadData() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/approvals/pending',
          type: 'GET'
        });

        if (response && response.success && Array.isArray(response.data)) {
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
        } else {
          this._requestsData = FS.db.get('requests') || [];
        }
      } catch (err) {
        console.warn('Pending approvals API request failed, falling back to LocalStorage:', err);
        this._requestsData = FS.db.get('requests') || [];
        if (!$('#approvals-offline-banner').length) {
          $('#page-content').prepend('<div id="approvals-offline-banner" class="fs-login-alert show" style="display:flex; margin-bottom:16px"><i class="bi bi-exclamation-triangle-fill"></i><span>Không thể kết nối máy chủ. Hiện đang hiển thị dữ liệu phê duyệt ngoại tuyến.</span></div>');
        }
      }
      this._render();
    },

    _getFilteredData() {
      const sessionRole = (FS.auth.getSession()?.role || 'employee').toLowerCase();
      let requests = [...this._requestsData];

      if (this._statusFilter) {
        requests = requests.filter(r => {
          if (this._statusFilter === 'pending') {
            const activeStep = (r.approvals || []).find(a => (a.status || '').toLowerCase() === 'pending');
            if (!activeStep) return false;
            const stepRole = (activeStep.role || '').toLowerCase();
            return stepRole === sessionRole || 
                   sessionRole === 'director' || 
                   (sessionRole === 'manager' && stepRole === 'team_lead');
          }
          const myStep = (r.approvals || []).find(a => (a.role || '').toLowerCase() === sessionRole || sessionRole === 'director');
          return myStep && (myStep.status || '').toLowerCase() === this._statusFilter.toLowerCase();
        });
      }
      return requests;
    },

    _render() {
      try {
        const requests = this._getFilteredData();
        const sessionRole = (FS.auth.getSession()?.role || 'employee').toLowerCase();
        const pendingCount = this._requestsData.filter(r => {
          const step = (r.approvals || []).find(a => (a.role || '').toLowerCase() === sessionRole);
          return step && (step.status || '').toLowerCase() === 'pending';
        }).length;

        $('#approvals-pending-badge').text(`${pendingCount} chờ duyệt`);
        if (pendingCount > 0) $('#nav-approval-badge').text(pendingCount).show();
        else $('#nav-approval-badge').hide();

        if (!requests.length) {
          $('#approvals-list').html('<div class="fs-empty"><i class="bi bi-inbox-fill"></i><h5>Không có yêu cầu nào cần duyệt</h5></div>');
          return;
        }

        const typeLabels = { leave: '🏖️ Nghỉ phép', overtime: '⏰ Tăng ca', purchase: '🛒 Mua sắm', remote: '🏠 Làm remote' };

        $('#approvals-list').html(requests.map(r => {
          const requesterName = r.requesterName || (FS.user.get(r.requesterId)?.name || '—');
          const myStep = (r.approvals || []).find(a => (a.role || '').toLowerCase() === sessionRole);
          const isPending = myStep?.status === 'pending';
          return `
            <div class="fs-card mb-2" style="border-radius:var(--fs-radius-md);border-left:3px solid ${isPending ? 'var(--fs-warning)' : myStep?.status === 'approved' ? 'var(--fs-success)' : 'var(--fs-danger')}">
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
                    ${myStep ? `<span class="fs-small text-muted"><i class="bi bi-shield-check me-1"></i>${FS.auth.getRoleLabel(myStep.role)}</span>` : ''}
                  </div>
                  ${isPending ? `
                    <div class="mt-3 d-flex gap-2">
                      <button class="btn btn-sm btn-success app-action-btn approvals-accept-btn" data-req-id="${r.id}" data-approval-id="${myStep.id}" data-action="approved"><i class="bi bi-check-lg"></i> Phê duyệt</button>
                      <button class="btn btn-sm btn-danger app-action-btn approvals-reject-btn" data-req-id="${r.id}" data-approval-id="${myStep.id}" data-action="rejected"><i class="bi bi-x-lg"></i> Từ chối</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>`;
        }).join(''));
      } catch (err) {
        console.error('Error rendering approvals:', err);
        $('#approvals-list').html('<div class="fs-empty"><i class="bi bi-inbox-fill"></i><h5>Không có yêu cầu nào cần duyệt</h5></div>');
      }
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