const Charts = {
    // Cores para o gráfico de rosca
    colors: [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
        '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
    ],

    // Função principal chamada pelo App
    updateCharts: function(currentMonthData, allHistoryData) {
        // Renderiza a Rosca (Mês Atual)
        this.renderExpenseChart(currentMonthData);
        
        // Renderiza as Barras (Histórico Completo)
        // Verificação de segurança para não quebrar se vier undefined
        if (allHistoryData && Array.isArray(allHistoryData)) {
            this.renderEvolutionChart(allHistoryData);
        }
    },

    // --- GRÁFICO 1: ROSCA (Gastos do Mês) ---
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
            }))
            .sort((a, b) => b.value - a.value);

        this.renderDonut(data);
        this.renderLegend(data);
        this.updateTotal(totalExpense);
    },

    renderDonut: function(data) {
        const chart = document.getElementById('expense-chart');
        if (!chart) return;

        let gradientParts = [];
        let currentPercent = 0;

        data.forEach(item => {
            const start = currentPercent;
            const end = currentPercent + item.percent;
            gradientParts.push(`${item.color} ${start}% ${end}%`);
            currentPercent = end;
        });

        chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    },

    renderLegend: function(data) {
        const legend = document.getElementById('expense-legend');
        if (!legend) return;
        legend.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'legend-item';
            div.innerHTML = `
                <span class="color-dot" style="background-color: ${item.color}"></span>
                <span>${item.name} (${Math.round(item.percent)}%)</span>
            `;
            legend.appendChild(div);
        });
    },

    updateTotal: function(value) {
        const el = document.getElementById('chart-total');
        if (el) {
            el.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
    },

    renderEmptyDonut: function() {
        const chart = document.getElementById('expense-chart');
        const legend = document.getElementById('expense-legend');
        const total = document.getElementById('chart-total');
        
        if (chart) chart.style.background = ''; 
        if (legend) legend.innerHTML = '<div class="legend-item">Sem dados no período</div>';
        if (total) total.textContent = 'R$ 0,00';
    },

    // --- GRÁFICO 2: BARRAS (Evolução Histórica) ---
    renderEvolutionChart: function(allTransactions) {
        const container = document.getElementById('evolution-chart');
        if (!container) return;
        
        container.innerHTML = ''; // Limpa o gráfico anterior

        // 1. Gera os últimos 6 meses (Corrigido para evitar bug de fuso horário)
        const months = [];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            // Cria data baseada no dia 15 para evitar problemas de virada de mês/fuso
            const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
            
            // Formata YYYY-MM manualmente (garante hora local)
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`; 
            
            // Pega nome do mês (ex: "mar")
            const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            
            months.push({ key, label, income: 0, expense: 0 });
        }

        // 2. Soma os valores (Agrupa por Mês YYYY-MM)
        allTransactions.forEach(t => {
            if (!t.date) return;
            const tMonth = t.date.slice(0, 7); // Pega "2026-02" da data da transação
            
            const monthObj = months.find(m => m.key === tMonth);
            if (monthObj) {
                if (t.type === 'entrada') monthObj.income += Number(t.amount);
                if (t.type === 'saida') monthObj.expense += Number(t.amount);
            }
        });

        // 3. Define escala (Valor máximo para calcular altura %)
        // Se o máximo for 0, usa 1 para não dividir por zero
        let maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)));
        if (maxVal === 0) maxVal = 1;

        // 4. Renderiza as barras no HTML
        months.forEach(m => {
            const hIncome = (m.income / maxVal) * 100;
            const hExpense = (m.expense / maxVal) * 100;

            const format = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

            // A classe 'bar' tem min-height: 2px no CSS, então sempre aparecerá um risquinho
            const html = `
                <div class="bar-group">
                    <div class="bars-container">
                        <div class="bar bar-income" style="height: ${hIncome}%" title="Entrada: ${format(m.income)}"></div>
                        <div class="bar bar-expense" style="height: ${hExpense}%" title="Saída: ${format(m.expense)}"></div>
                    </div>
                    <span class="bar-label">${m.label}</span>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }
};