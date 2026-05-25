let cashflowChart = null;
let trendChart = null;
let pieChart = null;

function getSixMonthFinanceData() {
  const labels = [];
  const incomeData = [];
  const expenseData = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(date.toLocaleString('id-ID', { month: 'short' }));

    incomeData.push(getMonthlyTotal('income', date.getMonth(), date.getFullYear()));
    expenseData.push(getMonthlyTotal('expense', date.getMonth(), date.getFullYear()));
  }

  return { labels, incomeData, expenseData };
}

function renderCashflowChart() {
  const canvas = document.getElementById('cashflowChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const data = getSixMonthFinanceData();

  if (cashflowChart) cashflowChart.destroy();

  cashflowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: data.incomeData,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0,255,136,.08)',
          tension: .4,
          fill: true
        },
        {
          label: 'Pengeluaran',
          data: data.expenseData,
          borderColor: '#ff4757',
          backgroundColor: 'rgba(255,71,87,.08)',
          tension: .4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { color: '#fff', callback: value => formatCurrency(value) },
          grid: { color: 'rgba(255,255,255,.06)' }
        },
        x: {
          ticks: { color: '#fff' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderIncomeExpenseTrendChart() {
  const canvas = document.getElementById('incomeExpenseTrendChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const data = getSixMonthFinanceData();

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: data.incomeData,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0,255,136,.08)',
          tension: .4,
          fill: true
        },
        {
          label: 'Pengeluaran',
          data: data.expenseData,
          borderColor: '#ff4757',
          backgroundColor: 'rgba(255,71,87,.08)',
          tension: .4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { color: '#fff', callback: value => formatCurrency(value) },
          grid: { color: 'rgba(255,255,255,.06)' }
        },
        x: {
          ticks: { color: '#fff' },
          grid: { display: false }
        }
      }
    }
  });
}

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
          '#00ff88',
          '#ff4757',
          '#ffa502',
          '#1e90ff',
          '#9b59b6',
          '#e84393',
          '#00cec9',
          '#fdcb6e',
          '#6c5ce7',
          '#a4b0be'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#fff', font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = total ? ((context.raw / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${formatCurrency(context.raw)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}
