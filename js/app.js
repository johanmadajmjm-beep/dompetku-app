// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Deteksi halaman berdasarkan elemen, lebih aman untuk GitHub Pages / file lokal.
    if (document.getElementById('totalBalance')) {
        initDashboard();
    }
    if (document.getElementById('savingsList')) {
        initSavingsPage();
    }
    if (document.getElementById('borrowList') || document.getElementById('lendList')) {
        initLoansPage();
    }
    if (document.getElementById('settingsUserName')) {
        initSettingsPage();
    }
});

function initDashboard() {
    updateDashboardStats();
    renderCashflowChart();
    generateInsights();
    setInterval(() => {
        updateDashboardStats();
        renderCashflowChart();
        generateInsights();
    }, 5000);
    
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('userName').innerText = appData.settings.userName;
}

function updateDashboardStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthIncome = 0;
    let monthExpense = 0;
    let totalBalance = 0;
    
    appData.transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (t.type === 'income') {
            totalBalance += t.amount;
            if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
                monthIncome += t.amount;
            }
        } else {
            totalBalance -= t.amount;
            if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
                monthExpense += t.amount;
            }
        }
    });
    
    // Calculate total savings
    let totalSavings = 0;
    appData.savingsGoals.forEach(g => {
        totalSavings += g.savedAmount || 0;
    });
    
    // Calculate total loans (active)
    let totalLoan = 0;
    appData.loans.forEach(l => {
        if (l.status === 'active') {
            totalLoan += l.amount;
        }
    });
    
    document.getElementById('totalBalance').innerHTML = formatCurrency(totalBalance);
    document.getElementById('monthIncome').innerHTML = formatCurrency(monthIncome);
    document.getElementById('monthExpense').innerHTML = formatCurrency(monthExpense);
    document.getElementById('totalSavings').innerHTML = formatCurrency(totalSavings);
    document.getElementById('totalLoan').innerHTML = formatCurrency(totalLoan);
}

function generateInsights() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const insights = [];
    
    // Get last 30 days transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = appData.transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    // Calculate expense by category
    const categoryExpense = {};
    recentTransactions.forEach(t => {
        if (t.type === 'expense') {
            categoryExpense[t.category] = (categoryExpense[t.category] || 0) + t.amount;
        }
    });
    
    // Find biggest expense category
    let maxCategory = '';
    let maxAmount = 0;
    for (const [cat, amount] of Object.entries(categoryExpense)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxCategory = cat;
        }
    }
    
    if (maxCategory) {
        insights.push(`📊 Kategori pengeluaran terbesar Anda adalah ${getCategoryIcon(maxCategory)} ${maxCategory} dengan total ${formatCurrency(maxAmount)} dalam 30 hari terakhir.`);
    }
    
    // Compare with previous month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    let thisMonthExpense = 0;
    let lastMonthExpense = 0;
    
    appData.transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (t.type === 'expense') {
            if (transDate.getMonth() === currentMonth && transDate.getFullYear() === now.getFullYear()) {
                thisMonthExpense += t.amount;
            }
            if (transDate.getMonth() === lastMonth && transDate.getFullYear() === lastMonthYear) {
                lastMonthExpense += t.amount;
            }
        }
    });
    
    if (lastMonthExpense > 0) {
        const percentChange = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1);
        if (percentChange > 0) {
            insights.push(`⚠️ Pengeluaran bulan ini naik ${percentChange}% dibanding bulan lalu. Coba evaluasi kembali kebutuhan Anda.`);
        } else if (percentChange < 0) {
            insights.push(`✅ Bagus! Pengeluaran bulan ini turun ${Math.abs(percentChange)}% dibanding bulan lalu.`);
        }
    }
    
    // Weekend expense insight
    let weekendExpense = 0;
    let weekdayExpense = 0;
    recentTransactions.forEach(t => {
        if (t.type === 'expense') {
            const transDate = new Date(t.date);
            const day = transDate.getDay();
            if (day === 0 || day === 6) {
                weekendExpense += t.amount;
            } else {
                weekdayExpense += t.amount;
            }
        }
    });
    
    const avgWeekend = weekendExpense / 8; // ~8 weekend days in 30 days
    const avgWeekday = weekdayExpense / 22;
    
    if (avgWeekday > 0 && avgWeekend > avgWeekday * 1.2) {
        insights.push(`🎉 Pengeluaran akhir pekan Anda ${formatCurrency(avgWeekend)}/hari lebih tinggi ${Math.round((avgWeekend/avgWeekday-1)*100)}% dari hari biasa. Coba rencanakan aktivitas akhir pekan lebih hemat.`);
    }
    
    // Saving tip
    if (maxCategory === 'makan') {
        insights.push(`💡 Tips hemat: Coba masak di rumah lebih sering untuk mengurangi pengeluaran makan.`);
    } else if (maxCategory === 'transport') {
        insights.push(`💡 Tips hemat: Pertimbangkan transportasi umum atau carpooling untuk menghemat biaya transport.`);
    } else if (maxCategory === 'hiburan') {
        insights.push(`💡 Tips hemat: Cari hiburan gratis seperti jalan-jalan di taman atau menonton film di rumah.`);
    } else {
        insights.push(`💡 Tips hemat: Selalu catat setiap pengeluaran kecil, karena bisa menjadi kebocoran finansial.`);
    }
    
    const insightContainer = document.getElementById('insightContainer');
    if (insightContainer && insights.length > 0) {
        insightContainer.innerHTML = `<div class="insight-text">${insights[0]}</div><div class="insight-text" style="margin-top: 12px;">${insights[1] || ''}</div><div class="insight-text" style="margin-top: 8px; color: #00ff88;">${insights[insights.length-1]}</div>`;
    }
}

// Savings Page
function initSavingsPage() {
    renderSavingsList();
}

function renderSavingsList() {
    const container = document.getElementById('savingsList');
    if (!container) return;
    
    if (appData.savingsGoals.length === 0) {
        container.innerHTML = '<div class="glass" style="padding: 40px; text-align: center;">Belum ada target tabungan. Tap + untuk membuat target.</div>';
        return;
    }
    
    container.innerHTML = appData.savingsGoals.map(goal => {
        const progress = ((goal.savedAmount || 0) / goal.amount) * 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        let estimation = '';
        if (daysLeft > 0) {
            const dailyNeeded = (goal.amount - (goal.savedAmount || 0)) / daysLeft;
            estimation = `💡 Butuh ~${formatCurrency(dailyNeeded)}/hari`;
        }
        return `
            <div class="savings-item">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <strong>🎯 ${goal.name}</strong>
                    <button onclick="editTarget(${goal.id})" style="background: none; border: none; color: #00ff88; cursor: pointer;">✏️</button>
                </div>
                <div>Target: ${formatCurrency(goal.amount)}</div>
                <div>Terkumpul: ${formatCurrency(goal.savedAmount || 0)}</div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>${progress.toFixed(1)}%</span>
                    <span>${daysLeft > 0 ? daysLeft + ' hari lagi' : 'Melebihi target!'}</span>
                </div>
                <div style="font-size: 12px; margin-top: 8px;">${estimation}</div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button onclick="openDepositModal(${goal.id})" style="flex:1; padding: 8px; background: #00ff88; border: none; border-radius: 8px; color: #0a0f1e; cursor: pointer;">+ Setoran</button>
                    <button onclick="deleteTarget(${goal.id})" style="flex:1; padding: 8px; background: rgba(255,71,87,0.2); border: 1px solid #ff4757; border-radius: 8px; color: #ff4757; cursor: pointer;">Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

let currentTargetId = null;

function showTargetModal() {
    document.getElementById('targetModalTitle').innerText = 'Tambah Target Tabungan';
    document.getElementById('targetId').value = '';
    document.getElementById('targetName').value = '';
    document.getElementById('targetAmount').value = '';
    document.getElementById('savedAmount').value = '';
    document.getElementById('targetDeadline').value = '';
    document.getElementById('targetModal').style.display = 'flex';
}

function editTarget(id) {
    const goal = appData.savingsGoals.find(g => g.id == id);
    if (goal) {
        currentTargetId = id;
        document.getElementById('targetModalTitle').innerText = 'Edit Target Tabungan';
        document.getElementById('targetId').value = goal.id;
        document.getElementById('targetName').value = goal.name;
        document.getElementById('targetAmount').value = goal.amount;
        document.getElementById('savedAmount').value = goal.savedAmount || 0;
        document.getElementById('targetDeadline').value = goal.deadline;
        document.getElementById('targetModal').style.display = 'flex';
    }
}

function saveTarget() {
    const id = document.getElementById('targetId').value;
    const name = document.getElementById('targetName').value;
    const amount = parseFloat(document.getElementById('targetAmount').value);
    const savedAmount = parseFloat(document.getElementById('savedAmount').value) || 0;
    const deadline = document.getElementById('targetDeadline').value;
    
    if (!name || !amount || !deadline) {
        alert('Lengkapi semua field!');
        return;
    }
    
    if (id) {
        updateSavingsGoal(id, { name, amount, savedAmount, deadline });
    } else {
        addSavingsGoal({ name, amount, savedAmount, deadline });
    }
    
    closeTargetModal();
    renderSavingsList();
}

function deleteTarget(id) {
    if (confirm('Hapus target tabungan ini?')) {
        deleteSavingsGoal(id);
        renderSavingsList();
    }
}

function openDepositModal(id) {
    currentTargetId = id;
    document.getElementById('depositTargetId').value = id;
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositModal').style.display = 'flex';
}

function addDeposit() {
    const id = parseInt(document.getElementById('depositTargetId').value);
    const amount = parseFloat(document.getElementById('depositAmount').value);
    
    if (!amount || amount <= 0) {
        alert('Masukkan jumlah setoran yang valid!');
        return;
    }
    
    const goal = appData.savingsGoals.find(g => g.id == id);
    if (goal) {
        const newSaved = (goal.savedAmount || 0) + amount;
        updateSavingsGoal(id, { savedAmount: newSaved });
        
        // Also add as transaction
        addTransaction({
            type: 'expense',
            amount: amount,
            category: 'tabungan',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'tunai',
            note: `Setoran tabungan: ${goal.name}`,
            isSavingsDeposit: true
        });
        
        renderSavingsList();
        closeDepositModal();
    }
}

function closeTargetModal() {
    document.getElementById('targetModal').style.display = 'none';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
}

// Loans Page
function initLoansPage() {
    renderLoans();
}

let currentLoanType = 'borrow';

function switchLoanTab(type) {
    currentLoanType = type;
    document.querySelectorAll('.loan-tab').forEach((tab, idx) => {
        tab.classList.toggle('active', (type === 'borrow' && idx === 0) || (type === 'lend' && idx === 1));
    });
    document.getElementById('borrowList').style.display = type === 'borrow' ? 'block' : 'none';
    document.getElementById('lendList').style.display = type === 'lend' ? 'block' : 'none';
    renderLoans();
}

function renderLoans() {
    const borrowContainer = document.getElementById('borrowList');
    const lendContainer = document.getElementById('lendList');
    
    const borrowLoans = appData.loans.filter(l => l.type === 'borrow');
    const lendLoans = appData.loans.filter(l => l.type === 'lend');
    
    const renderLoanList = (loans, container) => {
        if (loans.length === 0) {
            container.innerHTML = '<div class="glass" style="padding: 40px; text-align: center;">Belum ada data pinjaman.</div>';
            return;
        }
        
        container.innerHTML = loans.map(loan => {
            const statusColor = loan.status === 'active' ? '#00ff88' : (loan.status === 'paid' ? '#ccc' : '#ff4757');
            const statusText = loan.status === 'active' ? 'Aktif' : (loan.status === 'paid' ? 'Lunas' : 'Terlambat');
            return `
                <div class="loan-item">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${loan.name}</strong>
                        <span style="color: ${statusColor};">${statusText}</span>
                    </div>
                    <div style="font-size: 20px; font-weight: bold; margin: 8px 0;">${formatCurrency(loan.amount)}</div>
                    <div style="font-size: 12px;">📅 Jatuh tempo: ${new Date(loan.dueDate).toLocaleDateString('id-ID')}</div>
                    ${loan.installment ? `<div style="font-size: 12px;">💳 Cicilan: ${formatCurrency(loan.installment)}/bulan</div>` : ''}
                    <div class="loan-actions">
                        <button onclick="editLoan(${loan.id})">✏️ Edit</button>
                        <button onclick="deleteLoanItem(${loan.id})" style="background: rgba(255,71,87,0.2); color: #ff4757;">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        }).join('');
    };
    
    renderLoanList(borrowLoans, borrowContainer);
    renderLoanList(lendLoans, lendContainer);
}

function showLoanModal() {
    document.getElementById('loanModalTitle').innerText = 'Tambah Pinjaman';
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
    const loan = appData.loans.find(l => l.id == id);
    if (loan) {
        document.getElementById('loanModalTitle').innerText = 'Edit Pinjaman';
        document.getElementById('loanId').value = loan.id;
        document.getElementById('loanName').value = loan.name;
        document.getElementById('loanAmount').value = loan.amount;
        document.getElementById('installmentAmount').value = loan.installment || '';
        document.getElementById('loanDueDate').value = loan.dueDate;
        document.getElementById('loanStatus').value = loan.status;
        document.getElementById('loanTypeSelect').value = loan.type;
        document.getElementById('loanModal').style.display = 'flex';
    }
}

function saveLoan() {
    const id = document.getElementById('loanId').value;
    const name = document.getElementById('loanName').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const installment = parseFloat(document.getElementById('installmentAmount').value) || null;
    const dueDate = document.getElementById('loanDueDate').value;
    const status = document.getElementById('loanStatus').value;
    const type = document.getElementById('loanTypeSelect').value;
    
    if (!name || !amount || !dueDate) {
        alert('Lengkapi semua field!');
        return;
    }
    
    if (id) {
        updateLoan(id, { name, amount, installment, dueDate, status, type });
    } else {
        addLoan({ name, amount, installment, dueDate, status, type });
    }
    
    closeLoanModal();
    renderLoans();
}

function deleteLoanItem(id) {
    if (confirm('Hapus data pinjaman ini?')) {
        deleteLoan(id);
        renderLoans();
    }
}

function closeLoanModal() {
    document.getElementById('loanModal').style.display = 'none';
}

// Settings Page
function initSettingsPage() {
    document.getElementById('settingsUserName').value = appData.settings.userName;
    document.getElementById('themeSelect').value = appData.settings.theme;
    applyTheme();
    
    document.getElementById('settingsUserName').addEventListener('change', (e) => {
        appData.settings.userName = e.target.value;
        saveSettings();
        const dashboardUserName = document.getElementById('userName');
        if (dashboardUserName) dashboardUserName.innerText = e.target.value;
    });
    
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        appData.settings.theme = e.target.value;
        saveSettings();
        applyTheme();
    });
}

function applyTheme() {
    if (appData.settings.theme === 'light') {
        document.body.style.background = '#f0f2f5';
        document.body.style.color = '#1a1a2e';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #0a0f1e 0%, #0c1222 100%)';
        document.body.style.color = '#ffffff';
    }
}

function exportData() {
    const exportObj = {
        transactions: appData.transactions,
        savingsGoals: appData.savingsGoals,
        loans: appData.loans,
        budgets: appData.budgets,
        settings: appData.settings,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dompetku_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetAllData() {
    if (confirm('⚠️ PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?')) {
        localStorage.clear();
        location.reload();
    }
}

// Import JSON
document.addEventListener('DOMContentLoaded', () => {
    const importInput = document.getElementById('importFile');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (imported.transactions) appData.transactions = imported.transactions;
                        if (imported.savingsGoals) appData.savingsGoals = imported.savingsGoals;
                        if (imported.loans) appData.loans = imported.loans;
                        if (imported.budgets) appData.budgets = imported.budgets;
                        if (imported.settings) appData.settings = imported.settings;
                        
                        saveTransactions();
                        saveSavings();
                        saveLoans();
                        saveBudgets();
                        saveSettings();
                        
                        alert('Data berhasil diimport!');
                        location.reload();
                    } catch (err) {
                        alert('File tidak valid!');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
});
