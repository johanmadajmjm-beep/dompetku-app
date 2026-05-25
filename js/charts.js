let cashflowChart = null;
let trendChart = null;
let pieChart = null;

/* ── Helper: get data based on filter mode ── */
function getFilteredTrendData(mode, year, month) {
  const labels = [];
  const incomeData = [];
  const expenseData = [];

  if (mode === 'year') {
    const now = new Date();
    const y = now.getFullYear();
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    for (let m = 0; m < 12; m++) {
      labels.push(monthNames[m]);
      incomeData.push(getMonthlyTotal('income', m, y));
      expenseData.push(getMonthlyTotal('expense', m, y));
    }
  } else if (mode === 'month') {
    // 6 bulan terakhir (default)
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleString('id-ID', { month: 'short' }));
      incomeData.push(getMonthlyTotal('income', date.getMonth(), date.getFullYear()));
      expenseData.push(getMonthlyTotal('expense', date.getMonth(), date.getFullYear()));
    }
  } else if (mode === 'week') {
    // 4 minggu terakhir
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w * 7) - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      labels.push(`${weekStart.getDate()}/${weekStart.getMonth()+1}`);

      let inc = 0, exp = 0;
      appData.transactions.forEach(t => {
        const d = new Date(t.date);
        if (d >= weekStart && d <= weekEnd) {
          if (t.type === 'income') inc += Number(t.amount);
          else exp += Number(t.amount);
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
        legend: { labels: { color: 'rgba(240,244,255,0.8)', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { color: 'rgba(240,244,255,0.6)', callback: v => formatCurrency(v), font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: 'rgba(240,244,255,0.6)', font: { size: 11 } },
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

  // Inject slicer UI above canvas
  const container = canvas.parentElement;
  if (!document.getElementById('trendSlicer')) {
    const slicerHTML = `
      <div id="trendSlicer" style="
        display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap;
      ">
        <button class="slicer-btn active" data-mode="month" onclick="switchTrendMode('month')">6 Bulan</button>
        <button class="slicer-btn" data-mode="year" onclick="switchTrendMode('year')">Tahun Ini</button>
        <button class="slicer-btn" data-mode="week" onclick="switchTrendMode('week')">4 Minggu</button>
      </div>
    `;
    canvas.insertAdjacentHTML('beforebegin', slicerHTML);

    // Inject slicer styles once
    if (!document.getElementById('slicerStyles')) {
      const style = document.createElement('style');
      style.id = 'slicerStyles';
      style.textContent = `
        .slicer-btn {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(240,244,255,0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .slicer-btn.active {
          background: rgba(0,232,122,0.15);
          border-color: rgba(0,232,122,0.45);
          color: #00e87a;
        }
        .slicer-btn:active { transform: scale(0.95); }
      `;
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

function switchTrendMode(mode) {
  // Update active button
  document.querySelectorAll('.slicer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  drawTrendChart(mode);
}

/* ── Pie chart (unchanged) ── */
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
      labels: labels.map(c => `${getCategoryIcon(c)} ${c}`),
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
              return `${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}
