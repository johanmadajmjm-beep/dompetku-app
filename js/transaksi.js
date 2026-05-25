// Transaction Page Logic
let currentTransactionId = null;
let currentType = 'expense';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'income') {
        setType('income');
    } else if (urlParams.get('type') === 'expense') {
        setType('expense');
    }
    
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    renderTransactionList();
    
    // Filter listeners
    document.getElementById('searchInput').addEventListener('input', () => renderTransactionList());
    document.getElementById('filterCategory').addEventListener('change', () => renderTransactionList());
    document.getElementById('sortOrder').addEventListener('change', () => renderTransactionList());
});

function setType(type) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((type === 'income' && btn.innerText.includes('Pemasukan')) ||
            (type === 'expense' && btn.innerText.includes('Pengeluaran'))) {
            btn.classList.add('active');
        }
    });
}

function saveTransaction() {
    const id = document.getElementById('editId').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const note = document.getElementById('note').value;
    
    if (!amount || amount <= 0) {
        alert('Masukkan nominal yang valid!');
        return;
    }
    
    if (!date) {
        alert('Pilih tanggal!');
        return;
    }
    
    const transaction = {
        type: currentType,
        amount: amount,
        category: category,
        date: date,
        paymentMethod: paymentMethod,
        note: note
    };
    
    if (id) {
        updateTransaction(id, transaction);
    } else {
        addTransaction(transaction);
    }
    
    resetForm();
    renderTransactionList();
    
    // Update budget usage
    if (currentType === 'expense') {
        checkBudgetWarning(category, amount);
    }
}

function checkBudgetWarning(category, amount) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const budget = appData.budgets.find(b => b.category === category && b.month === currentMonth && b.year === currentYear);
    
    if (budget) {
        const monthExpenses = appData.transactions
            .filter(t => t.type === 'expense' && t.category === category && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const usagePercent = (monthExpenses / budget.limit) * 100;
        
        if (usagePercent >= 90) {
            setTimeout(() => {
                alert(`⚠️ Peringatan Budget! Pengeluaran kategori ${category} sudah mencapai ${usagePercent.toFixed(1)}% dari limit Rp ${formatCurrency(budget.limit)}`);
            }, 100);
        }
    }
}

function resetForm() {
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
    
    let transactions = [...appData.transactions];
    
    // Search filter
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        transactions = transactions.filter(t => 
            t.note?.toLowerCase().includes(searchTerm) || 
            t.category?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category filter
    const categoryFilter = document.getElementById('filterCategory')?.value;
    if (categoryFilter) {
        transactions = transactions.filter(t => t.category === categoryFilter);
    }
    
    // Sort
    const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    transactions.sort((a, b) => {
        if (sortOrder === 'desc') {
            return new Date(b.date) - new Date(a.date);
        } else {
            return new Date(a.date) - new Date(b.date);
        }
    });
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="glass" style="padding: 40px; text-align: center;">Belum ada transaksi. Tambahkan transaksi baru!</div>';
        return;
    }
    
    container.innerHTML = transactions.map(t => `
        <div class="transaction-item" onclick="showTransactionOptions(${t.id})">
            <div class="transaction-info">
                <div class="transaction-category">
                    ${getCategoryIcon(t.category)} ${t.category}
                    <span style="font-size: 11px; opacity: 0.6;">${t.paymentMethod}</span>
                </div>
                <div class="transaction-date">📅 ${new Date(t.date).toLocaleDateString('id-ID')}</div>
                ${t.note ? `<div class="transaction-note">📝 ${t.note.substring(0, 50)}</div>` : ''}
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

function editTransactionFromModal() {
    const transaction = appData.transactions.find(t => t.id == currentTransactionId);
    if (transaction) {
        document.getElementById('editId').value = transaction.id;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        document.getElementById('paymentMethod').value = transaction.paymentMethod;
        document.getElementById('note').value = transaction.note || '';
        setType(transaction.type);
        document.getElementById('formTitle').innerText = 'Edit Transaksi';
        closeModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteTransactionFromModal() {
    if (confirm('Hapus transaksi ini?')) {
        deleteTransaction(currentTransactionId);
        renderTransactionList();
        closeModal();
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentTransactionId = null;
}
