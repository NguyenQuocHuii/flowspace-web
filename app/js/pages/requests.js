/**
 * FlowSpace — Requests Module
 */
(function (FS, $) {
  'use strict';

  FS.pages.requests = {
    _tab: 'all',

    init() {
      this._render();
      this._bindEvents();
    },

    _getData() {
      const session  = FS.auth.getSession();
      let requests   = FS.db.get('requests');

      // Non-managers only see own requests
      if (!FS.auth.isManager()) {
        requests = requests.filter(r => r.requesterId === session?.userId);
      }

      if (this._tab !== 'all') {
        requests = requests.filter(r => r.status === this._tab);
      }
      return requests;
    },

    _render() {
      const requests = this._getData();
      $('#req-count-label').text(`${requests.length} yêu cầu`);

      if (!requests.length) {
        $('#req-list').html('<div class="fs-empty"><i class="bi bi-inbox"></i><h5>Không có yêu cầu nào</h5><p>Nhấn "Tạo yêu cầu" để gửi yêu cầu mới</p></div>');
        return;
      }

      const html = requests.map(r => {
        const requester = FS.db.find('users', r.requesterId);
        const approvals = r.approvals || [];
        const currentStep = approvals.find(a => a.status === 'pending');

        return `
          <div class="fs-card fs-card-sm mb-2 hover-row cursor-pointer req-item" data-req-id="${r.id}" style="border-radius:var(--fs-radius-md)">
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
                <div class="d-flex align-items-center gap-3">
                  <span class="fs-small"><i class="bi bi-person me-1"></i>${requester?.name || '—'}</span>
                  <span class="fs-small"><i class="bi bi-calendar3 me-1"></i>${FS.date.format(r.createdAt)}</span>
                  ${currentStep ? `<span class="fs-small text-warning"><i class="bi bi-hourglass-split me-1"></i>Đang chờ ${FS.auth.getRoleLabel(currentStep.role)}</span>` : ''}
                </div>
              </div>
              <!-- Approval steps indicator -->
              <div class="d-flex gap-1 align-items-center flex-shrink-0">
                ${(r.approvals||[]).map(a => `
                  <div title="${FS.auth.getRoleLabel(a.role)}: ${a.status==='approved'?'Đã duyệt':a.status==='rejected'?'Từ chối':'Chờ'}"
                       style="width:10px;height:10px;border-radius:50%;background:${a.status==='approved'?'var(--fs-success)':a.status==='rejected'?'var(--fs-danger)':'var(--fs-border)'}"></div>
                `).join('<div style="width:16px;height:2px;background:var(--fs-border)"></div>')}
              </div>
            </div>
          </div>`;
      }).join('');

      $('#req-list').html(html);
    },

    _openDetail(reqId) {
      const r         = FS.db.find('requests', reqId);
      if (!r) return;
      const requester = FS.db.find('users', r.requesterId);

      const approvalSteps = (r.approvals || []).map(a => {
        const approver = a.approverId ? FS.db.find('users', a.approverId) : null;
        const icon = a.status === 'approved' ? 'bi-check-circle-fill text-success' :
                     a.status === 'rejected' ? 'bi-x-circle-fill text-danger' :
                     'bi-clock text-warning';
        return `
          <div class="d-flex align-items-start gap-3 mb-3">
            <i class="bi ${icon}" style="font-size:18px;flex-shrink:0;margin-top:2px"></i>
            <div>
              <div style="font-size:13px;font-weight:500">${FS.auth.getRoleLabel(a.role)}</div>
              <div class="fs-small">${approver ? approver.name : 'Chưa xử lý'} ${a.updatedAt ? '· ' + FS.date.format(a.updatedAt) : ''}</div>
              ${a.note ? `<div style="font-size:12px;background:var(--fs-bg-secondary);padding:6px 10px;border-radius:var(--fs-radius);margin-top:4px">${FS.str.escape(a.note)}</div>` : ''}
            </div>
          </div>`;
      }).join('');

      const canApprove = FS.auth.isTeamLead() && r.status === 'pending';
      const pendingStep = (r.approvals||[]).find(a => a.status === 'pending');
      const canThisLevel = pendingStep && (
        (pendingStep.role === 'team_lead'  && FS.auth.getSession()?.role === 'team_lead') ||
        (pendingStep.role === 'manager'    && FS.auth.getSession()?.role === 'manager') ||
        (pendingStep.role === 'director'   && FS.auth.getSession()?.role === 'director')
      );

      const html = `
        <div class="fs-modal-overlay" id="req-detail-overlay">
          <div class="fs-modal" style="max-width:520px">
            <div class="fs-modal-header">
              <div>
                ${FS.badge.reqType(r.type)}
                <h5 class="fs-h5 mt-1 mb-0">${FS.str.escape(r.title)}</h5>
              </div>
              <button class="btn btn-ghost btn-icon btn-sm" onclick="document.getElementById('req-detail-overlay').remove()"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="fs-modal-body">
              <div class="d-flex align-items-center gap-2 mb-3">
                ${FS.user.avatar(r.requesterId)}
                <div>
                  <div style="font-size:13px;font-weight:500">${requester?.name || '—'}</div>
                  <div class="fs-small">${FS.date.format(r.createdAt, {time:true})}</div>
                </div>
                <div class="ms-auto">${FS.badge.status(r.status)}</div>
              </div>
              <div style="font-size:13px;line-height:1.7;color:var(--fs-text-secondary);margin-bottom:20px;padding:12px;background:var(--fs-bg-secondary);border-radius:var(--fs-radius)">${FS.str.escape(r.description)}</div>
              <div class="fs-label mb-3">Quy trình phê duyệt</div>
              ${approvalSteps}
              ${canThisLevel ? `
                <hr class="fs-divider">
                <div class="fs-form-group">
                  <label class="fs-label-text">Ghi chú (tuỳ chọn)</label>
                  <textarea class="fs-textarea" id="req-approve-note" rows="2" placeholder="Ghi chú phê duyệt..."></textarea>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-success btn-sm flex-1" id="req-approve-btn" data-req-id="${r.id}">
                    <i class="bi bi-check2"></i> Phê duyệt
                  </button>
                  <button class="btn btn-danger btn-sm flex-1" id="req-reject-btn" data-req-id="${r.id}">
                    <i class="bi bi-x-lg"></i> Từ chối
                  </button>
                </div>` : ''}
            </div>
          </div>
        </div>`;

      document.body.insertAdjacentHTML('beforeend', html);
      document.getElementById('req-detail-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) this.remove();
      });

      const self = this;
      document.getElementById('req-approve-btn')?.addEventListener('click', function () {
        self._processApproval(r.id, 'approved');
        document.getElementById('req-detail-overlay')?.remove();
      });
      document.getElementById('req-reject-btn')?.addEventListener('click', function () {
        self._processApproval(r.id, 'rejected');
        document.getElementById('req-detail-overlay')?.remove();
      });
    },

    _processApproval(reqId, decision) {
      const r    = FS.db.find('requests', reqId);
      const note = document.getElementById('req-approve-note')?.value || '';
      if (!r) return;

      const session = FS.auth.getSession();
      const pendingStep = r.approvals.find(a => a.status === 'pending');
      if (!pendingStep) return;

      pendingStep.status    = decision;
      pendingStep.approverId = session?.userId;
      pendingStep.note      = note;
      pendingStep.updatedAt = new Date().toISOString();

      // Check if all steps are done
      const stillPending = r.approvals.some(a => a.status === 'pending');
      if (!stillPending) {
        r.status = r.approvals.every(a => a.status === 'approved') ? 'approved' : 'rejected';
      }
      r.updatedAt = new Date().toISOString();
      FS.db.save('requests', r);
      this._render();
      FS.toast(decision === 'approved' ? '✅ Đã phê duyệt!' : '❌ Đã từ chối', decision === 'approved' ? 'success' : 'error');
    },

    _bindEvents() {
      const self = this;

      // Tabs
      $(document).off('click.req-tab').on('click.req-tab', '#req-tabs .fs-tab', function () {
        $('#req-tabs .fs-tab').removeClass('active');
        $(this).addClass('active');
        self._tab = $(this).data('tab');
        self._render();
      });

      // Item click
      $(document).off('click.req-item').on('click.req-item', '.req-item', function () {
        self._openDetail($(this).data('req-id'));
      });

      // New request
      $('#req-new-btn').off('click').on('click', () => $('#req-modal-overlay').show());
      $('#req-modal-close, #req-modal-cancel').off('click').on('click', () => $('#req-modal-overlay').hide());
      $('#req-modal-overlay').off('click').on('click', function (e) {
        if ($(e.target).is('#req-modal-overlay')) $(this).hide();
      });
      $('#req-modal-save').off('click').on('click', function () {
        const title = $('#req-modal-title').val().trim();
        if (!title) { FS.toast('Vui lòng nhập tiêu đề!', 'warning'); return; }
        const session = FS.auth.getSession();
        const type    = $('#req-modal-type').val();

        // Determine approval chain by type
        const chains = {
          leave:    [{level:1, role:'team_lead'}, {level:2, role:'manager'}],
          overtime: [{level:1, role:'team_lead'}],
          purchase: [{level:1, role:'team_lead'}, {level:2, role:'manager'}, {level:3, role:'director'}],
          remote:   [{level:1, role:'team_lead'}]
        };

        const req = {
          id: FS.db.newId(), type, title,
          description: $('#req-modal-desc').val(),
          requesterId: session?.userId,
          status: 'pending',
          approvals: (chains[type] || chains.leave).map(s => ({...s, approverId:null, status:'pending', note:'', updatedAt:null})),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        FS.db.save('requests', req);
        $('#req-modal-overlay').hide();
        self._render();
        FS.toast('Đã gửi yêu cầu thành công!', 'success');
      });
    }
  };

})(window.FS = window.FS || {}, jQuery);