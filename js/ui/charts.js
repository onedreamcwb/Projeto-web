const Charts = {
    colors: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6'],

    updateCharts: function(currentMonthData, allHistoryData) {
        // Renderiza Rosca
        this.renderExpenseChart(currentMonthData);
        
        // Debug: Mostra no console se os dados chegaram
        console.log("Dados recebidos para gráfico de barras:", allHistoryData ? allHistoryData.length : "Nenhum");

        // Renderiza Barras
        if (allHistoryData && Array.isArray(allHistoryData)) {
            this.renderEvolutionChart(allHistoryData);
        } else {
            console.error("ERRO: Histórico não foi passado para o Charts.js. Verifique o App.js");
        }
    },

    // --- GRÁFICO 1: ROSCA (MANTIDO IGUAL) ---
    renderExpenseChart: function(transactions) {
        const expenses = transactions.filter(t => t.type === 'saida');
        const totalExpense = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
        
        if (totalExpense === 0) {
            this.renderEmptyDonut();
            return;
        }

        const categories = {};
        expenses.forEach(t => {
            if (!categories[t.category]) categories[t.category] = 0;
            categories[t.category] += Number(t.amount);
        });

        const data = Object.entries(categories)
            .map(([name, value], index) => ({
                name,
                value,
                percent: (value / totalExpense) * 100,
                color: this.colors[index % this.colors.length]
            })).sort((a, b) => b.value - a.value);

        this.renderDonut(data);
        this.renderLegend(data);
        this.updateTotal(totalExpense);
    },

    renderDonut: function(data) {
        const chart = document.getElementById('expense-chart');
        if(!chart) return;
        let gradient = [], curr = 0;
        data.forEach(d => {
            gradient.push(`${d.color} ${curr}% ${curr + d.percent}%`);
            curr += d.percent;
        });
        chart.style.background = `conic-gradient(${gradient.join(', ')})`;
    },

    renderLegend: function(data) {
        const legend = document.getElementById('expense-legend');
        if(!legend) return;
        legend.innerHTML = data.map(d => 
            `<div class="legend-item"><span class="color-dot" style="background:${d.color}"></span><span>${d.name} (${Math.round(d.percent)}%)</span></div>`
        ).join('');
    },

    updateTotal: function(val) {
        const el = document.getElementById('chart-total');
        if(el) el.textContent = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(val);
    },

    renderEmptyDonut: function() {
        const chart = document.getElementById('expense-chart');
        if(chart) chart.style.background = '#e2e8f0';
        const legend = document.getElementById('expense-legend');
        if(legend) legend.innerHTML = '<div class="legend-item">Sem dados</div>';
        const total = document.getElementById('chart-total');
        if(total) total.textContent = 'R$ 0,00';
    },

    // --- GRÁFICO 2: BARRAS (ATUALIZADO E SEGURO) ---
    renderEvolutionChart: function(allTransactions) {
        const container = document.getElementById('evolution-chart');
        if (!container) return;
        container.innerHTML = '';

        // 1. Gera últimos 6 meses
        const months = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            // Usa dia 15 para evitar problemas de fuso
            const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            months.push({ key, label, income: 0, expense: 0 });
        }

        // 2. Soma valores
        allTransactions.forEach(t => {
            if (!t.date) return;
            const key = t.date.slice(0, 7);
            const m = months.find(x => x.key === key);
            if (m) {
                if (t.type === 'entrada') m.income += Number(t.amount);
                if (t.type === 'saida') m.expense += Number(t.amount);
            }
        });

        // 3. Escala (Evita divisão por zero)
        const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);

        // 4. Renderiza
        months.forEach(m => {
            const hIncome = (m.income / maxVal) * 100;
            const hExpense = (m.expense / maxVal) * 100;
            
            const html = `
                <div class="bar-group">
                    <div class="bars-container">
                        <div class="bar bar-income" style="height: ${hIncome}%" title="R$ ${m.income}"></div>
                        <div class="bar bar-expense" style="height: ${hExpense}%" title="R$ ${m.expense}"></div>
                    </div>
                    <span class="bar-label">${m.label}</span>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }
};