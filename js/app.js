document.addEventListener('DOMContentLoaded', () => {
  // Deteksi halaman berdasarkan elemen yang ada, bukan URL path
  // Lebih reliable untuk GitHub Pages, localhost, maupun file://

  if (document.getElementById('totalBalance')) {
    initDashboard();
  }

  if (document.getElementById('savingsList')) {
    initSavingsPage();
  }

  if (document.getElementById('borrowList')) {
    initLoansPage();
  }

  if (document.getElementById('settingsUserName')) {
    initSettingsPage();
  }
});

function initDashboard() {
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    dateEl.innerText = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
  }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    userNameEl.innerText = appData.settings.userName || 'Pengguna';
  }

  updateDashboardStats();
  renderDashboardInsights();
}

function updateDashboardStats() {
  const now = new Date();
  const totalBalance  = getTotalBalance();
  const monthIncome   = getMonthlyTotal('income',  now.getMonth(), now.getFullYear());
  const monthExpense  = getMonthlyTotal('expense', now.getMonth(), now.getFullYear());
  const totalSavings  = appData.savingsGoals.reduce((s, g) => s + Number(g.savedAmount || 0), 0);
  const totalLoan     = appData.loans
    .filter(l => l.status === 'active')
    .reduce((s, l) => s + Number(l.amount || 0), 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  set('totalBalance',  formatCurrency(totalBalance));
  set('monthIncome',   formatCurrency(monthIncome));
  set('monthExpense',  formatCurrency(monthExpense));
  set('totalSavings',  formatCurrency(totalSavings));
  set('totalLoan',     formatCurrency(totalLoan));
}

function renderDashboardInsights() {
  const box = document.getElementById('insightContainer');
  if (!box) return;

  const now = new Date();
  const monthIncome  = getMonthlyTotal('income',  now.getMonth(), now.getFullYear());
  const monthExpense = getMonthlyTotal('expense', now.getMonth(), now.getFullYear());
  const totalBalance = getTotalBalance();

  // Kategori pengeluaran terbesar bulan ini
  const categoryExpense = {};
  appData.transactions.forEach(t => {
    const d = new Date(t.date);
    if (t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      categoryExpense[t.category] = (categoryExpense[t.category] || 0) + Number(t.amount);
    }
  });

  let topCategory = '', topAmount = 0;
  Object.entries(categoryExpense).forEach(([cat, amt]) => {
    if (amt > topAmount) { topCategory = cat; topAmount = amt; }
  });

  const insights = [];

  // Belum ada data sama sekali
  if (appData.transactions.length === 0) {
    insights.push('👋 Selamat datang! Mulai catat transaksi pertamamu untuk melihat insight keuangan.');
  } else if (monthIncome === 0 && monthExpense === 0) {
    insights.push('📅 Belum ada transaksi bulan ini. Yuk mulai catat!');
  } else {
    // Ringkasan bulan ini
    insights.push('📊 Bulan ini pemasukan ' + formatCurrency(monthIncome) + ' dan pengeluaran ' + formatCurrency(monthExpense) + '.');

    // Pengeluaran terbesar
    if (topCategory) {
      insights.push(getCategoryIcon(topCategory) + ' Pengeluaran terbesar: <strong>' + topCategory + '</strong> sebesar ' + formatCurrency(topAmount) + '.');
    }

    // Evaluasi keuangan
    if (monthExpense > monthIncome && monthIncome > 0) {
      insights.push('⚠️ Pengeluaran melebihi pemasukan bulan ini. Saatnya evaluasi pengeluaran.');
    } else if (monthIncome > 0 && monthExpense <= monthIncome * 0.5) {
      insights.push('🎉 Hebat! Pengeluaranmu masih di bawah 50% dari pemasukan bulan ini.');
    } else if (monthIncome > 0) {
      insights.push('💡 Kamu sudah menggunakan ' + ((monthExpense / monthIncome) * 100).toFixed(0) + '% dari pemasukanmu bulan ini.');
    }

    // Saldo total
    if (totalBalance < 0) {
      insights.push('🔴 Total saldo kamu sedang minus. Perhatikan pengeluaranmu.');
    } else if (totalBalance > 0) {
      insights.push('✅ Total saldo kamu saat ini ' + formatCurrency(totalBalance) + '.');
    }
  }

  box.innerHTML = insights
    .map(text => '<div class="insight-text" style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);">' + text + '</div>')
    .join('');
}

/* ── TABUNGAN ── */
function initSavingsPage() {
  initMoneyInputs();
  renderSavingsList();
}

function renderSavingsList() {
  const container = document.getElementById('savingsList');
  if (!container) return;

  if (appData.savingsGoals.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;margin:16px;opacity:.6;">Belum ada target tabungan.</div>';
    return;
  }

  container.innerHTML = appData.savingsGoals.map(goal => {
    const progress = goal.amount > 0 ? ((Number(goal.savedAmount || 0) / Number(goal.amount)) * 100) : 0;
    return `
      <div class="savings-item">
        <div style="display:flex;justify-content:space-between;">
          <strong>🎯 ${goal.name}</strong>
          <button onclick="editTarget(${goal.id})" style="background:none;border:none;color:#00e87a;cursor:pointer;">✏️</button>
        </div>
        <div style="font-size:13px;opacity:.7;margin-top:4px;">Target: ${formatCurrency(goal.amount)}</div>
        <div style="font-size:13px;opacity:.7;">Terkumpul: ${formatCurrency(goal.savedAmount || 0)}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(progress,100)}%"></div></div>
        <div style="font-size:12px;margin-top:4px;opacity:.6;">${progress.toFixed(1)}%</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button onclick="openDepositModal(${goal.id})" style="flex:1;padding:10px;background:#00e87a;border:0;border-radius:10px;color:#070c18;font-weight:700;cursor:pointer;">+ Setoran</button>
          <button onclick="deleteTarget(${goal.id})" style="flex:1;padding:10px;background:rgba(255,71,87,.15);border:1px solid #ff4757;border-radius:10px;color:#ff4757;cursor:pointer;">Hapus</button>
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
  if (!name || amount <= 0) { alert('Isi nama dan nominal target.'); return; }
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

function closeTargetModal()  { document.getElementById('targetModal').style.display  = 'none'; }
function closeDepositModal() { document.getElementById('depositModal').style.display = 'none'; }

/* ── PINJAMAN ── */
let currentLoanType = 'borrow';

function initLoansPage() {
  initMoneyInputs();
  renderLoans();
}

function switchLoanTab(type) {
  currentLoanType = type;
  document.querySelectorAll('.loan-tab').forEach((tab, i) => {
    tab.classList.toggle('active', (type === 'borrow' && i === 0) || (type === 'lend' && i === 1));
  });
  document.getElementById('borrowList').style.display = type === 'borrow' ? 'block' : 'none';
  document.getElementById('lendList').style.display   = type === 'lend'   ? 'block' : 'none';
  renderLoans();
}

function renderLoans() {
  const borrowContainer = document.getElementById('borrowList');
  const lendContainer   = document.getElementById('lendList');
  if (!borrowContainer || !lendContainer) return;
  renderLoanList(appData.loans.filter(l => l.type === 'borrow'), borrowContainer);
  renderLoanList(appData.loans.filter(l => l.type === 'lend'),   lendContainer);
}

function renderLoanList(loans, container) {
  if (loans.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;margin:16px;opacity:.6;">Belum ada data pinjaman.</div>';
    return;
  }
  container.innerHTML = loans.map(loan => `
    <div class="loan-item">
      <div style="display:flex;justify-content:space-between;">
        <strong>${loan.name}</strong>
        <span style="font-size:12px;opacity:.7;">${loan.status === 'paid' ? '✅ Lunas' : loan.status === 'overdue' ? '⚠️ Terlambat' : '🕐 Aktif'}</span>
      </div>
      <div style="font-size:20px;font-weight:bold;margin:8px 0;">${formatCurrency(loan.amount)}</div>
      <div style="font-size:12px;opacity:.6;">Jatuh tempo: ${loan.dueDate || '-'}</div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button onclick="editLoan(${loan.id})" style="flex:1;padding:8px;background:rgba(0,232,122,.12);border:1px solid #00e87a;border-radius:8px;color:#00e87a;cursor:pointer;">Edit</button>
        <button onclick="deleteLoanItem(${loan.id})" style="flex:1;padding:8px;background:rgba(255,71,87,.12);border:1px solid #ff4757;border-radius:8px;color:#ff4757;cursor:pointer;">Hapus</button>
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
  if (!name || amount <= 0) { alert('Isi nama dan nominal pinjaman.'); return; }
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

function closeLoanModal() { document.getElementById('loanModal').style.display = 'none'; }

/* ── SETTINGS ── */
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
