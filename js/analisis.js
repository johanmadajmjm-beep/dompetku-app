// Analysis Page Logic
let pieChartInstance = null;
let barChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    renderAnalysis();
});

function renderAnalysis() {
    updateAnalysisStats();
    renderPieChart();
    renderBarChart();
    renderTrendInfo();
}

function updateAnalysisStats() {
    const transactions = appData.transactions;
    const totalTransactions = transactions.length;
    
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const avgIncome = incomeTransactions.length > 0 
        ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length 
        : 0;
    const avgExpense = expenseTransactions.length > 0 
        ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length 
        : 0;
    
    document.getElementById('totalTransactions').innerText = totalTransactions;
    document.getElementById('avgIncome').innerHTML = formatCurrency(avgIncome);
    document.getElementById('avgExpense').innerHTML = formatCurrency(avgExpense);
}

function renderPieChart() {
    const ctx = document.getElementById('pieChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get expense by category
    const categoryMap = {};
    appData.transactions.forEach(t => {
        if (t.type === 'expense') {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        }
    });
    
    const categories = Object.keys(categoryMap);
    const amounts = Object.values(categoryMap);
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.map(c => `${getCategoryIcon(c)} ${c}`),
            datasets: [{
                data: amounts,
                backgroundColor: ['#00ff88', '#ff4757', '#ffa502', '#1e90ff', '#9b59b6', '#e84393', '#00cec9', '#fdcb6e', '#6c5ce7', '#a4b0be'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderBarChart() {
    const ctx = document.getElementById('barChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get last 6 months data
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('id-ID', { month: 'short' });
        months.push(monthName);
        
        let monthIncome = 0;
        let monthExpense = 0;
        
        appData.transactions.forEach(t => {
            const transDate = new Date(t.date);
            if (transDate.getMonth() === date.getMonth() && transDate.getFullYear() === date.getFullYear()) {
                if (t.type === 'income') monthIncome += t.amount;
                else monthExpense += t.amount;
            }
        });
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
    }
    
    if (barChartInstance) {
        barChartInstance.destroy();
    }
    
    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: '#00ff88',
                    borderRadius: 8
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: '#ff4757',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#fff', callback: (value) => formatCurrency(value) }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

function renderTrendInfo() {
    const container = document.getElementById('trendInfo');
    if (!container) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    let currentIncome = 0, currentExpense = 0;
    let lastIncome = 0, lastExpense = 0;
    
    appData.transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
            if (t.type === 'income') currentIncome += t.amount;
            else currentExpense += t.amount;
        }
        if (transDate.getMonth() === lastMonth && transDate.getFullYear() === lastMonthYear) {
            if (t.type === 'income') lastIncome += t.amount;
            else lastExpense += t.amount;
        }
    });
    
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome * 100).toFixed(1) : 0;
    const expenseChange = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense * 100).toFixed(1) : 0;
    const netChange = (currentIncome - currentExpense) - (lastIncome - lastExpense);
    
    container.innerHTML = `
        <div style="margin-bottom: 12px;">
            <div>📈 Pemasukan: ${formatCurrency(currentIncome)} ${incomeChange >= 0 ? '↑' : '↓'} ${Math.abs(incomeChange)}%</div>
            <div>📉 Pengeluaran: ${formatCurrency(currentExpense)} ${expenseChange >= 0 ? '↑' : '↓'} ${Math.abs(expenseChange)}%</div>
        </div>
        <div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <strong>${netChange >= 0 ? '✅ Sisa kas lebih baik' : '⚠️ Defisit meningkat'}</strong>
            <div>${netChange >= 0 ? '+' : '-'} ${formatCurrency(Math.abs(netChange))} dibanding bulan lalu</div>
        </div>
    `;
}
