// Charts Module
let cashflowChart = null;

function renderCashflowChart() {
    const canvas = document.getElementById('cashflowChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get last 30 days data
    const dailyData = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { income: 0, expense: 0, balance: 0 };
    }
    
    appData.transactions.forEach(t => {
        if (dailyData[t.date]) {
            if (t.type === 'income') {
                dailyData[t.date].income += t.amount;
                dailyData[t.date].balance += t.amount;
            } else {
                dailyData[t.date].expense += t.amount;
                dailyData[t.date].balance -= t.amount;
            }
        }
    });
    
    // Calculate cumulative balance
    let runningBalance = 0;
    const labels = [];
    const balanceData = [];
    
    Object.keys(dailyData).sort().forEach(date => {
        const day = new Date(date).getDate();
        labels.push(day);
        runningBalance += dailyData[date].balance;
        balanceData.push(runningBalance);
    });
    
    if (cashflowChart) {
        cashflowChart.destroy();
    }
    
    cashflowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo Harian',
                data: balanceData,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#00ff88'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Saldo: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: { 
                        color: '#fff',
                        callback: (value) => formatCurrency(value)
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#fff', stepSize: 5 },
                    grid: { display: false }
                }
            }
        }
    });
}

// Budget Planner Logic (can be accessed from settings or separate page)
function getBudgetUsage() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const usage = [];
    
    appData.budgets.forEach(budget => {
        if (budget.month === currentMonth && budget.year === currentYear) {
            const spent = appData.transactions
                .filter(t => t.type === 'expense' && t.category === budget.category && new Date(t.date).getMonth() === currentMonth)
                .reduce((sum, t) => sum + t.amount, 0);
            
            usage.push({
                category: budget.category,
                limit: budget.limit,
                spent: spent,
                percent: (spent / budget.limit) * 100
            });
        }
    });
    
    return usage;
}

// Function to update budget limits
function updateBudgetLimit(category, newLimit) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const budgetIndex = appData.budgets.findIndex(b => b.category === category && b.month === currentMonth && b.year === currentYear);
    
    if (budgetIndex !== -1) {
        appData.budgets[budgetIndex].limit = newLimit;
    } else {
        appData.budgets.push({
            id: Date.now() + Math.random(),
            category: category,
            limit: newLimit,
            month: currentMonth,
            year: currentYear
        });
    }
    saveBudgets();
}
