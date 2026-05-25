// Storage Keys
const STORAGE_KEYS = {
    TRANSACTIONS: 'dompetku_transactions',
    SAVINGS_GOALS: 'dompetku_savings_goals',
    LOANS: 'dompetku_loans',
    BUDGETS: 'dompetku_budgets',
    SETTINGS: 'dompetku_settings'
};

// Data Structure
let appData = {
    transactions: [],
    savingsGoals: [],
    loans: [],
    budgets: [],
    settings: {
        userName: 'Pengguna',
        theme: 'dark'
    }
};

// Load Data
function loadData() {
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        const data = localStorage.getItem(storageKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (key === 'TRANSACTIONS') appData.transactions = Array.isArray(parsed) ? parsed : [];
                else if (key === 'SAVINGS_GOALS') appData.savingsGoals = Array.isArray(parsed) ? parsed : [];
                else if (key === 'LOANS') appData.loans = Array.isArray(parsed) ? parsed : [];
                else if (key === 'BUDGETS') appData.budgets = Array.isArray(parsed) ? parsed : [];
                else if (key === 'SETTINGS') appData.settings = { ...appData.settings, ...parsed };
            } catch (error) {
                console.warn('Data localStorage rusak:', storageKey, error);
            }
        }
    }
    
    // Initialize default budgets
    if (appData.budgets.length === 0) {
        const categories = ['makan', 'transport', 'belanja', 'tagihan', 'kesehatan', 'hiburan', 'pendidikan', 'lainnya'];
        categories.forEach(cat => {
            appData.budgets.push({
                id: Date.now() + Math.random() + cat,
                category: cat,
                limit: 1000000,
                month: new Date().getMonth(),
                year: new Date().getFullYear()
            });
        });
        saveBudgets();
    }
}

// Save Data
function saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(appData.transactions));
}

function saveSavings() {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(appData.savingsGoals));
}

function saveLoans() {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(appData.loans));
}

function saveBudgets() {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(appData.budgets));
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appData.settings));
}

// Transaction Functions
function addTransaction(transaction) {
    transaction.id = Date.now() + Math.floor(Math.random() * 1000);
    transaction.createdAt = new Date().toISOString();
    appData.transactions.unshift(transaction);
    saveTransactions();
    return transaction;
}

function updateTransaction(id, updatedTransaction) {
    const index = appData.transactions.findIndex(t => t.id == id);
    if (index !== -1) {
        appData.transactions[index] = { ...appData.transactions[index], ...updatedTransaction };
        saveTransactions();
        return true;
    }
    return false;
}

function deleteTransaction(id) {
    appData.transactions = appData.transactions.filter(t => t.id != id);
    saveTransactions();
}

function getTransactions() {
    return appData.transactions;
}

// Savings Functions
function addSavingsGoal(goal) {
    goal.id = Date.now() + Math.floor(Math.random() * 1000);
    goal.createdAt = new Date().toISOString();
    appData.savingsGoals.push(goal);
    saveSavings();
    return goal;
}

function updateSavingsGoal(id, updatedGoal) {
    const index = appData.savingsGoals.findIndex(g => g.id == id);
    if (index !== -1) {
        appData.savingsGoals[index] = { ...appData.savingsGoals[index], ...updatedGoal };
        saveSavings();
        return true;
    }
    return false;
}

function deleteSavingsGoal(id) {
    appData.savingsGoals = appData.savingsGoals.filter(g => g.id != id);
    saveSavings();
}

// Loan Functions
function addLoan(loan) {
    loan.id = Date.now() + Math.floor(Math.random() * 1000);
    loan.createdAt = new Date().toISOString();
    appData.loans.push(loan);
    saveLoans();
    return loan;
}

function updateLoan(id, updatedLoan) {
    const index = appData.loans.findIndex(l => l.id == id);
    if (index !== -1) {
        appData.loans[index] = { ...appData.loans[index], ...updatedLoan };
        saveLoans();
        return true;
    }
    return false;
}

function deleteLoan(id) {
    appData.loans = appData.loans.filter(l => l.id != id);
    saveLoans();
}

// Helper Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: now.getMonth(),
        year: now.getFullYear(),
        monthStr: now.toLocaleString('id-ID', { month: 'long' })
    };
}

function getCategoryIcon(category) {
    const icons = {
        makan: '🍔', transport: '🚗', belanja: '🛍️', gaji: '💼',
        usaha: '📈', tagihan: '📄', kesehatan: '🏥', hiburan: '🎬',
        pendidikan: '📚', tabungan: '🎯', pinjaman: '💳', lainnya: '📌'
    };
    return icons[category] || '📌';
}

// Load initial data
loadData();
