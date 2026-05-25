document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('index.html') || path.endsWith('/') || path === '') {
    initDashboard();
  }

  if (path.includes('tabungan.html')) {
    initSavingsPage();
  }

  if (path.includes('pinjaman.html')) {
    initLoansPage();
  }

  if (path.includes('pengaturan.html')) {
    initSettingsPage();
  }
});

function initDashboard() {
  document.getElementById('currentDate').innerText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  document.getElementById('userName').innerText = appData.settings.userName || 'Pengguna';

  updateDashboardStats();
  renderCashflowChart();
  renderDashboardInsights();
  renderDashboardLimitWarnings();
}

function updateDashboardStats() {
  const now = new Date();

  const totalBalance = getTotalBalance();
  const monthIncome = getMonthlyTotal('income', now.getMonth(), now.getFullYear());
  const monthExpense = getMonthlyTotal('expense', now.getMonth(), now.getFullYear());

  const totalSavings = appData.savingsGoals.reduce((sum, g) => sum + Number(g.savedAmount || 0), 0);

  const totalLoan = appData.loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  document.getElementById('totalBalance').innerText = formatCurrency(totalBalance);
  document.getElementById('monthIncome').innerText = formatCurrency(monthIncome);
  document.getElementById('monthExpense').innerText = formatCurrency(monthExpense);
  document.getElementById('totalSavings').innerText = formatCurrency(totalSavings);
  document.getElementById('totalLoan').innerText = formatCurrency(totalLoan);
}

function renderDashboardInsights() {
  const box = document.getElementById('insightContainer');
  if (!box) return;

  const now = new Date();
  const monthIncome = getMonthlyTotal('income', now.getMonth(), now.getFullYear());
  const monthExpense = getMonthlyTotal('expense', now.getMonth(), now.getFullYear());

  const categoryExpense = {};
  appData.transactions.forEach(t => {
    const d = new Date(t.date);
    if (t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      categoryExpense[t.category] = (categoryExpense[t.category] || 0) + Number(t.amount);
    }
  });

  let topCategory = '';
  let topAmount = 0;

  Object.entries(categoryExpense).forEach(([category, amount]) => {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  });

  const insights = [];

  if (monthIncome === 0 && monthExpense === 0) {
    insights.push('Mulai catat pemasukan dan pengeluaran agar aplikasi bisa membaca pola keuanganmu.');
  } else {
    insights.push(`Bulan ini pemasukan ${formatCurrency(monthIncome)} dan pengeluaran ${formatCurrency(monthExpense)}.`);
  }

  if (topCategory) {
    insights.push(`Pengeluaran terbesar bulan ini adalah ${getCategoryIcon(topCategory)} ${topCategory}, sebesar ${formatCurrency(topAmount)}.`);
  }

  if (monthExpense > monthIncome && monthIncome > 0) {
    insights.push('Pengeluaran bulan ini lebih besar dari pemasukan. Perlu evaluasi pengeluaran.');
  }

  box.innerHTML = insights.map(text => `<div class="insight-text" style="margin-bottom:8px;">${text}</div>`).join('');
}

function renderDashboardLimitWarnings() {
  const container = document.getElementById('limitWarningContainer');
  if (!container) return;

  const now = new Date();
  const limits = appData.spendingLimits.filter(l =>
    Number(l.month) === now.getMonth() &&
    Number(l.year) === now.getFullYear()
  );

  if (limits.length === 0) {
    container.innerHTML = `
      <div class="insight-card glass">
        <div class="insight-text">
          Belum ada batas pengeluaran. Kamu bisa membuat batas sendiri di menu Batas.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = limits.map(limit => {
    const used = getCategoryExpense(limit.category, now.getMonth(), now.getFullYear());
    const percent = limit.amount > 0 ? (used / limit.amount) * 100 : 0;

    let status = 'Aman';
    let cls = 'limit-safe';

    if (percent >= 100) {
      status = `Melebihi ${formatCurrency(used - limit.amount)}`;
      cls = 'limit-danger';
    } else if (percent >= 80) {
      status = 'Hampir habis';
      cls = 'limit-warning';
    }

    return `
      <div class="savings-item ${cls}">
        <strong>${getCategoryIcon(limit.category)} ${limit.category}</strong>
        <div style="font-size:13px;margin-top:6px;">
          ${formatCurrency(used)} / ${formatCurrency(limit.amount)}
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.min(percent, 100)}%"></div>
        </div>
        <div style="font-size:12px;">${percent.toFixed(1)}% - ${status}</div>
      </div>
    `;
  }).join('');
}

/* TABUNGAN */
function initSavingsPage() {
  initMoneyInputs();
  renderSavingsList();
}

function renderSavingsList() {
  const container = document.getElementById('savingsList');
  if (!container) return;

  if (appData.savingsGoals.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;margin:16px;">Belum ada target tabungan.</div>';
    return;
  }

  container.innerHTML = appData.savingsGoals.map(goal => {
    const progress = goal.amount > 0 ? ((Number(goal.savedAmount || 0) / Number(goal.amount)) * 100) : 0;

    return `
      <div class="savings-item">
        <div style="display:flex;justify-content:space-between;">
          <strong>🎯 ${goal.name}</strong>
          <button onclick="editTarget(${goal.id})" style="background:none;border:none;color:#00ff88;">✏️</button>
        </div>
        <div>Target: ${formatCurrency(goal.amount)}</div>
        <div>Terkumpul: ${formatCurrency(goal.savedAmount || 0)}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(progress, 100)}%"></div></div>
        <div style="font-size:12px;">${progress.toFixed(1)}%</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button onclick="openDepositModal(${goal.id})" style="flex:1;padding:8px;background:#00ff88;border:0;border-radius:8px;color:#0a0f1e;">+ Setoran</button>
          <button onclick="deleteTarget(${goal.id})" style="flex:1;padding:8px;background:rgba(255,71,87,.2);border:1px solid #ff4757;border-radius:8px;color:#ff4757;">Hapus</button>
        </div>
      </div>
    `;
  }).join('');
}

function showTargetModal() {
  document.getElementById('targetId').value = '';
  document.getElementById('targetName').value = '';
  document.getElementById('targetAmount').value = '';
  document.getElementById('savedAmount').value = '';
  document.getElementById('targetDeadline').value = '';
  document.getElementById('targetModal').style.display = 'flex';
}

function editTarget(id) {
  const goal = appData.savingsGoals.find(g => String(g.id) === String(id));
  if (!goal) return;

  document.getElementById('targetId').value = goal.id;
  document.getElementById('targetName').value = goal.name;
  document.getElementById('targetAmount').value = formatMoneyInput(goal.amount);
  document.getElementById('savedAmount').value = formatMoneyInput(goal.savedAmount || 0);
  document.getElementById('targetDeadline').value = goal.deadline || '';
  document.getElementById('targetModal').style.display = 'flex';
}

function saveTarget() {
  const id = document.getElementById('targetId').value;
  const name = document.getElementById('targetName').value.trim();
  const amount = parseMoney(document.getElementById('targetAmount').value);
  const savedAmount = parseMoney(document.getElementById('savedAmount').value);
  const deadline = document.getElementById('targetDeadline').value;

  if (!name || amount <= 0) {
    alert('Isi nama dan nominal target.');
    return;
  }

  if (id) updateSavingsGoal(id, { name, amount, savedAmount, deadline });
  else addSavingsGoal({ name, amount, savedAmount, deadline });

  closeTargetModal();
  renderSavingsList();
}

function deleteTarget(id) {
  if (!confirm('Hapus target tabungan?')) return;
  deleteSavingsGoal(id);
  renderSavingsList();
}

function openDepositModal(id) {
  document.getElementById('depositTargetId').value = id;
  document.getElementById('depositAmount').value = '';
  document.getElementById('depositModal').style.display = 'flex';
}

function addDeposit() {
  const id = document.getElementById('depositTargetId').value;
  const amount = parseMoney(document.getElementById('depositAmount').value);

  const goal = appData.savingsGoals.find(g => String(g.id) === String(id));
  if (!goal || amount <= 0) return;

  updateSavingsGoal(id, { savedAmount: Number(goal.savedAmount || 0) + amount });
  closeDepositModal();
  renderSavingsList();
}

function closeTargetModal() {
  document.getElementById('targetModal').style.display = 'none';
}

function closeDepositModal() {
  document.getElementById('depositModal').style.display = 'none';
}

/* PINJAMAN */
let currentLoanType = 'borrow';

function initLoansPage() {
  initMoneyInputs();
  renderLoans();
}

function switchLoanTab(type) {
  currentLoanType = type;
  document.querySelectorAll('.loan-tab').forEach((tab, index) => {
    tab.classList.toggle('active', (type === 'borrow' && index === 0) || (type === 'lend' && index === 1));
  });

  document.getElementById('borrowList').style.display = type === 'borrow' ? 'block' : 'none';
  document.getElementById('lendList').style.display = type === 'lend' ? 'block' : 'none';

  renderLoans();
}

function renderLoans() {
  const borrowContainer = document.getElementById('borrowList');
  const lendContainer = document.getElementById('lendList');
  if (!borrowContainer || !lendContainer) return;

  renderLoanList(appData.loans.filter(l => l.type === 'borrow'), borrowContainer);
  renderLoanList(appData.loans.filter(l => l.type === 'lend'), lendContainer);
}

function renderLoanList(loans, container) {
  if (loans.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;margin:16px;">Belum ada data pinjaman.</div>';
    return;
  }

  container.innerHTML = loans.map(loan => `
    <div class="loan-item">
      <div style="display:flex;justify-content:space-between;">
        <strong>${loan.name}</strong>
        <span>${loan.status === 'paid' ? 'Lunas' : loan.status === 'overdue' ? 'Terlambat' : 'Aktif'}</span>
      </div>
      <div style="font-size:20px;font-weight:bold;margin:8px 0;">${formatCurrency(loan.amount)}</div>
      <div style="font-size:12px;">Jatuh tempo: ${loan.dueDate || '-'}</div>
      <div class="loan-actions">
        <button onclick="editLoan(${loan.id})">Edit</button>
        <button onclick="deleteLoanItem(${loan.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

function showLoanModal() {
  document.getElementById('loanId').value = '';
  document.getElementById('loanName').value = '';
  document.getElementById('loanAmount').value = '';
  document.getElementById('installmentAmount').value = '';
  document.getElementById('loanDueDate').value = '';
  document.getElementById('loanStatus').value = 'active';
  document.getElementById('loanTypeSelect').value = currentLoanType;
  document.getElementById('loanModal').style.display = 'flex';
}

function editLoan(id) {
  const loan = appData.loans.find(l => String(l.id) === String(id));
  if (!loan) return;

  document.getElementById('loanId').value = loan.id;
  document.getElementById('loanName').value = loan.name;
  document.getElementById('loanAmount').value = formatMoneyInput(loan.amount);
  document.getElementById('installmentAmount').value = formatMoneyInput(loan.installment || 0);
  document.getElementById('loanDueDate').value = loan.dueDate || '';
  document.getElementById('loanStatus').value = loan.status || 'active';
  document.getElementById('loanTypeSelect').value = loan.type || 'borrow';
  document.getElementById('loanModal').style.display = 'flex';
}

function saveLoan() {
  const id = document.getElementById('loanId').value;
  const name = document.getElementById('loanName').value.trim();
  const amount = parseMoney(document.getElementById('loanAmount').value);
  const installment = parseMoney(document.getElementById('installmentAmount').value);
  const dueDate = document.getElementById('loanDueDate').value;
  const status = document.getElementById('loanStatus').value;
  const type = document.getElementById('loanTypeSelect').value;

  if (!name || amount <= 0) {
    alert('Isi nama dan nominal pinjaman.');
    return;
  }

  if (id) updateLoan(id, { name, amount, installment, dueDate, status, type });
  else addLoan({ name, amount, installment, dueDate, status, type });

  closeLoanModal();
  renderLoans();
}

function deleteLoanItem(id) {
  if (!confirm('Hapus pinjaman ini?')) return;
  deleteLoan(id);
  renderLoans();
}

function closeLoanModal() {
  document.getElementById('loanModal').style.display = 'none';
}

/* SETTINGS */
function initSettingsPage() {
  const nameInput = document.getElementById('settingsUserName');
  if (nameInput) nameInput.value = appData.settings.userName || 'Pengguna';
}

function saveUserSettings() {
  const name = document.getElementById('settingsUserName')?.value || 'Pengguna';
  appData.settings.userName = name;
  saveSettings();
  alert('Pengaturan disimpan.');
}

function showReportPreview() {
  const box = document.getElementById('reportPreview');
  if (!box) return;

  const now = new Date();
  const income = getMonthlyTotal('income', now.getMonth(), now.getFullYear());
  const expense = getMonthlyTotal('expense', now.getMonth(), now.getFullYear());
  const balance = getTotalBalance();

  const latest = appData.transactions.slice(0, 20).map(t => `
    <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.1);">
      ${new Date(t.date).toLocaleDateString('id-ID')} -
      ${getCategoryIcon(t.category)} ${t.category} -
      ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
    </div>
  `).join('');

  box.style.display = 'block';
  box.innerHTML = `
    <h3>Preview Laporan Keuangan</h3>
    <p>Tanggal cetak: ${now.toLocaleDateString('id-ID')}</p>
    <br>
    <p>Total saldo: <strong>${formatCurrency(balance)}</strong></p>
    <p>Pemasukan bulan ini: <strong class="positive">${formatCurrency(income)}</strong></p>
    <p>Pengeluaran bulan ini: <strong class="negative">${formatCurrency(expense)}</strong></p>
    <br>
    <h4>Transaksi terakhir</h4>
    ${latest || '<p>Belum ada transaksi.</p>'}
  `;
}
