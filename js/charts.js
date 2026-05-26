let cashflowChart = null;
let trendChart = null;
let pieChart = null;

/* ── Helper: get data based on filter mode ── */
function getFilteredTrendData(mode) {
  const labels     = [];
  const incomeData = [];
  const expenseData= [];
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now        = new Date();
  const nowYear    = now.getFullYear();
  const nowMonth   = now.getMonth();

  // Cari range transaksi yang benar-benar ada data
  function getEarliestDate() {
    if (!appData.transactions || appData.transactions.length === 0) return null;
    let earliest = null;
    appData.transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (!isNaN(d) && (earliest === null || d < earliest)) earliest = d;
    });
    return earliest;
  }

  function getLatestDate() {
    if (!appData.transactions || appData.transactions.length === 0) return now;
    let latest = now;
    appData.transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (!isNaN(d) && d > latest) latest = d;
    });
    return latest;
  }

  function monthTotal(type, month, year) {
    return appData.transactions
      .filter(t => {
        if (!t.date || t.type !== type) return false;
        const d = new Date(t.date);
        return !isNaN(d) && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  if (mode === 'year') {
    // Tampilkan dari tahun transaksi pertama sampai tahun terbaru (maks 5 tahun)
    const earliest = getEarliestDate();
    const latest   = getLatestDate();
    const startYear = earliest ? earliest.getFullYear() : nowYear;
    const endYear   = latest.getFullYear();
    const fromYear  = Math.max(startYear, endYear - 4);

    for (let y = fromYear; y <= endYear; y++) {
      labels.push(String(y));
      let inc = 0, exp = 0;
      for (let m = 0; m < 12; m++) {
        inc += monthTotal('income',  m, y);
        exp += monthTotal('expense', m, y);
      }
      incomeData.push(inc);
      expenseData.push(exp);
    }

  } else if (mode === 'month') {
    const earliest = getEarliestDate();
    const latest   = getLatestDate();

    if (!earliest) {
      for (let i = 2; i >= 0; i--) {
        const d  = new Date(nowYear, nowMonth - i, 1);
        labels.push(monthNames[d.getMonth()] + '-' + String(d.getFullYear()).slice(2));
        incomeData.push(0);
        expenseData.push(0);
      }
    } else {
      const startM = earliest.getMonth();
      const startY = earliest.getFullYear();
      const endM   = latest.getMonth();
      const endY   = latest.getFullYear();

      let diffMonth = (endY - startY) * 12 + (endM - startM);
      if (diffMonth > 23) diffMonth = 23; // maks 24 bulan

      for (let i = diffMonth; i >= 0; i--) {
        const d  = new Date(endY, endM - i, 1);
        const mn = d.getMonth();
        const yr = d.getFullYear();
        labels.push(monthNames[mn] + '-' + String(yr).slice(2));
        incomeData.push(monthTotal('income',  mn, yr));
        expenseData.push(monthTotal('expense', mn, yr));
      }
    }

  } else if (mode === 'week') {
    // Dari minggu pertama ada transaksi sampai minggu ini
    const earliest = getEarliestDate();
    const latest   = getLatestDate();

    function getWeekNumber(date) {
      const start   = new Date(date.getFullYear(), 0, 1);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return Math.ceil(((date - start) / oneWeek) + 1);
    }

    function getMondayOfDate(date) {
      const d   = new Date(date);
      const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    const startMonday = earliest ? getMondayOfDate(earliest) : getMondayOfDate(new Date(nowYear, nowMonth - 1, 1));
    const endMonday   = getMondayOfDate(latest);

    // Hitung jumlah minggu
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let totalWeeks  = Math.round((endMonday - startMonday) / msPerWeek);
    if (totalWeeks > 15) totalWeeks = 15; // maks 16 minggu

    for (let w = totalWeeks; w >= 0; w--) {
      const monday = new Date(endMonday);
      monday.setDate(endMonday.getDate() - (w * 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const wn  = getWeekNumber(monday);
      labels.push('W' + wn + '/' + monthNames[monday.getMonth()]);

      let inc = 0, exp = 0;
      appData.transactions.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (!isNaN(d) && d >= monday && d <= sunday) {
          if (t.type === 'income') inc += Number(t.amount || 0);
          else exp += Number(t.amount || 0);
        }
      });
      incomeData.push(inc);
      expenseData.push(exp);
    }
  }

  return { labels, incomeData, expenseData };
}

function getSixMonthFinanceData() {
  return getFilteredTrendData('month');
}

/* ── Format short: 1.5jt, 500rb, dst ── */
function formatShort(value) {
  if (value >= 1000000000) return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1000000)    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  if (value >= 1000)       return (value / 1000).toFixed(0) + 'rb';
  return value.toString();
}

/* ── Build chart config ── */
function buildTrendChartConfig(data) {
  return {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: data.incomeData,
          borderColor: '#00e87a',
          backgroundColor: 'rgba(0,232,122,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#00e87a',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Pengeluaran',
          data: data.expenseData,
          borderColor: '#ff4757',
          backgroundColor: 'rgba(255,71,87,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff4757',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 500, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(240,244,255,0.8)',
            font: { size: 12 },
            usePointStyle: true,
            pointStyle: 'rect',
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.label + ': ' + formatCurrency(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: 'rgba(240,244,255,0.6)',
            font: { size: 11 },
            callback: v => formatShort(v)
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: 'rgba(240,244,255,0.6)', font: { size: 10 }, maxRotation: 45 },
          grid: { display: false }
        }
      }
    }
  };
}

/* ── Dashboard cashflow chart (no slicer) ── */
function renderCashflowChart() {
  const canvas = document.getElementById('cashflowChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = getSixMonthFinanceData();
  if (cashflowChart) cashflowChart.destroy();
  cashflowChart = new Chart(ctx, buildTrendChartConfig(data));
}

/* ── Analisis trend chart WITH slicer ── */
function renderIncomeExpenseTrendChart() {
  const canvas = document.getElementById('incomeExpenseTrendChart');
  if (!canvas) return;

  if (!document.getElementById('trendSlicer')) {
    const slicerHTML =
      '<div id="trendSlicer" style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">' +
        '<button class="slicer-btn active" data-mode="month" onclick="switchTrendMode(\'month\')">Bulan</button>' +
        '<button class="slicer-btn" data-mode="year" onclick="switchTrendMode(\'year\')">Tahun</button>' +
        '<button class="slicer-btn" data-mode="week" onclick="switchTrendMode(\'week\')">Minggu</button>' +
      '</div>';
    canvas.insertAdjacentHTML('beforebegin', slicerHTML);

    if (!document.getElementById('slicerStyles')) {
      const style = document.createElement('style');
      style.id = 'slicerStyles';
      style.textContent =
        '.slicer-btn{padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(240,244,255,0.6);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s ease;}' +
        '.slicer-btn.active{background:rgba(0,232,122,0.15);border-color:rgba(0,232,122,0.45);color:#00e87a;}' +
        '.slicer-btn:active{transform:scale(0.95);}';
      document.head.appendChild(style);
    }
  }

  drawTrendChart('month');
}

function drawTrendChart(mode) {
  const canvas = document.getElementById('incomeExpenseTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = getFilteredTrendData(mode);
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, buildTrendChartConfig(data));
}

window.switchTrendMode = function(mode) {
  document.querySelectorAll('.slicer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  drawTrendChart(mode);
};

/* ── Pie chart ── */
function renderExpensePieChart() {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const categoryMap = {};

  appData.transactions.forEach(t => {
    if (t.type === 'expense') {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    }
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels.map(c => getCategoryIcon(c) + ' ' + c),
      datasets: [{
        data: values,
        backgroundColor: [
          '#00e87a','#ff4757','#ffa502','#1e90ff',
          '#9b59b6','#e84393','#00cec9','#fdcb6e',
          '#6c5ce7','#a4b0be'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'rgba(240,244,255,0.8)', font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ctx.label + ': ' + formatCurrency(ctx.raw) + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

/* ── Bar chart per kategori ── */
let expenseBarChart = null;
let incomeBarChart  = null;

function buildBarConfig(labels, values, color, labelName) {
  return {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: labelName,
        data: values,
        backgroundColor: color,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => formatCurrency(ctx.raw) }
        }
      },
      scales: {
        y: {
          ticks: { color: 'rgba(240,244,255,0.6)', font: { size: 11 }, callback: v => formatShort(v) },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: 'rgba(240,244,255,0.7)', font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  };
}

function renderExpenseBarChart() {
  const canvas = document.getElementById('expenseBarChart');
  if (!canvas) return;

  const categoryMap = {};
  appData.transactions.forEach(t => {
    if (t.type === 'expense') {
      const icon = getCategoryIcon(t.category);
      const key  = icon + ' ' + t.category;
      categoryMap[key] = (categoryMap[key] || 0) + Number(t.amount);
    }
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  if (expenseBarChart) expenseBarChart.destroy();
  expenseBarChart = new Chart(canvas.getContext('2d'),
    buildBarConfig(labels, values, 'rgba(255,71,87,0.75)', 'Pengeluaran'));
}

function renderIncomeBarChart() {
  const canvas = document.getElementById('incomeBarChart');
  if (!canvas) return;

  const categoryMap = {};
  appData.transactions.forEach(t => {
    if (t.type === 'income') {
      const icon = getCategoryIcon(t.category);
      const key  = icon + ' ' + t.category;
      categoryMap[key] = (categoryMap[key] || 0) + Number(t.amount);
    }
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  if (incomeBarChart) incomeBarChart.destroy();
  incomeBarChart = new Chart(canvas.getContext('2d'),
    buildBarConfig(labels, values, 'rgba(0,232,122,0.75)', 'Pemasukan'));
}
