const STORAGE_KEYS = {
  TRANSACTIONS: 'dompetku_transactions',
  SAVINGS_GOALS: 'dompetku_savings_goals',
  LOANS: 'dompetku_loans',
  SPENDING_LIMITS: 'dompetku_spending_limits',
  SETTINGS: 'dompetku_settings'
};

let appData = {
  transactions: [],
  savingsGoals: [],
  loans: [],
  spendingLimits: [],
  settings: {
    userName: 'Pengguna',
    theme: 'dark'
  }
};

function loadData() {
  try {
    appData.transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    appData.savingsGoals = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS)) || [];
    appData.loans = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS)) || [];
    appData.spendingLimits = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPENDING_LIMITS)) || [];
    appData.settings = {
      ...appData.settings,
      ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {})
    };
  } catch (error) {
    console.error('Gagal load data:', error);
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(appData.transactions));
}

function saveSavings() {
  localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(appData.savingsGoals));
}

function saveLoans() {
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(appData.loans));
}

function saveSpendingLimits() {
  localStorage.setItem(STORAGE_KEYS.SPENDING_LIMITS, JSON.stringify(appData.spendingLimits));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appData.settings));
}

function addTransaction(transaction) {
  transaction.id = Date.now();
  transaction.amount = Number(transaction.amount) || 0;
  transaction.createdAt = new Date().toISOString();
  appData.transactions.unshift(transaction);
  saveTransactions();
  return transaction;
}

function updateTransaction(id, updatedTransaction) {
  const index = appData.transactions.findIndex(t => String(t.id) === String(id));
  if (index === -1) return false;

  appData.transactions[index] = {
    ...appData.transactions[index],
    ...updatedTransaction,
    amount: Number(updatedTransaction.amount) || 0
  };

  saveTransactions();
  return true;
}

function deleteTransaction(id) {
  appData.transactions = appData.transactions.filter(t => String(t.id) !== String(id));
  saveTransactions();
}

function addSavingsGoal(goal) {
  goal.id = Date.now();
  goal.amount = Number(goal.amount) || 0;
  goal.savedAmount = Number(goal.savedAmount) || 0;
  goal.createdAt = new Date().toISOString();
  appData.savingsGoals.push(goal);
  saveSavings();
  return goal;
}

function updateSavingsGoal(id, updatedGoal) {
  const index = appData.savingsGoals.findIndex(g => String(g.id) === String(id));
  if (index === -1) return false;

  appData.savingsGoals[index] = {
    ...appData.savingsGoals[index],
    ...updatedGoal
  };

  saveSavings();
  return true;
}

function deleteSavingsGoal(id) {
  appData.savingsGoals = appData.savingsGoals.filter(g => String(g.id) !== String(id));
  saveSavings();
}

function addLoan(loan) {
  loan.id = Date.now();
  loan.amount = Number(loan.amount) || 0;
  loan.installment = Number(loan.installment) || 0;
  loan.createdAt = new Date().toISOString();
  appData.loans.push(loan);
  saveLoans();
  return loan;
}

function updateLoan(id, updatedLoan) {
  const index = appData.loans.findIndex(l => String(l.id) === String(id));
  if (index === -1) return false;

  appData.loans[index] = {
    ...appData.loans[index],
    ...updatedLoan
  };

  saveLoans();
  return true;
}

function deleteLoan(id) {
  appData.loans = appData.loans.filter(l => String(l.id) !== String(id));
  saveLoans();
}

function addSpendingLimit(limit) {
  limit.id = Date.now();
  limit.amount = Number(limit.amount) || 0;
  limit.month = Number(limit.month);
  limit.year = Number(limit.year);
  appData.spendingLimits.push(limit);
  saveSpendingLimits();
  return limit;
}

function updateSpendingLimit(id, updatedLimit) {
  const index = appData.spendingLimits.findIndex(l => String(l.id) === String(id));
  if (index === -1) return false;

  appData.spendingLimits[index] = {
    ...appData.spendingLimits[index],
    ...updatedLimit,
    amount: Number(updatedLimit.amount) || 0
  };

  saveSpendingLimits();
  return true;
}

function deleteSpendingLimit(id) {
  appData.spendingLimits = appData.spendingLimits.filter(l => String(l.id) !== String(id));
  saveSpendingLimits();
}

function parseMoney(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, '').replace(/[^0-9]/g, '')) || 0;
}

function formatMoneyInput(value) {
  const number = parseMoney(value);
  if (!number) return '';
  return number.toLocaleString('id-ID');
}

function initMoneyInputs() {
  document.querySelectorAll('.money-input').forEach(input => {
    input.addEventListener('input', () => {
      input.value = formatMoneyInput(input.value);
    });
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function getCategoryIcon(category) {
  const icons = {
    makan: '🍔',
    transport: '🚗',
    belanja: '🛍️',
    gaji: '💼',
    usaha: '📈',
    tagihan: '📄',
    kesehatan: '🏥',
    hiburan: '🎬',
    pendidikan: '📚',
    tabungan: '🎯',
    lainnya: '📌'
  };

  return icons[category] || '📌';
}

function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    monthName: now.toLocaleString('id-ID', { month: 'long' })
  };
}

function getMonthlyTotal(type, month = new Date().getMonth(), year = new Date().getFullYear()) {
  return appData.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === type && d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

function getTotalBalance() {
  return appData.transactions.reduce((sum, t) => {
    return t.type === 'income'
      ? sum + Number(t.amount)
      : sum - Number(t.amount);
  }, 0);
}

function getCategoryExpense(category, month = new Date().getMonth(), year = new Date().getFullYear()) {
  return appData.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' &&
        t.category === category &&
        d.getMonth() === month &&
        d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

function resetAllData() {
  if (!confirm('Yakin ingin menghapus semua data?')) return;

  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));

  appData.transactions = [];
  appData.savingsGoals = [];
  appData.loans = [];
  appData.spendingLimits = [];
  appData.settings = {
    userName: 'Pengguna',
    theme: 'dark'
  };

  alert('Semua data berhasil dihapus.');
  location.reload();
}

loadData();
