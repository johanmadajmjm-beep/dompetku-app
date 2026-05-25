document.addEventListener('DOMContentLoaded', () => {
  initMoneyInputs();
  renderLimitList();
});

function showLimitModal() {
  document.getElementById('limitId').value = '';
  document.getElementById('limitCategory').value = 'makan';
  document.getElementById('limitAmount').value = '';
  document.getElementById('limitModalTitle').innerText = 'Tambah Batas Pengeluaran';
  document.getElementById('limitModal').style.display = 'flex';
}

function closeLimitModal() {
  document.getElementById('limitModal').style.display = 'none';
}

function saveLimitFromForm() {
  const id = document.getElementById('limitId').value;
  const category = document.getElementById('limitCategory').value;
  const amount = parseMoney(document.getElementById('limitAmount').value);

  if (!category || amount <= 0) {
    alert('Isi kategori dan batas pengeluaran dengan benar.');
    return;
  }

  const now = new Date();
  const payload = {
    category,
    amount,
    month: now.getMonth(),
    year: now.getFullYear()
  };

  if (id) {
    updateSpendingLimit(id, payload);
  } else {
    const duplicate = appData.spendingLimits.find(l =>
      l.category === category &&
      l.month === now.getMonth() &&
      l.year === now.getFullYear()
    );

    if (duplicate) {
      alert('Batas untuk kategori ini sudah ada. Silakan edit batas yang sudah dibuat.');
      return;
    }

    addSpendingLimit(payload);
  }

  closeLimitModal();
  renderLimitList();
}

function renderLimitList() {
  const container = document.getElementById('limitList');
  if (!container) return;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const limits = appData.spendingLimits.filter(l =>
    Number(l.month) === month &&
    Number(l.year) === year
  );

  if (limits.length === 0) {
    container.innerHTML = `
      <div class="glass" style="margin:16px;padding:40px;text-align:center;">
        Belum ada batas pengeluaran bulan ini.
      </div>
    `;
    return;
  }

  container.innerHTML = limits.map(limit => {
    const used = getCategoryExpense(limit.category, month, year);
    const percentRaw = limit.amount > 0 ? (used / limit.amount) * 100 : 0;
    const percent = Math.min(percentRaw, 100);

    let statusText = 'Aman';
    let statusClass = 'limit-safe';

    if (percentRaw >= 100) {
      statusText = `Melebihi ${formatCurrency(used - limit.amount)}`;
      statusClass = 'limit-danger';
    } else if (percentRaw >= 80) {
      statusText = 'Hampir habis';
      statusClass = 'limit-warning';
    }

    return `
      <div class="savings-item ${statusClass}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <strong>${getCategoryIcon(limit.category)} ${limit.category}</strong>
          <button onclick="editLimit(${limit.id})" style="background:none;border:none;color:#00ff88;font-size:18px;">✏️</button>
        </div>

        <div style="margin-top:10px;font-size:13px;opacity:.85;">Terpakai</div>
        <div style="font-size:18px;font-weight:700;">${formatCurrency(used)}</div>

        <div style="margin-top:8px;font-size:13px;opacity:.85;">Batas yang kamu tetapkan</div>
        <div style="font-size:16px;font-weight:700;">${formatCurrency(limit.amount)}</div>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;">
          <span>${percentRaw.toFixed(1)}%</span>
          <span>${statusText}</span>
        </div>

        <button class="btn-danger" onclick="deleteLimit(${limit.id})">Hapus</button>
      </div>
    `;
  }).join('');
}

function editLimit(id) {
  const limit = appData.spendingLimits.find(l => String(l.id) === String(id));
  if (!limit) return;

  document.getElementById('limitId').value = limit.id;
  document.getElementById('limitCategory').value = limit.category;
  document.getElementById('limitAmount').value = formatMoneyInput(limit.amount);
  document.getElementById('limitModalTitle').innerText = 'Edit Batas Pengeluaran';
  document.getElementById('limitModal').style.display = 'flex';
}

function deleteLimit(id) {
  if (!confirm('Hapus batas pengeluaran ini?')) return;
  deleteSpendingLimit(id);
  renderLimitList();
}
