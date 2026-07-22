(function (FS, $) {
  "use strict";

  const emptyState = (iconWithColor, message) =>
    `<div class="fs-empty py-4"><i class="bi ${iconWithColor}" aria-hidden="true"></i><p>${message}</p></div>`;

  const loadingState = () =>
    `<div class="fs-empty py-4"><div class="fs-spinner mx-auto"></div></div>`;

  FS.pages.dashboard = {
    _charts: [],
    _summaryData: null,
    _state: "loading", // "loading" | "ready" | "error"

    async init() {
      this._destroyCharts();
      this._renderGreeting();
      this._renderLoadingState();
      await this._loadSummary();
      this._renderStatus();
      this._renderStats();
      this._renderMyTasks();
      this._renderProjects();
      this._renderActivityFeed();
      this._renderCharts();
      this._bindEvents();
    },

    _renderLoadingState() {
      ["stat-projects-sub", "stat-tasks-sub", "stat-hours-sub"].forEach((id) =>
        this._setText(id, "Đang tải...")
      );
      this._setText("stat-overdue-note", "Đang tải...");

      ["dash-my-tasks", "dash-active-projects", "dash-activity-feed"].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = loadingState();
      });
    },

    async _loadSummary() {
      this._state = "loading";
      this._summaryData = null;
      try {
        const response = await FS.apiCall({
          url: `${FS.API_BASE}/api/v1/dashboard/summary`,
          type: "GET"
        });

        if (response && response.success && response.data) {
          this._summaryData = response.data;
          this._state = "ready";
          return;
        }
        throw new Error(response?.message || "Invalid dashboard response");
      } catch (error) {
        console.error("Dashboard summary API failed:", error);
        this._state = "error";
      }
    },

    _renderStatus() {
      const status = document.getElementById("dashboard-status");
      if (!status) return;
      status.innerHTML =
        this._state === "error"
          ? '<div class="dashboard-alert" role="alert"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i><span>Không thể kết nối máy chủ để tải dữ liệu Dashboard. Vui lòng kiểm tra lại.</span><button class="btn btn-sm btn-outline-warning ms-auto" type="button" data-dashboard-retry>Thử lại</button></div>'
          : "";
    },

    _destroyCharts() {
      this._charts.forEach((chart) => {
        try {
          chart.destroy();
        } catch (_) {}
      });
      this._charts = [];
    },

    _renderGreeting() {
      const session = FS.auth ? FS.auth.getSession() : null;
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
      const name = session && session.name ? session.name.trim().split(" ").pop() : "bạn";
      const now = new Date();
      const days = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const months = [
        "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
        "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
      ];
      this._setText("dash-greeting", `${greeting}, ${name}! 👋`);
      this._setText("dash-date", `Hôm nay là ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`);
    },

    _setText(id, value) {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    },

    _renderStats() {
      if (this._state === "error" || !this._summaryData) {
        ["stat-projects", "stat-tasks", "stat-overdue", "stat-hours"].forEach((id) =>
          this._setText(id, "—")
        );
        ["stat-projects-sub", "stat-tasks-sub", "stat-hours-sub"].forEach((id) =>
          this._setText(id, "Lỗi kết nối")
        );
        this._setText("stat-overdue-note", "Lỗi kết nối");
        return;
      }

      const data = this._summaryData;

      // 1. Active Projects
      const activeProj = Number(data.activeProjects) || 0;
      const totalProj = Number(data.totalProjects) || 0;
      this._setText("stat-projects", activeProj);
      const projSub = document.getElementById("stat-projects-sub");
      if (projSub) projSub.innerHTML = `<i class="bi bi-arrow-up-short me-1"></i>${totalProj} tổng số dự án`;

      // 2. Pending Tasks
      const pendingTasks = Number(data.pendingTasks) || 0;
      const completedTasks = Number(data.completedTasks) || 0;
      this._setText("stat-tasks", pendingTasks);
      const tasksChange = document.getElementById("stat-tasks-change");
      if (tasksChange) {
        tasksChange.className = "fs-stat-change up";
        tasksChange.innerHTML = `<i class="bi bi-check2-all me-1"></i><span id="stat-tasks-sub">${completedTasks} đã hoàn thành</span>`;
      }

      // 3. Overdue Tasks
      const overdue = Number(data.overdueTasks) || 0;
      this._setText("stat-overdue", overdue);
      const note = document.getElementById("stat-overdue-note");
      if (note) {
        note.className = `fs-stat-change ${overdue > 0 ? "down" : "up"}`;
        note.innerHTML =
          overdue > 0
            ? '<i class="bi bi-exclamation-triangle-fill me-1"></i><span>Cần xử lý ngay</span>'
            : '<i class="bi bi-check-circle-fill me-1"></i><span>Không có task quá hạn</span>';
      }

      // 4. Logged Hours
      const loggedHours = Number(data.totalLoggedHours) || 0;
      const formattedHours = loggedHours.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "h";
      const pendingApprovals = Number(data.pendingApprovalsCount) || 0;
      this._setText("stat-hours", formattedHours);
      const hoursSub = document.getElementById("stat-hours-sub");
      if (hoursSub) hoursSub.innerHTML = `<i class="bi bi-clock-history me-1"></i>${pendingApprovals} chờ duyệt`;
    },

    _renderMyTasks() {
      const container = document.getElementById("dash-my-tasks");
      if (!container) return;

      if (this._state === "error") {
        container.innerHTML = emptyState("bi-exclamation-triangle text-warning", "Không thể tải công việc");
        return;
      }

      const tasks = this._summaryData && Array.isArray(this._summaryData.tasks) ? this._summaryData.tasks : [];
      if (!tasks.length) {
        container.innerHTML = emptyState("bi-check2-circle text-muted", "Không có công việc nào đang thực hiện");
        return;
      }

      container.innerHTML = tasks
        .slice(0, 6)
        .map((task) => {
          const overdue = task.dueDate && FS.date.isOverdue(task.dueDate);
          const statusDone = task.status === "done";
          return `
            <button class="dashboard-list-item task-open-btn w-100 d-flex align-items-center gap-3 py-2 text-start border-0 bg-transparent" type="button" data-task-id="${task.id}">
              <i class="bi bi-${statusDone ? "check-circle-fill text-success" : "circle text-muted"}" aria-hidden="true"></i>
              <span class="flex-grow-1 text-truncate">
                <strong class="d-block small text-dark">${FS.str.escape(task.title)}</strong>
                <small class="fs-small text-secondary">${FS.str.escape(task.projectName || "—")}</small>
              </span>
              <span class="d-flex align-items-center gap-2 flex-shrink-0">
                ${FS.badge.priority(task.priority)}
                <small class="${overdue ? "text-danger fw-semibold" : "text-secondary"}">${FS.date.short(task.dueDate)}</small>
              </span>
            </button>
          `;
        })
        .join("");
    },

    _renderProjects() {
      const container = document.getElementById("dash-active-projects");
      if (!container) return;

      if (this._state === "error") {
        container.innerHTML = emptyState("bi-exclamation-triangle text-warning", "Không thể tải danh sách dự án");
        return;
      }

      const projects = this._summaryData && Array.isArray(this._summaryData.projects) ? this._summaryData.projects : [];
      if (!projects.length) {
        container.innerHTML = emptyState("bi-folder2 text-muted", "Không có dự án nào đang chạy");
        return;
      }

      container.innerHTML = projects
        .slice(0, 5)
        .map((project) => {
          const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
          return `
            <button class="dashboard-list-item proj-open-btn w-100 py-2 text-start border-0 bg-transparent" type="button" data-proj-id="${project.id}">
              <span class="d-flex align-items-center gap-2 mb-1">
                <strong class="small text-dark text-truncate flex-grow-1">${FS.str.escape(project.name)}</strong>
                <span class="small fw-bold text-primary">${progress}%</span>
              </span>
              <span class="fs-progress fs-progress-sm d-block mb-2">
                <span class="fs-progress-bar" style="width:${progress}%"></span>
              </span>
              <span class="d-flex justify-content-between align-items-center">
                <small class="fs-small text-secondary"><i class="bi bi-person me-1"></i>${FS.str.escape(project.ownerName || "—")}</small>
                <small class="fs-small text-secondary"><i class="bi bi-calendar3 me-1"></i>${FS.date.format(project.endDate)}</small>
              </span>
            </button>
          `;
        })
        .join("");
    },

    _renderActivityFeed() {
      const container = document.getElementById("dash-activity-feed");
      if (!container) return;

      if (this._state === "error") {
        container.innerHTML = emptyState("bi-exclamation-triangle text-warning", "Không thể tải nhật ký hoạt động");
        return;
      }

      const logs = this._summaryData && Array.isArray(this._summaryData.activities) ? this._summaryData.activities : [];
      if (!logs.length) {
        container.innerHTML = emptyState("bi-clock-history text-muted", "Chưa có hoạt động nào gần đây");
        return;
      }

      container.innerHTML = logs
        .slice(0, 8)
        .map((log) => `
          <div class="dashboard-list-item d-flex align-items-start gap-3 py-2">
            <span class="fs-avatar fs-avatar-sm av-teal"><i class="bi bi-activity" aria-hidden="true"></i></span>
            <span class="flex-grow-1">
              <span class="small text-dark"><strong>${FS.str.escape(log.userName || "Hệ thống")}</strong> ${FS.str.escape(log.detail || log.action || "đã thực hiện thao tác")}</span>
              <small class="d-block fs-small text-secondary">${FS.date.relative(log.createdAt)} · ${FS.str.escape(log.module || "Hệ thống")}</small>
            </span>
          </div>
        `)
        .join("");
    },

    _renderCharts() {
      const $actCanvas = $("#dash-activity-chart");
      const $actEmpty = $("#dash-activity-empty");
      const $statCanvas = $("#dash-status-chart");
      const $statEmpty = $("#dash-status-empty");

      if (this._state === "error" || !this._summaryData || !window.Chart) {
        $actCanvas.addClass("d-none");
        $actEmpty.text(this._state === "error" ? "Không thể tải dữ liệu biểu đồ" : "Chưa có dữ liệu").removeClass("d-none");
        $statCanvas.addClass("d-none");
        $statEmpty.text(this._state === "error" ? "Không thể tải dữ liệu biểu đồ" : "Chưa có dữ liệu").removeClass("d-none");
        return;
      }

      // 1. Weekly Activity Bar Chart
      const weeklyLogs = this._summaryData.weeklyTimeLogs || [];
      const hoursByDay = [0, 0, 0, 0, 0, 0, 0]; // CN, T2, T3, T4, T5, T6, T7
      weeklyLogs.forEach((entry) => {
        const rawDate = entry.loggedDate || entry.date || entry.createdAt;
        if (!rawDate) return;
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          hoursByDay[d.getDay()] += Number(entry.hours) || 0;
        }
      });

      const formattedHours = hoursByDay.map((h) => Math.round(h * 10) / 10);
      const todayDayIdx = new Date().getDay();

      if ($actCanvas.length) {
        $actEmpty.addClass("d-none");
        $actCanvas.removeClass("d-none");

        const actCtx = $actCanvas[0].getContext("2d");
        const existingActChart = Chart.getChart(actCtx);
        if (existingActChart) {
          existingActChart.destroy();
        }

        this._charts.push(
          new Chart(actCtx, {
            type: "bar",
            data: {
              labels: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
              datasets: [
                {
                  label: "Giờ làm",
                  data: formattedHours,
                  backgroundColor: formattedHours.map((_, idx) => (idx === todayDayIdx ? "#6366f1" : "#e0e7ff")),
                  hoverBackgroundColor: formattedHours.map((_, idx) => (idx === todayDayIdx ? "#4f46e5" : "#c7d2fe")),
                  borderRadius: 6,
                  borderSkipped: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `Giờ làm: ${context.parsed.y}h`
                  }
                }
              },
              scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: {
                  beginAtZero: true,
                  grid: { color: "#f1f5f9" },
                  border: { display: false },
                  ticks: { callback: (value) => `${value}h` }
                }
              }
            }
          })
        );
      }

      // 2. Task Status Doughnut Chart
      const counts = this._summaryData.taskStatuses || {};
      const statusData = [counts.todo || 0, counts.inProgress || 0, counts.review || 0, counts.done || 0];
      const totalStatusTasks = statusData.reduce((a, b) => a + b, 0);

      if ($statCanvas.length) {
        if (totalStatusTasks === 0) {
          $statCanvas.addClass("d-none");
          $statEmpty.text("Chưa có dữ liệu trạng thái công việc").removeClass("d-none");
        } else {
          $statEmpty.addClass("d-none");
          $statCanvas.removeClass("d-none");

          const statCtx = $statCanvas[0].getContext("2d");
          const existingStatChart = Chart.getChart(statCtx);
          if (existingStatChart) {
            existingStatChart.destroy();
          }

          this._charts.push(
            new Chart(statCtx, {
              type: "doughnut",
              data: {
                labels: ["Chưa bắt đầu", "Đang làm", "Chờ duyệt", "Hoàn thành"],
                datasets: [
                  {
                    data: statusData,
                    backgroundColor: ["#cbd5e1", "#6366f1", "#f59e0b", "#10b981"],
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    hoverOffset: 4
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "65%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${context.parsed} công việc`
                    }
                  }
                }
              }
            })
          );
        }
      }
    },

    _bindEvents() {
      $(document)
        .off("click.dashboard")
        .on("click.dashboard", ".task-open-btn", function () {
          const taskId = $(this).data("task-id");
          if (taskId && FS.taskDetail) FS.taskDetail.open(taskId);
        })
        .on("click.dashboard", ".proj-open-btn", function () {
          const projId = $(this).data("proj-id");
          if (projId && FS.projectDetail) FS.projectDetail.open(projId);
        })
        .on("click.dashboard", "[data-dashboard-route]", function () {
          const route = $(this).data("dashboard-route");
          if (route && FS.router) FS.router.go(route);
        })
        .on("click.dashboard", "[data-dashboard-retry]", () => {
          if (FS.router) FS.router.go("dashboard", { force: true, silent: true });
        });

      $("#dash-new-task-btn")
        .off("click.dashboard")
        .on("click.dashboard", () => {
          if (FS.router) FS.router.go("tasks");
        });

      $("#dash-seed-btn")
        .off("click.dashboard")
        .on("click.dashboard", async () => {
          const btn = $("#dash-seed-btn");
          btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang nạp...');
          try {
            const res = await FS.apiCall({
              url: `${FS.API_BASE}/api/v1/dashboard/seed-data`,
              type: "POST"
            });
            if (res && res.success) {
              if (FS.toast) FS.toast("Đã nạp bộ dữ liệu doanh nghiệp mẫu thành công!", "success");
              if (FS.router) FS.router.go("dashboard", { force: true, silent: true });
            } else {
              if (FS.toast) FS.toast(res?.message || "Không thể nạp dữ liệu mẫu.", "error");
            }
          } catch (e) {
            console.error("Seed data failed:", e);
            if (FS.toast) FS.toast("Lỗi khi nạp dữ liệu mẫu từ máy chủ.", "error");
          } finally {
            btn.prop("disabled", false).html('<i class="bi bi-database-add me-1"></i> Seed dữ liệu');
          }
        });
    }
  };
})(window.FS = window.FS || {}, jQuery);

