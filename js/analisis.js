document.addEventListener('DOMContentLoaded', () => {
  renderAnalysis();
});

function renderAnalysis() {
  updateAnalysisStats();
  renderIncomeExpenseTrendChart();
  renderExpenseBarChart();
  renderIncomeBarChart();
  renderTrendInfo();
}

function updateAnalysisStats() {
  const incomes  = appData.transactions.filter(t => t.type === 'income');
  const expenses = appData.transactions.filter(t => t.type === 'expense');

  const avgIncome  = incomes.length  ? incomes.reduce((s,t)  => s + Number(t.amount), 0) / incomes.length  : 0;
  const avgExpense = expenses.length ? expenses.reduce((s,t) => s + Number(t.amount), 0) / expenses.length : 0;

  document.getElementById('totalTransactions').innerText = appData.transactions.length;
  document.getElementById('avgIncome').innerText  = formatCurrency(avgIncome);
  document.getElementById('avgExpense').innerText = formatCurrency(avgExpense);
}

function renderTrendInfo() {
  const container = document.getElementById('trendInfo');
  if (!container) return;

  const now      = new Date();
  const curMonth = now.getMonth();
  const curYear  = now.getFullYear();
  const prev     = new Date(curYear, curMonth - 1, 1);

  const curIncome  = getMonthlyTotal('income',  curMonth, curYear);
  const curExpense = getMonthlyTotal('expense', curMonth, curYear);
  const lastIncome  = getMonthlyTotal('income',  prev.getMonth(), prev.getFullYear());
  const lastExpense = getMonthlyTotal('expense', prev.getMonth(), prev.getFullYear());

  const incomeChange  = lastIncome  > 0 ? ((curIncome  - lastIncome)  / lastIncome)  * 100 : 0;
  const expenseChange = lastExpense > 0 ? ((curExpense - lastExpense) / lastExpense) * 100 : 0;
  const balance = curIncome - curExpense;

  const sign = v => v >= 0 ? '+' : '';
  const cls  = v => v >= 0 ? 'positive' : 'negative';

  container.innerHTML = `
    <div class="ringkasan-grid">
      <div class="ringkasan-item">
        <div class="ringkasan-label">Masuk</div>
        <div class="ringkasan-value positive">${formatCurrency(curIncome)}</div>
      </div>
      <div class="ringkasan-item">
        <div class="ringkasan-label">Keluar</div>
        <div class="ringkasan-value negative">${formatCurrency(curExpense)}</div>
      </div>
      <div class="ringkasan-item">
        <div class="ringkasan-label">Selisih</div>
        <div class="ringkasan-value ${cls(balance)}">${formatCurrency(balance)}</div>
      </div>
      <div class="ringkasan-item">
        <div class="ringkasan-label">vs Bulan Lalu</div>
        <div class="ringkasan-value ${cls(incomeChange)}">${sign(incomeChange)}${incomeChange.toFixed(1)}%</div>
      </div>
      <div class="ringkasan-item full">
        <div class="ringkasan-label">Perubahan Pengeluaran</div>
        <div class="ringkasan-value ${cls(-expenseChange)}">${sign(expenseChange)}${expenseChange.toFixed(1)}% vs bulan lalu</div>
      </div>
    </div>
  `;
}
