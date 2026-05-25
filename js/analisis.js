document.addEventListener('DOMContentLoaded', () => {
  renderAnalysis();
});

function renderAnalysis() {
  updateAnalysisStats();
  renderIncomeExpenseTrendChart();
  renderExpensePieChart();
  renderTrendInfo();
}

function updateAnalysisStats() {
  const totalTransactions = appData.transactions.length;

  const incomes = appData.transactions.filter(t => t.type === 'income');
  const expenses = appData.transactions.filter(t => t.type === 'expense');

  const avgIncome = incomes.length
    ? incomes.reduce((sum, t) => sum + Number(t.amount), 0) / incomes.length
    : 0;

  const avgExpense = expenses.length
    ? expenses.reduce((sum, t) => sum + Number(t.amount), 0) / expenses.length
    : 0;

  document.getElementById('totalTransactions').innerText = totalTransactions;
  document.getElementById('avgIncome').innerText = formatCurrency(avgIncome);
  document.getElementById('avgExpense').innerText = formatCurrency(avgExpense);
}

function renderTrendInfo() {
  const container = document.getElementById('trendInfo');
  if (!container) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previous = new Date(currentYear, currentMonth - 1, 1);

  const currentIncome = getMonthlyTotal('income', currentMonth, currentYear);
  const currentExpense = getMonthlyTotal('expense', currentMonth, currentYear);

  const lastIncome = getMonthlyTotal('income', previous.getMonth(), previous.getFullYear());
  const lastExpense = getMonthlyTotal('expense', previous.getMonth(), previous.getFullYear());

  const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
  const expenseChange = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

  const balance = currentIncome - currentExpense;

  container.innerHTML = `
    <div style="line-height:1.8;font-size:14px;">
      <p>Pemasukan bulan ini: <strong class="positive">${formatCurrency(currentIncome)}</strong></p>
      <p>Pengeluaran bulan ini: <strong class="negative">${formatCurrency(currentExpense)}</strong></p>
      <p>Selisih bulan ini: <strong>${formatCurrency(balance)}</strong></p>
      <br>
      <p>Perubahan pemasukan dari bulan lalu: <strong>${incomeChange.toFixed(1)}%</strong></p>
      <p>Perubahan pengeluaran dari bulan lalu: <strong>${expenseChange.toFixed(1)}%</strong></p>
    </div>
  `;
}
