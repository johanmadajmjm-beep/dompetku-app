let currentTransactionId = null;
let currentType = 'expense';

document.addEventListener('DOMContentLoaded', () => {
  initMoneyInputs();

  const params = new URLSearchParams(window.location.search);
  if (params.get('type') === 'income') setType('income');
  if (params.get('type') === 'expense') setType('expense');

  document.getElementById('date').value = new Date().toISOString().split('T')[0];

  document.getElementById('searchInput')?.addEventListener('input', renderTransactionList);
  document.getElementById('filterCategory')?.addEventListener('change', renderTransactionList);
  document.getElementById('sortOrder')?.addEventListener('change', renderTransactionList);

  renderTransactionList();
});

function setType(type) {
  currentType = type;

  document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));

  document.querySelectorAll('.type-btn').forEach(btn => {
    if (type === 'income' && btn.innerText.includes('Pemasukan')) btn.classList.add('active');
    if (type === 'expense' && btn.innerText.includes('Pengeluaran')) btn.classList.add('active');
  });
}

function saveTransactionFromForm() {
  const id = document.getElementById('editId').value;
  const amount = parseMoney(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const note = document.getElementById('note').value.trim();

  if (amount <= 0) {
    alert('Masukkan nominal yang benar.');
    return;
  }

  if (!date) {
    alert('Pilih tanggal transaksi.');
    return;
  }

  const payload = {
    type: currentType,
    amount,
    category,
    date,
    paymentMethod,
    note
  };

  if (id) updateTransaction(id, payload);
  else addTransaction(payload);

  if (currentType === 'expense') checkSpendingLimitWarning(category, amount);

  resetTransactionForm();
  renderTransactionList();
}

function checkSpendingLimitWarning(category) {
  const now = new Date();
  const limit = appData.spendingLimits.find(l =>
    l.category === category &&
    Number(l.month) === now.getMonth() &&
    Number(l.year) === now.getFullYear()
  );

  if (!limit) return;

  const used = getCategoryExpense(category, now.getMonth(), now.getFullYear());
  const percent = limit.amount > 0 ? (used / limit.amount) * 100 : 0;

  if (percent >= 100) {
    alert(`⚠️ Pengeluaran ${category} sudah melebihi batas.\n\nTerpakai: ${formatCurrency(used)}\nBatas: ${formatCurrency(limit.amount)}`);
  } else if (percent >= 80) {
    alert(`⚠️ Pengeluaran ${category} hampir mencapai batas.\n\nTerpakai: ${formatCurrency(used)}\nBatas: ${formatCurrency(limit.amount)}`);
  }
}

function resetTransactionForm() {
  document.getElementById('editId').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = 'makan';
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  document.getElementById('paymentMethod').value = 'tunai';
  document.getElementById('note').value = '';
  document.getElementById('formTitle').innerText = 'Tambah Transaksi';
  setType('expense');
}

function renderTransactionList() {
  const container = document.getElementById('transactionList');
  if (!container) return;

  let list = [...appData.transactions];

  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const sort = document.getElementById('sortOrder')?.value || 'desc';

  if (search) {
    list = list.filter(t =>
      String(t.note || '').toLowerCase().includes(search) ||
      String(t.category || '').toLowerCase().includes(search) ||
      String(t.paymentMethod || '').toLowerCase().includes(search)
    );
  }

  if (category) list = list.filter(t => t.category === category);

  list.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return sort === 'desc' ? db - da : da - db;
  });

  if (list.length === 0) {
    container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;">Belum ada transaksi.</div>';
    return;
  }

  container.innerHTML = list.map(t => `
    <div class="transaction-item" onclick="showTransactionOptions(${t.id})">
      <div class="transaction-info">
        <div class="transaction-category">
          ${getCategoryIcon(t.category)} ${t.category}
          <span style="font-size:11px;opacity:.6;">${t.paymentMethod || ''}</span>
        </div>
        <div class="transaction-date">📅 ${new Date(t.date).toLocaleDateString('id-ID')}</div>
        ${t.note ? `<div class="transaction-note">📝 ${t.note}</div>` : ''}
      </div>
      <div class="transaction-amount ${t.type === 'income' ? 'positive' : 'negative'}">
        ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
      </div>
    </div>
  `).join('');
}

function showTransactionOptions(id) {
  currentTransactionId = id;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function editTransactionFromModal() {
  const t = appData.transactions.find(x => String(x.id) === String(currentTransactionId));
  if (!t) return;

  document.getElementById('editId').value = t.id;
  document.getElementById('amount').value = formatMoneyInput(t.amount);
  document.getElementById('category').value = t.category;
  document.getElementById('date').value = t.date;
  document.getElementById('paymentMethod').value = t.paymentMethod || 'tunai';
  document.getElementById('note').value = t.note || '';
  document.getElementById('formTitle').innerText = 'Edit Transaksi';

  setType(t.type);
  closeModal();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTransactionFromModal() {
  if (!confirm('Hapus transaksi ini?')) return;

  deleteTransaction(currentTransactionId);
  closeModal();
  renderTransactionList();
}
