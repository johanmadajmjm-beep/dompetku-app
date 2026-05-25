document.addEventListener('DOMContentLoaded', () => {
  initMoneyInputs();
  renderBudgetList();
});

function showBudgetModal() {
  document.getElementById('budgetId').value = '';
  document.getElementById('budgetCategory').value = 'makan';
  document.getElementById('budgetLimit').value = '';
  document.getElementById('budgetModalTitle').innerText = 'Tambah Budget';
  document.getElementById('budgetModal').style.display = 'flex';
}

function closeBudgetModal() {
  document.getElementById('budgetModal').style.display = 'none';
}

function saveBudgetFromForm() {
  const id = document.getElementById('budgetId').value;
  const category = document.getElementById('budgetCategory').value;
  const limit = parseMoney(document.getElementById('budgetLimit').value);

  if (!category || !limit || limit <= 0) {
    alert('Isi kategori dan limit budget dengan benar!');
    return;
  }

  const now = new Date();
  const data = {
    category,
    limit,
    month: now.getMonth(),
    year: now.getFullYear()
  };

  if (id) {
    updateBudget(id, data);
  } else {
    addBudget(data);
  }

  closeBudgetModal();
  renderBudgetList();
}

function renderBudgetList() {
  const container = document.getElementById('budgetList');
  if (!container) return;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const budgets = appData.budgets.filter(b => b.month === month && b.year === year);

  if (budgets.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;margin:16px;">Belum ada budget bulan ini.</div>';
    return;
  }

  container.innerHTML = budgets.map(b => {
    const used = appData.transactions
      .filter(t => t.type === 'expense' && t.category === b.category && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const percent = b.limit > 0 ? Math.min((used / b.limit) * 100, 100) : 0;
    const statusClass = used >= b.limit ? 'budget-danger' : used >= b.limit * 0.8 ? 'budget-warning' : 'budget-safe';

    return `
      <div class="savings-item ${statusClass}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${getCategoryIcon(b.category)} ${b.category}</strong>
          <button onclick="editBudgetItem(${b.id})" style="background:none;border:none;color:#00ff88;">✏️</button>
        </div>
        <div style="margin-top:8px;">Terpakai: ${formatCurrency(used)}</div>
        <div>Limit: ${formatCurrency(b.limit)}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span>${percent.toFixed(1)}%</span>
          <span>Sisa: ${formatCurrency(Math.max(b.limit - used, 0))}</span>
        </div>
        <button onclick="deleteBudgetItem(${b.id})" class="btn-danger">Hapus</button>
      </div>
    `;
  }).join('');
}

function editBudgetItem(id) {
  const b = appData.budgets.find(x => x.id == id);
  if (!b) return;

  document.getElementById('budgetId').value = b.id;
  document.getElementById('budgetCategory').value = b.category;
  document.getElementById('budgetLimit').value = formatNumberInput(b.limit);
  document.getElementById('budgetModalTitle').innerText = 'Edit Budget';
  document.getElementById('budgetModal').style.display = 'flex';
}

function deleteBudgetItem(id) {
  if (confirm('Hapus budget ini?')) {
    deleteBudget(id);
    renderBudgetList();
  }
}
