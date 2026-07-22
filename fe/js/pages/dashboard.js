(function (FS, $) {
  "use strict";

  const emptyState = (icon, message) => `<div class="fs-empty"><i class="bi ${icon}" aria-hidden="true"></i><p>${message}</p></div>`;

  FS.pages.dashboard = {
    _charts: [],
    _summaryData: null,
    _state: "loading",

    async init() {
      this._destroyCharts();
      this._renderGreeting();
      await this._loadSummary();
      this._renderStatus();
      this._renderStats();
      this._renderMyTasks();
      this._renderProjects();
      this._renderActivityFeed();
      this._renderCharts();
      this._bindEvents();
    },

    async _loadSummary() {
      this._state = "loading";
      this._summaryData = null;
      try {
        const response = await FS.apiCall({
          url: `${FS.API_BASE}/api/v1/dashboard/summary`,
          type: "GET",
          xhrFields: { withCredentials: false }
        });
        if (!response || !response.success || !response.data) throw new Error("Invalid dashboard response");
        this._summaryData = response.data;
        this._state = "ready";
      } catch (error) {
        console.error("Dashboard summary API failed:", error);
        this._state = "error";
      }
    },

    _renderStatus() {
      const status = document.getElementById("dashboard-status");
      if (!status) return;
      status.innerHTML = this._state === "error"
        ? '<div class="dashboard-alert" role="alert"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i><span>Không thể tải số liệu Dashboard. Vui lòng thử lại.</span><button class="btn btn-sm btn-outline-warning ms-auto" type="button" data-dashboard-retry>Thử lại</button></div>'
        : "";
    },

    _destroyCharts() {
      this._charts.forEach((chart) => { try { chart.destroy(); } catch (_) {} });
      this._charts = [];
    },

    _renderGreeting() {
      const session = FS.auth.getSession();
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
      const name = session && session.name ? session.name.trim().split(" ").pop() : "bạn";
      const now = new Date();
      const days = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const months = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];
      document.getElementById("dash-greeting").textContent = `${greeting}, ${name}! 👋`;
      document.getElementById("dash-date").textContent = `Hôm nay là ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    },

    _setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; },

    _renderStats() {
      if (!this._summaryData) {
        ["stat-projects", "stat-tasks", "stat-overdue", "stat-hours"].forEach((id) => this._setText(id, "—"));
        ["stat-projects-sub", "stat-tasks-sub", "stat-hours-sub"].forEach((id) => this._setText(id, "Chưa có dữ liệu"));
        this._setText("stat-overdue-note", "Chưa có dữ liệu");
        return;
      }
      const data = this._summaryData;
      this._setText("stat-projects", data.activeProjects || 0);
      this._setText("stat-projects-sub", `${data.totalProjects || 0} tổng số dự án`);
      this._setText("stat-tasks", data.pendingTasks || 0);
      this._setText("stat-tasks-sub", `${data.completedTasks || 0} đã hoàn thành`);
      this._setText("stat-overdue", data.overdueTasks || 0);
      this._setText("stat-hours", `${data.totalLoggedHours || 0}h`);
      this._setText("stat-hours-sub", `${data.pendingApprovalsCount || 0} chờ duyệt`);
      const overdue = Number(data.overdueTasks) || 0;
      const note = document.getElementById("stat-overdue-note");
      if (note) {
        note.className = `fs-stat-change ${overdue ? "down" : "up"}`;
        note.innerHTML = overdue ? '<i class="bi bi-dot" aria-hidden="true"></i>Cần xử lý ngay' : '<i class="bi bi-check-circle" aria-hidden="true"></i>Không có task quá hạn';
      }
    },

    _renderMyTasks() {
      const container = document.getElementById("dash-my-tasks");
      if (!container) return;
      const tasks = this._summaryData && Array.isArray(this._summaryData.tasks) ? this._summaryData.tasks : [];
      if (!tasks.length) { container.innerHTML = emptyState("bi-check2-circle", this._state === "error" ? "Không thể tải công việc" : "Không có công việc nào"); return; }
      container.innerHTML = tasks.slice(0, 6).map((task) => {
        const overdue = task.dueDate && FS.date.isOverdue(task.dueDate);
        return `<button class="dashboard-list-item task-open-btn w-100 d-flex align-items-center gap-3 py-2 text-start border-0 bg-transparent" type="button" data-task-id="${task.id}"><i class="bi bi-${task.status === "done" ? "check-circle-fill text-success" : "circle"}" aria-hidden="true"></i><span class="flex-grow-1 text-truncate"><strong class="d-block small">${FS.str.escape(task.title)}</strong><small class="fs-small">${FS.str.escape(task.projectName || "—")}</small></span><span class="d-flex align-items-center gap-2 flex-shrink-0">${FS.badge.priority(task.priority)}<small class="${overdue ? "text-danger fw-semibold" : "text-secondary"}">${FS.date.short(task.dueDate)}</small></span></button>`;
      }).join("");
    },

    _renderProjects() {
      const container = document.getElementById("dash-active-projects");
      if (!container) return;
      const projects = this._summaryData && Array.isArray(this._summaryData.projects) ? this._summaryData.projects : [];
      if (!projects.length) { container.innerHTML = emptyState("bi-folder2", this._state === "error" ? "Không thể tải dự án" : "Không có dự án đang chạy"); return; }
      container.innerHTML = projects.slice(0, 5).map((project) => `<button class="dashboard-list-item proj-open-btn w-100 py-2 text-start border-0 bg-transparent" type="button" data-proj-id="${project.id}"><span class="d-flex align-items-center gap-2 mb-1"><strong class="small text-truncate flex-grow-1">${FS.str.escape(project.name)}</strong><span class="small fw-bold text-primary">${Number(project.progress) || 0}%</span></span><span class="fs-progress fs-progress-sm d-block mb-2"><span class="fs-progress-bar" style="width:${Math.min(100, Math.max(0, Number(project.progress) || 0))}%"></span></span><span class="d-flex justify-content-between align-items-center"><small class="fs-small">${FS.str.escape(project.ownerName || "")}</small><small class="fs-small">${FS.date.format(project.endDate)}</small></span></button>`).join("");
    },

    _renderActivityFeed() {
      const container = document.getElementById("dash-activity-feed");
      if (!container) return;
      const logs = this._summaryData && Array.isArray(this._summaryData.activities) ? this._summaryData.activities : [];
      if (!logs.length) { container.innerHTML = emptyState("bi-clock-history", this._state === "error" ? "Không thể tải hoạt động" : "Chưa có hoạt động"); return; }
      container.innerHTML = logs.slice(0, 8).map((log) => `<div class="dashboard-list-item d-flex align-items-start gap-3 py-2"><span class="fs-avatar fs-avatar-sm av-teal"><i class="bi bi-activity" aria-hidden="true"></i></span><span class="flex-grow-1"><span class="small"><strong>${FS.str.escape(log.userName || "Hệ thống")}</strong> ${FS.str.escape(log.detail || log.action || "đã cập nhật hệ thống")}</span><small class="d-block fs-small">${FS.date.relative(log.createdAt)} · ${FS.str.escape(log.module || "Hệ thống")}</small></span></div>`).join("");
    },

    _renderCharts() {
      const activityCanvas = document.getElementById("dash-activity-chart");
      const statusCanvas = document.getElementById("dash-status-chart");
      if (!this._summaryData || !window.Chart) {
        [activityCanvas, statusCanvas].filter(Boolean).forEach((canvas) => { canvas.replaceWith(Object.assign(document.createElement("div"), { className: "dashboard-empty-chart", textContent: this._state === "error" ? "Không thể tải biểu đồ" : "Chưa có dữ liệu biểu đồ" })); });
        return;
      }
      const now = new Date();
      const hours = Array(7).fill(0);
      (this._summaryData.weeklyTimeLogs || []).forEach((entry) => { const date = new Date(entry.loggedDate || entry.date); if (!Number.isNaN(date.getTime())) hours[date.getDay()] += Number(entry.hours) || 0; });
      if (activityCanvas) this._charts.push(new Chart(activityCanvas, { type: "bar", data: { labels: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], datasets: [{ label: "Giờ làm", data: hours, backgroundColor: hours.map((_, index) => index === now.getDay() ? "#6366f1" : "#e0e7ff"), borderRadius: 6, borderSkipped: false }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, grid: { color: "#f1f5f9" }, border: { display: false }, ticks: { callback: (value) => `${value}h` } } } } }));
      const counts = this._summaryData.taskStatuses || {};
      if (statusCanvas) this._charts.push(new Chart(statusCanvas, { type: "doughnut", data: { labels: ["Chưa bắt đầu", "Đang làm", "Chờ duyệt", "Hoàn thành"], datasets: [{ data: [counts.todo || 0, counts.inProgress || 0, counts.review || 0, counts.done || 0], backgroundColor: ["#e2e8f0", "#6366f1", "#f59e0b", "#10b981"], borderWidth: 2, borderColor: "#fff", hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: true, cutout: "65%", plugins: { legend: { display: false } } } }));
    },

    _bindEvents() {
      $(document).off("click.dashboard")
        .on("click.dashboard", ".task-open-btn", function () { FS.taskDetail.open($(this).data("task-id")); })
        .on("click.dashboard", ".proj-open-btn", function () { FS.projectDetail.open($(this).data("proj-id")); })
        .on("click.dashboard", "[data-dashboard-route]", function () { FS.router.go($(this).data("dashboard-route")); })
        .on("click.dashboard", "[data-dashboard-retry]", () => { FS.router.go("dashboard", { force: true, silent: true }); });
      $("#dash-new-task-btn").off("click.dashboard").on("click.dashboard", () => FS.router.go("tasks"));
    }
  };
})(window.FS = window.FS || {}, jQuery);
