/**
 * FlowSpace — Reports Module
 */
(function (FS) {
  'use strict';

  FS.pages.reports = {
    _charts: [],
    _period: 'month',

    init() {
      this._renderKPIs();
      this._renderCharts();
      document.getElementById('report-period')?.addEventListener('change', (e) => {
        this._period = e.target.value;
        this._destroyCharts();
        this._renderKPIs();
        this._renderCharts();
      });

      document.getElementById('report-export-excel')?.addEventListener('click', (e) => { e.preventDefault(); this._exportExcel(); });
      document.getElementById('report-export-csv')?.addEventListener('click', (e) => { e.preventDefault(); this._exportCSV(); });
      document.getElementById('report-export-pdf')?.addEventListener('click', (e) => { e.preventDefault(); this._exportPDF(); });
    },

    _destroyCharts() {
      this._charts.forEach(c => { try { c.destroy(); } catch(e){} });
      this._charts = [];
    },

    _renderKPIs() {
      const tasks    = FS.db.get('tasks');
      const projects = FS.db.get('projects');
      const logs     = FS.db.get('time_logs');
      const users    = FS.db.get('users');

      const totalTasks    = tasks.length;
      const doneTasks     = tasks.filter(t => t.status === 'done').length;
      const completion    = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const totalHours    = logs.reduce((s, l) => s + (l.hours || 0), 0);
      const activeProj    = projects.filter(p => p.status === 'active').length;
      const overdue       = tasks.filter(t => t.status !== 'done' && FS.date.isOverdue(t.dueDate)).length;

      const kpis = [
        { icon: 'bi-folder2-open', label: 'Dự án đang chạy', value: activeProj, sub: `${projects.filter(p=>p.status==='done').length} hoàn thành`, color: '#6366f1', bg: '#eef2ff' },
        { icon: 'bi-check-circle', label: 'Tỷ lệ hoàn thành', value: completion + '%', sub: `${doneTasks}/${totalTasks} tasks`, color: '#10b981', bg: '#f0fdf4' },
        { icon: 'bi-clock',        label: 'Tổng giờ làm',     value: totalHours + 'h', sub: `${users.length} thành viên`, color: '#f59e0b', bg: '#fefce8' },
        { icon: 'bi-exclamation-triangle', label: 'Quá hạn', value: overdue, sub: 'cần xử lý ngay', color: '#ef4444', bg: '#fef2f2' }
      ];

      document.getElementById('report-kpis').innerHTML = kpis.map(k => `
        <div class="col-6 col-xl-3">
          <div class="fs-stat-card">
            <div class="fs-stat-icon" style="background:${k.bg};color:${k.color}"><i class="bi ${k.icon}"></i></div>
            <div class="fs-stat-value" style="color:${k.value === overdue && overdue > 0 ? '#ef4444' : ''}">${k.value}</div>
            <div class="fs-stat-label">${k.label}</div>
            <div class="fs-stat-change"><i class="bi bi-dot"></i> ${k.sub}</div>
          </div>
        </div>`).join('');
    },

    _renderCharts() {
      const tasks    = FS.db.get('tasks');
      const projects = FS.db.get('projects');
      const logs     = FS.db.get('time_logs');
      const users    = FS.db.get('users');

      // 1. Project progress bar chart
      const ctx1 = document.getElementById('report-project-chart');
      if (ctx1) {
        const activeProj  = projects.filter(p => p.status !== 'done');
        const c1 = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: activeProj.map(p => p.name.length > 20 ? p.name.slice(0,18)+'…' : p.name),
            datasets: [
              { label: 'Tiến độ (%)', data: activeProj.map(p => p.progress), backgroundColor: '#6366f1', borderRadius: 5, borderSkipped: false },
              { label: 'Mục tiêu', data: activeProj.map(() => 100), backgroundColor: '#e0e7ff', borderRadius: 5, borderSkipped: false }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: { grid: { color: '#f1f5f9' }, border: { display: false }, max: 100, ticks: { callback: v => v + '%' } }
            }
          }
        });
        this._charts.push(c1);
      }

      // 2. Task status donut
      const ctx2 = document.getElementById('report-status-chart');
      if (ctx2) {
        const statusCounts = ['todo','in_progress','review','done'].map(s => tasks.filter(t => t.status === s).length);
        const c2 = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['Chưa bắt đầu','Đang làm','Chờ duyệt','Hoàn thành'],
            datasets: [{ data: statusCounts, backgroundColor: ['#e2e8f0','#6366f1','#f59e0b','#10b981'], borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }]
          },
          options: {
            responsive: true, maintainAspectRatio: true, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}` } } }
          }
        });
        this._charts.push(c2);
      }

      // 3. Hours per user bar chart
      const ctx3 = document.getElementById('report-user-chart');
      if (ctx3) {
        const userHours = users.map(u => ({
          name: u.name.split(' ').pop(),
          hours: logs.filter(l => l.userId === u.id).reduce((s,l) => s + (l.hours||0), 0)
        })).sort((a, b) => b.hours - a.hours);
        const c3 = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: userHours.map(u => u.name),
            datasets: [{ label: 'Giờ làm', data: userHours.map(u => u.hours), backgroundColor: '#8b5cf6', borderRadius: 5, borderSkipped: false }]
          },
          options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + 'h' } } },
            scales: {
              x: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { callback: v => v + 'h' } },
              y: { grid: { display: false }, border: { display: false } }
            }
          }
        });
        this._charts.push(c3);
      }

      // 4. Trend line: tasks done per week (last 4 weeks)
      const ctx4 = document.getElementById('report-trend-chart');
      if (ctx4) {
        const weeks = ['3 tuần trước', '2 tuần trước', 'Tuần trước', 'Tuần này'];
        const now   = new Date();
        const weekData = weeks.map((w, i) => {
          const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - now.getDay() - (3 - i) * 7);
          const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
          return tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt) >= weekStart && new Date(t.completedAt) < weekEnd).length;
        });

        const c4 = new Chart(ctx4, {
          type: 'line',
          data: {
            labels: weeks,
            datasets: [{
              label: 'Task hoàn thành',
              data: weekData,
              borderColor: '#10b981',
              backgroundColor: '#d1fae520',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#10b981',
              pointRadius: 5
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { stepSize: 1 } }
            }
          }
        });
        this._charts.push(c4);
      }
    },

    _getReportData() {
      const tasks    = FS.db.get('tasks');
      const projects = FS.db.get('projects');
      const logs     = FS.db.get('time_logs');
      const users    = FS.db.get('users');
      
      const totalTasks = tasks.length;
      const doneTasks  = tasks.filter(t => t.status === 'done').length;
      const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
      const activeProj = projects.filter(p => p.status === 'active').length;
      
      const kpis = [
        { Muc: "Dự án đang chạy", Gia_Tri: activeProj },
        { Muc: "Tỷ lệ hoàn thành Task", Gia_Tri: completion + "%" },
        { Muc: "Tổng giờ làm", Gia_Tri: totalHours + "h" },
      ];
      
      const taskList = tasks.map(t => {
        const p = projects.find(x => x.id === t.projectId);
        const u = users.find(x => x.id === t.assigneeId);
        const statusMap = { 'todo': 'Chưa bắt đầu', 'in_progress': 'Đang làm', 'review': 'Chờ duyệt', 'done': 'Hoàn thành' };
        return {
          "Mã": t.code,
          "Tên Công Việc": t.title,
          "Dự Án": p ? p.name : '',
          "Người Phụ Trách": u ? u.name : '',
          "Trạng Thái": statusMap[t.status] || t.status,
          "Ước Tính (h)": t.estimatedHours || 0,
          "Đã Làm (h)": t.loggedHours || 0
        };
      });
      
      const userPerf = users.map(u => {
        const uTasks = tasks.filter(t => t.assigneeId === u.id);
        const uLogs = logs.filter(l => l.userId === u.id);
        return {
          "Nhân Viên": u.name,
          "Email": u.email,
          "Giờ Làm": uLogs.reduce((s,l) => s + (l.hours||0), 0),
          "Công Việc Đã Hoàn Thành": uTasks.filter(t => t.status === 'done').length,
          "Tổng Công Việc": uTasks.length
        };
      });
      
      return { kpis, taskList, userPerf };
    },

    _exportExcel() {
      if (typeof XLSX === 'undefined') { FS.toast('Thư viện Excel chưa được tải', 'error'); return; }
      const data = this._getReportData();
      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.kpis), "Tom Tat KPI");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.taskList), "Danh Sach Cong Viec");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.userPerf), "Hieu Suat Nhan Vien");
      
      XLSX.writeFile(wb, "FlowSpace_BaoCao.xlsx");
      FS.toast('Đã xuất báo cáo Excel', 'success');
    },

    _exportCSV() {
      const data = this._getReportData();
      const items = data.taskList;
      if (!items.length) { FS.toast('Không có dữ liệu', 'warning'); return; }
      
      const header = Object.keys(items[0]).join(',');
      const rows = items.map(item => Object.values(item).map(v => `"${(v+'').replace(/"/g, '""')}"`).join(','));
      const csvContent = "\uFEFF" + header + "\n" + rows.join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FlowSpace_Tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
      FS.toast('Đã xuất báo cáo CSV', 'success');
    },

    _exportPDF() {
      if (!window.jspdf) { FS.toast('Thư viện PDF chưa được tải', 'error'); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      const removeAccents = (str) => {
        if (!str) return '';
        return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
      };
      
      const data = this._getReportData();
      
      doc.setFontSize(16);
      doc.text("BAO CAO TIEN DO DU AN", 14, 20);
      
      doc.setFontSize(12);
      doc.text("1. TONG QUAN KPI", 14, 30);
      doc.autoTable({
        startY: 35,
        head: [['Chi tieu', 'Gia tri']],
        body: data.kpis.map(k => [removeAccents(k.Muc), k.Gia_Tri]),
        theme: 'grid'
      });
      
      let finalY = doc.lastAutoTable.finalY || 40;
      doc.text("2. DANH SACH CONG VIEC", 14, finalY + 10);
      doc.autoTable({
        startY: finalY + 15,
        head: [Object.keys(data.taskList[0]).map(removeAccents)],
        body: data.taskList.map(item => Object.values(item).map(removeAccents)),
        theme: 'striped',
        styles: { fontSize: 8 }
      });
      
      doc.save("FlowSpace_BaoCao.pdf");
      FS.toast('Đã xuất báo cáo PDF', 'success');
    }
  };

})(window.FS = window.FS || {});