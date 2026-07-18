/**
 * FlowSpace — Approvals Module (Team Lead/Manager/Director)
 * Quy trình phê duyệt động tích hợp Workflow Engine
 */
(function (FS, $) {
  'use strict';

  FS.pages.approvals = {
    _statusFilter: 'pending',

    init() {
      if (!FS.auth.isTeamLead()) {
        document.getElementById('approvals-list').innerHTML = '<div class="fs-empty"><i class="bi bi-shield-lock"></i><h5>Không có quyền truy cập</h5><p>Tính năng này dành cho Trưởng nhóm trở lên.</p></div>';
        return;
      }
      this._render();
      this._bindEvents();
    },

    _getMaxApprovalRole(req) {
      const rules = JSON.parse(localStorage.getItem('fs_workflow_rules') || '[]');
      
      // Trích xuất số tiền/số ngày từ title và description
      const text = (req.title + ' ' + req.description).replace(/[^0-9]/g, '');
      const reqValue = parseInt(text) || 0;

      // Tìm rules khớp loại yêu cầu
      const matchingRules = rules.filter(rule => rule.reqType === req.type);
      
      if (!matchingRules.length) {
        // Mặc định khi không có rule
        if (req.type === 'leave') return 'team_lead';
        if (req.type === 'purchase') return 'manager';
        return 'team_lead';
      }

      let maxRole = null;
      let maxLevelValue = 0;
      const roleLevels = { team_lead: 1, manager: 2, director: 3 };

      matchingRules.forEach(rule => {
        let match = false;
        if (rule.operator === 'gt' && reqValue > rule.value) {
          match = true;
        } else if (rule.operator === 'eq' && reqValue === rule.value) {
          match = true;
        }

        if (match) {
          const roleLvl = roleLevels[rule.maxRole] || 0;
          if (roleLvl > maxLevelValue) {
            maxLevelValue = roleLvl;
            maxRole = rule.maxRole;
          }
        }
      });

      if (!maxRole) {
        // Dưới mức rule
        if (req.type === 'leave') return 'team_lead';
        if (req.type === 'purchase') return 'manager';
        return 'team_lead';
      }

      return maxRole;
    },

    _getData() {
      const session  = FS.auth.getSession();
      const role     = session?.role;
      let requests   = FS.db.get('requests');

      const roleLevels = { team_lead: 1, manager: 2, director: 3 };
      const myLevel = roleLevels[role] || 0;

      // Show only requests that are at your approval level and within max rule required
      requests = requests.filter(r => {
        const myStep = r.approvals.find(a => a.role === role);
        if (!myStep) return false;

        // Xác định cấp duyệt tối đa yêu cầu cho request này theo rules
        const maxRoleRequired = this._getMaxApprovalRole(r);
        const maxRequiredLevel = roleLevels[maxRoleRequired] || 0;

        // Nếu cấp duyệt của tôi cao hơn cấp duyệt tối đa yêu cầu, ẩn đi
        if (myLevel > maxRequiredLevel) return false;

        return true;
      });

      if (this._statusFilter) {
        requests = requests.filter(r => {
          const myStep = r.approvals.find(a => a.role === role);
          return myStep && myStep.status === this._statusFilter;
        });
      }
      return requests;
    },

    _render() {
      const requests = this._getData();
      const pendingCount = FS.db.get('requests').filter(r => {
        const role = FS.auth.getSession()?.role;
        const step = r.approvals.find(a => a.role === role);
        if (!step || step.status !== 'pending') return false;

        const maxRoleRequired = this._getMaxApprovalRole(r);
        const roleLevels = { team_lead: 1, manager: 2, director: 3 };
        if ((roleLevels[role] || 0) > (roleLevels[maxRoleRequired] || 0)) return false;

        return true;
      }).length;

      $('#approvals-pending-badge').text(`${pendingCount} chờ duyệt`);

      if (!requests.length) {
        $('#approvals-list').html('<div class="fs-empty"><i class="bi bi-inbox-fill"></i><h5>Không có yêu cầu nào</h5></div>');
        return;
      }

      const role = FS.auth.getSession()?.role;
      const typeLabels = { leave: '🏖️ Nghỉ phép', overtime: '⏰ Tăng ca', purchase: '🛒 Mua sắm', remote: '🏠 Làm remote' };

      $('#approvals-list').html(requests.map(r => {
        const requester = FS.db.find('users', r.requesterId);
        const myStep    = r.approvals.find(a => a.role === role);
        const isPending = myStep?.status === 'pending';

        return `
          <div class="fs-card mb-2" style="border-radius:var(--fs-radius-md);border-left:3px solid ${isPending?'var(--fs-warning)':myStep?.status==='approved'?'var(--fs-success)':'var(--fs-danger)'}">
            <div class="d-flex align-items-start gap-3">
              ${FS.user.avatar(r.requesterId)}
              <div style="flex:1;min-width:0">
                <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span class="fs-badge badge-neutral">${typeLabels[r.type] || r.type}</span>
                  <span style="font-size:13px;font-weight:600">${FS.str.escape(r.title)}</span>
                </div>
                <p style="font-size:12px;color:var(--fs-text-secondary);margin-bottom:8px">${FS.str.escape(r.description)}</p>
                <div class="d-flex align-items-center gap-3">
                  <span class="fs-small"><i class="bi bi-person me-1"></i>${requester?.name || '—'}</span>
                  <span class="fs-small"><i class="bi bi-calendar3 me-1"></i>${FS.date.format(r.createdAt)}</span>
                </div>
              </div>
              <div class="d-flex flex-column gap-2 align-items-end flex-shrink-0">
                ${isPending ? `
                  <div class="d-flex gap-2">
                    <button class="btn btn-success btn-sm approvals-accept-btn" data-req-id="${r.id}" title="Phê duyệt">
                      <i class="bi bi-check2"></i> Phê duyệt
                    </button>
                    <button class="btn btn-danger btn-sm approvals-reject-btn" data-req-id="${r.id}" title="Từ chối">
                      <i class="bi bi-x-lg"></i> Từ chối
                    </button>
                  </div>` : `
                  <span style="font-size:12px;font-weight:600;color:${myStep?.status==='approved'?'var(--fs-success)':'var(--fs-danger)'}">
                    <i class="bi bi-${myStep?.status==='approved'?'check-circle-fill':'x-circle-fill'}"></i>
                    ${myStep?.status==='approved'?'Đã phê duyệt':'Đã từ chối'}
                  </span>`}
              </div>
            </div>
          </div>`;
      }).join(''));
    },

    _processApproval(reqId, decision) {
      const r       = FS.db.find('requests', reqId);
      const session = FS.auth.getSession();
      if (!r) return;

      const myStep = r.approvals.find(a => a.role === session?.role);
      if (!myStep || myStep.status !== 'pending') return;

      myStep.status     = decision;
      myStep.approverId = session?.userId;
      myStep.updatedAt  = new Date().toISOString();

      if (decision === 'approved') {
        // --- WORKFLOW ENGINE: AUTO-APPROVE HIGHER STEPS IF CURRENT REACHES MAX REQUIRED ---
        const maxRoleRequired = this._getMaxApprovalRole(r);
        const roleLevels = { team_lead: 1, manager: 2, director: 3 };
        const currentRoleLevel = roleLevels[session?.role] || 0;
        const maxRequiredLevel = roleLevels[maxRoleRequired] || 0;

        if (currentRoleLevel >= maxRequiredLevel) {
          // Tự động hoàn thành toàn bộ các bước cao hơn còn lại
          r.approvals.forEach(step => {
            if (step.status === 'pending') {
              step.status = 'approved';
              step.note = '(Tự động phê duyệt theo quy tắc hạn mức)';
              step.updatedAt = new Date().toISOString();
            }
          });
        }
      }

      const stillPending = r.approvals.some(a => a.status === 'pending');
      if (!stillPending) {
        r.status = r.approvals.every(a => a.status === 'approved') ? 'approved' : 'rejected';
      }
      r.updatedAt = new Date().toISOString();
      FS.db.save('requests', r);
      this._render();

      // Update nav badge
      const newPending = FS.db.get('requests').filter(r2 => {
        const step = r2.approvals.find(a => a.role === session?.role);
        if (!step || step.status !== 'pending') return false;
        
        const maxRoleRequired = this._getMaxApprovalRole(r2);
        const roleLevels = { team_lead: 1, manager: 2, director: 3 };
        if ((roleLevels[session?.role] || 0) > (roleLevels[maxRoleRequired] || 0)) return false;

        return true;
      }).length;
      
      if (newPending > 0) $('#nav-approval-badge').text(newPending).show();
      else $('#nav-approval-badge').hide();

      FS.toast(decision === 'approved' ? '✅ Đã phê duyệt!' : '❌ Đã từ chối', decision === 'approved' ? 'success' : 'error');
    },

    _bindEvents() {
      const self = this;

      $('#approvals-filter').off('change').on('change', function () {
        self._statusFilter = this.value; self._render();
      });

      $(document).off('click.approv-accept').on('click.approv-accept', '.approvals-accept-btn', function (e) {
        e.stopPropagation();
        self._processApproval($(this).data('req-id'), 'approved');
      });
      $(document).off('click.approv-reject').on('click.approv-reject', '.approvals-reject-btn', function (e) {
        e.stopPropagation();
        FS.confirm('Từ chối yêu cầu này?', () => self._processApproval($(this).data('req-id'), 'rejected'), {
          danger: true, confirmText: 'Từ chối', cancelText: 'Hủy'
        });
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);