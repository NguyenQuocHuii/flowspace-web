/**
 * FlowSpace — Dashboard Page Module
 * Module 7: Connected to REST API (/api/v1/dashboard/summary)
 */
(function (FS, $) {
  "use strict";

  FS.pages.dashboard = {
    _charts: [],
    _summaryData: null,

    async init() {
      this._destroyCharts();
      this._renderGreeting();
      await this._loadSummary();
      this._renderStats();
      this._renderMyTasks();
      this._renderProjects();
      this._renderActivityFeed();
      this._renderCharts();
      this._bindEvents();
    },

    _getAuthHeaders() {
      const session = FS.auth.getSession();
      return session && session.token ? { 'Authorization': 'Bearer ' + session.token } : {};
    },

    async _loadSummary() {
      try {
        const response = await FS.apiCall({
          url: FS.API_BASE + '/api/v1/dashboard/summary',
          type: 'GET'
        });

        if (response && response.success && response.data) {
          this._summaryData = response.data;
          $('#dashboard-offline-banner').remove();
        }
      } catch (err) {
        console.warn('Dashboard summary API failed:', err);
        if (!$('#dashboard-offline-banner').length) {
          $('#page-content').prepend('<div id="dashboard-offline-banner" class="fs-login-alert show" style="display:flex; margin-bottom:16px"><i class="bi bi-exclamation-triangle-fill"></i><span>Không thể kết nối máy chủ. Hiện đang hiển thị số liệu thống kê tạm thời ngoại tuyến.</span></div>');
        }
      }
    },

    _destroyCharts() {
      this._charts.forEach((c) => {
        try {
          c.destroy();
        } catch (e) { }
      });
      this._charts = [];
    },

    _renderGreeting() {
      const session = FS.auth.getSession();
      const hour = new Date().getHours();
      let greeting = "Chào buổi";
      if (hour < 12) greeting = "Chào buổi sáng";
      else if (hour < 18) greeting = "Chào buổi chiều";
      else greeting = "Chào buổi tối";

      const firstName = session ? session.name.split(" ").pop() : "";
      document.getElementById("dash-greeting").textContent =
        `${greeting}, ${firstName}! 👋`;

      const days = [
        "Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
      ];
      const months = [
        "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
        "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
      ];
      const now = new Date();
      document.getElementById("dash-date").textContent =
        `Hôm nay là ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    },

    _renderStats() {
      if (this._summaryData) {
        document.getElementById("stat-projects").textContent = this._summaryData.activeProjects || 0;
        document.getElementById("stat-projects-sub").textContent = `${this._summaryData.totalProjects || 0} tổng số dự án`;
        document.getElementById("stat-tasks").textContent = this._summaryData.pendingTasks || 0;
        document.getElementById("stat-tasks-sub").textContent = `${this._summaryData.completedTasks || 0} đã hoàn thành`;
        document.getElementById("stat-overdue").textContent = this._summaryData.overdueTasks || 0;
        document.getElementById("stat-hours").textContent = `${this._summaryData.totalLoggedHours || 0}h`;
        document.getElementById("stat-hours-sub").textContent = `${this._summaryData.pendingApprovalsCount || 0} chờ duyệt`;

        if ((this._summaryData.overdueTasks || 0) === 0) {
          const $note = document.getElementById("stat-overdue-note");
          if ($note) {
            $note.innerHTML = '<i class="bi bi-check-circle"></i> Không có task quá hạn';
            $note.className = "fs-stat-change up";
          }
        }
        return;
      }

      // LocalStorage fallback
      const session = FS.auth.getSession();
      const tasks = FS.db.get("tasks") || [];
      const projects = FS.db.get("projects") || [];
      const logs = FS.db.get("time_logs") || [];
      const now = new Date();

      const myTasks = FS.auth.isDirector() ? tasks : tasks.filter((t) => t.assigneeId === session?.userId);
      const inProgress = myTasks.filter((t) => t.status === "in_progress").length;
      const overdueList = myTasks.filter((t) => t.status !== "done" && t.status !== "cancelled" && FS.date.isOverdue(t.dueDate));
      const activeProjects = projects.filter((p) => p.status === "active");

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekLogs = logs.filter((l) => {
        const d = new Date(l.date);
        return (!session || l.userId === session.userId) && d >= weekStart;
      });
      const totalHours = weekLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

      document.getElementById("stat-projects").textContent = activeProjects.length;
      document.getElementById("stat-projects-sub").textContent = `${projects.filter((p) => p.status === "done").length} đã hoàn thành`;
      document.getElementById("stat-tasks").textContent = inProgress;
      document.getElementById("stat-tasks-sub").textContent = `${myTasks.filter((t) => t.status === "todo").length} chờ bắt đầu`;
      document.getElementById("stat-overdue").textContent = overdueList.length;
      document.getElementById("stat-hours").textContent = `${totalHours}h`;
      document.getElementById("stat-hours-sub").textContent = `${weekLogs.length} phiên ghi nhận`;

      if (overdueList.length === 0) {
        const $note = document.getElementById("stat-overdue-note");
        if ($note) {
          $note.innerHTML = '<i class="bi bi-check-circle"></i> Không có task quá hạn';
          $note.className = "fs-stat-change up";
        }
      }
    },

    _renderMyTasks() {
      const session = FS.auth.getSession();
      const tasks = FS.db.get("tasks") || [];
      const myTasks = FS.auth.isDirector() ? tasks : tasks.filter((t) => t.assigneeId === session?.userId);

      const sorted = myTasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6);

      const $container = document.getElementById("dash-my-tasks");
      if (!$container) return;

      if (!sorted.length) {
        $container.innerHTML = '<div class="fs-empty"><i class="bi bi-check2-circle"></i><p>Không có công việc nào!</p></div>';
        return;
      }

      $container.innerHTML = sorted.map((t) => {
        const overdue = FS.date.isOverdue(t.dueDate);
        const project = FS.db.find("projects", t.projectId);
        return `
          <div class="d-flex align-items-center gap-3 py-2 hover-row cursor-pointer task-open-btn" data-task-id="${t.id}" style="border-bottom:1px solid var(--fs-border)">
            <i class="bi bi-${t.status === "done" ? "check-circle-fill text-success" : "circle"}" style="font-size:16px;flex-shrink:0;color:var(--fs-border)"></i>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500" class="truncate">${FS.str.escape(t.title)}</div>
              <div class="fs-small">${project ? FS.str.escape(project.name) : "—"}</div>
            </div>
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
              ${FS.badge.priority(t.priority)}
              <span style="font-size:11px;${overdue ? "color:var(--fs-danger);font-weight:600" : "color:var(--fs-text-muted)"}">${FS.date.short(t.dueDate)}</span>
            </div>
          </div>`;
      }).join("");
    },

    _renderProjects() {
      const projects = (FS.db.get("projects") || [])
        .filter((p) => p.status === "active")
        .slice(0, 5);
      const $container = document.getElementById("dash-active-projects");

      if (!$container) return;

      if (!projects.length) {
        $container.innerHTML = '<div class="fs-empty"><i class="bi bi-folder2"></i><p>Không có dự án nào</p></div>';
        return;
      }

      $container.innerHTML = projects.map((p) => {
        const members = (p.members || [])
          .slice(0, 3)
          .map((id) => {
            const u = FS.db.find("users", id);
            return u ? `<div class="fs-avatar fs-avatar-sm ${u.color}" title="${FS.str.escape(u.name)}">${u.avatar}</div>` : "";
          })
          .join("");

        return `
          <div class="py-2 hover-row cursor-pointer proj-open-btn" data-proj-id="${p.id}" style="border-bottom:1px solid var(--fs-border)">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span style="font-size:13px;font-weight:500;flex:1" class="truncate">${FS.str.escape(p.name)}</span>
              <span style="font-size:11px;font-weight:700;color:var(--fs-accent)">${p.progress}%</span>
            </div>
            <div class="fs-progress fs-progress-sm mb-2">
              <div class="fs-progress-bar" style="width:${p.progress}%"></div>
            </div>
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex gap-1">${members}</div>
              <span class="fs-small">${FS.date.format(p.endDate)}</span>
            </div>
          </div>`;
      }).join("");
    },

    _renderActivityFeed() {
      const logs = (FS.db.get("system_logs") || []).slice(0, 8);
      const $container = document.getElementById("dash-activity-feed");
      if (!$container) return;

      const iconMap = {
        LOGIN: { icon: "bi-box-arrow-in-right", color: "av-blue" },
        LOGOUT: { icon: "bi-box-arrow-right", color: "av-teal" },
        CREATE: { icon: "bi-plus-circle", color: "av-green" },
        UPDATE: { icon: "bi-pencil", color: "av-amber" },
        ASSIGN: { icon: "bi-person-plus", color: "av-violet" },
        APPROVE: { icon: "bi-shield-check", color: "av-green" },
        REJECT: { icon: "bi-shield-x", color: "av-rose" },
        UPLOAD: { icon: "bi-cloud-upload", color: "av-cyan" },
        COMMENT: { icon: "bi-chat-dots", color: "av-indigo" },
        SETTINGS: { icon: "bi-gear", color: "av-orange" },
      };

      $container.innerHTML = logs.map((log) => {
        const user = FS.db.find("users", log.userId);
        const meta = iconMap[log.action] || { icon: "bi-circle", color: "av-teal" };
        return `
          <div class="d-flex align-items-start gap-3 py-2" style="border-bottom:1px solid var(--fs-border)">
            <div class="fs-avatar fs-avatar-sm ${meta.color}"><i class="bi ${meta.icon}"></i></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px">
                <strong>${user ? FS.str.escape(user.name) : "System"}</strong>
                <span class="text-secondary"> ${FS.str.escape(log.detail)}</span>
              </div>
              <div class="fs-small">${FS.date.relative(log.createdAt)} · ${FS.str.escape(log.module)}</div>
            </div>
          </div>`;
      }).join("") || '<div class="fs-empty"><i class="bi bi-clock-history"></i><p>Chưa có hoạt động</p></div>';
    },

    _renderCharts() {
      const ctx1 = document.getElementById("dash-activity-chart");
      if (!ctx1) return;

      const logs = FS.db.get("time_logs") || [];
      const session = FS.auth.getSession();
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const now = new Date();
      const dayData = Array(7).fill(0);

      logs.forEach((l) => {
        if (!FS.auth.isDirector() && l.userId !== session?.userId) return;
        const d = new Date(l.date);
        const dayOfWeek = d.getDay();
        const diff = Math.floor((now - d) / 86400000);
        if (diff <= 6) dayData[dayOfWeek] += l.hours || 0;
      });

      const chartLabels = [];
      const chartData = [];
      for (let i = 0; i < 7; i++) {
        chartLabels.push(days[i]);
        chartData.push(dayData[i]);
      }

      const accentColor = "#6366f1";
      const chart1 = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: chartLabels,
          datasets: [{
            label: "Giờ làm",
            data: chartData,
            backgroundColor: chartLabels.map((_, i) => i === now.getDay() ? accentColor : "#e0e7ff"),
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: accentColor,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ctx.raw + "h" } },
          },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: "#f1f5f9" }, border: { display: false }, ticks: { callback: (v) => v + "h" } },
          },
        },
      });
      this._charts.push(chart1);

      const ctx2 = document.getElementById("dash-status-chart");
      if (!ctx2) return;

      const tasks = FS.auth.isDirector() ? (FS.db.get("tasks") || []) : (FS.db.get("tasks") || []).filter((t) => t.assigneeId === session?.userId);
      const statusCount = {
        todo: tasks.filter((t) => t.status === "todo").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        review: tasks.filter((t) => t.status === "review").length,
        done: tasks.filter((t) => t.status === "done").length,
      };

      const chart2 = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["Chưa bắt đầu", "Đang làm", "Chờ duyệt", "Hoàn thành"],
          datasets: [{
            data: [statusCount.todo, statusCount.in_progress, statusCount.review, statusCount.done],
            backgroundColor: ["#e2e8f0", "#6366f1", "#f59e0b", "#10b981"],
            borderWidth: 2,
            borderColor: "#fff",
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: "65%",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} task` } },
          },
        },
      });
      this._charts.push(chart2);
    },

    _bindEvents() {
      $(document).off("click.dash").on("click.dash", ".task-open-btn", function () {
        FS.taskDetail.open($(this).data("task-id"));
      });
      $(document).on("click.dash", ".proj-open-btn", function () {
        FS.projectDetail.open($(this).data("proj-id"));
      });
      $("#dash-new-task-btn").off("click").on("click", function () {
        FS.router.go("tasks");
      });
    },
  };
})((window.FS = window.FS || {}));
