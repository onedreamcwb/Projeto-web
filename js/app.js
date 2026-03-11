const App = {
    // Estado da aplicação
    state: {
        currentMonth: new Date().toISOString().slice(0, 7) // Ex: "2026-03"
    },

    init: function() {
        // 1. Inicializa o Formulário
        if (typeof FormsHandler !== 'undefined') {
            FormsHandler.init();
        }
        
        // 2. Configura o Filtro de Mês (Topo do Dashboard)
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            monthFilter.value = this.state.currentMonth;
            monthFilter.addEventListener('change', (e) => {
                this.state.currentMonth = e.target.value;
                this.updateDashboard(); 
            });
        }

        // 3. Processa Despesas Recorrentes
        if (typeof RecurringManager !== 'undefined') {
            RecurringManager.processRecurringExpenses();
        }

        // 4. Configuração Inicial de Navegação
        this.switchTab('tab-resultados');
        this.loadData();
        
        // 5. Ouvintes dos Formulários Extras
        const formAporte = document.getElementById('form-aporte');
        if (formAporte) {
            document.getElementById('aporte-data').value = new Date().toISOString().split('T')[0];
            formAporte.addEventListener('submit', (e) => this.handleAporteSubmit(e));
        }
        
        const formPatrimonio = document.getElementById('form-patrimonio');
        if (formPatrimonio) {
            formPatrimonio.addEventListener('submit', (e) => this.handlePatrimonioSubmit(e));
        }
    },

    loadData: function() {
        this.updateDashboard();
    },

    updateDashboard: function() {
        const allTransactions = Storage.getTransactions();
        const filteredTransactions = allTransactions.filter(tr => tr.date.startsWith(this.state.currentMonth));

        const totals = Calculator.calculateTotals(filteredTransactions);
        totals.reserveTarget = Calculator.calculateReserveTarget(allTransactions);
        
        Renderer.updateSummary(totals);
        
        // Integração de Aportes
        const allAportes = JSON.parse(localStorage.getItem('finance_aportes') || '[]');
        const aportesMes = allAportes.filter(a => a.date.startsWith(this.state.currentMonth));
        const totalAportes = aportesMes.reduce((acc, a) => acc + Number(a.amount), 0);

        const cardAporteDash = document.querySelector('#card-aporte-dash .value');
        if (cardAporteDash) cardAporteDash.textContent = Renderer.formatCurrency(totalAportes);

        const saldoLivre = totals.balance - totalAportes;
        const cardSaldoLivre = document.getElementById('valor-saldo-livre');
        if (cardSaldoLivre) {
            cardSaldoLivre.textContent = Renderer.formatCurrency(saldoLivre);
            cardSaldoLivre.className = `value ${saldoLivre >= 0 ? 'text-success' : 'text-danger'}`;
        }
        
        Renderer.updateSimulator(totals);

        if (typeof Charts !== 'undefined') {
            Charts.updateCharts(filteredTransactions, allTransactions);
        }
        
        const tbody = document.querySelector('#transactions-table tbody');
        if (tbody) {
            tbody.innerHTML = ''; 
            filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .forEach(tr => Renderer.renderTransaction(tr));
        }
        
        this.updateSeparatedTabs(filteredTransactions);
    },

    handleDelete: function(id) {
        if (confirm("Tem certeza que deseja excluir este lançamento?")) {
            Storage.deleteTransaction(id);
            this.updateDashboard();
            alert("Lançamento excluído.");
        }
    },

    handleEdit: function(id) {
        const transaction = Storage.getTransactionById(id);
        if (transaction) {
            // INTELIGÊNCIA DE ROTA: Descobre se é entrada ou saída e leva pra aba certa
            const tabId = transaction.type === 'entrada' ? 'tab-entradas' : 'tab-saidas';
            this.switchTab(tabId);
            
            // Manda preencher
            FormsHandler.loadForEdit(transaction);
        } else {
            alert("Erro: Transação não encontrada.");
        }
    },

    runSimulation: function() {
        const initial = parseFloat(document.getElementById('calc-inicial').value) || 0;
        const monthly = parseFloat(document.getElementById('calc-aporte').value) || 0;
        const rate = parseFloat(document.getElementById('calc-taxa').value) || 0;
        const years = parseFloat(document.getElementById('calc-tempo').value) || 0;

        const result = Calculator.calculateCompoundInterest(initial, monthly, rate, years);

        document.getElementById('res-investido').textContent = Renderer.formatCurrency(result.invested);
        document.getElementById('res-juros').textContent = Renderer.formatCurrency(result.interest);
        document.getElementById('res-total').textContent = Renderer.formatCurrency(result.total);

        // Usando block via classe em vez de inline styles
        document.getElementById('calc-results').style.display = 'block'; 
    },

    switchTab: function(tabId) {
        // Usa as classes puras do CSS (Sem display: block inline)
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
                btn.classList.add('active');
            }
        });

        const pageTitles = {
            'tab-resultados': 'Visão Geral',
            'tab-entradas': 'Gestão de Entradas',
            'tab-saidas': 'Gestão de Saídas',
            'tab-aporte': 'Meus Aportes',
            'tab-mensal': 'Despesas Fixas',
            'tab-previsao': 'Planejamento',
            'tab-patrimonio': 'Balanço Patrimonial',
            'tab-simulador': 'Simulador de Investimentos'
        };
        
        const titleElement = document.getElementById('page-title');
        if (titleElement) titleElement.textContent = pageTitles[tabId] || 'Finanças';

        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
        
        if (tabId === 'tab-mensal') this.updateRecurringTab();
        if (tabId === 'tab-aporte') this.updateAporteTab();
        if (tabId === 'tab-patrimonio') this.updatePatrimonioTab();
    },

    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('open');
    },

    updateRecurringTab: function() {
        if (typeof Storage === 'undefined') return;
        const rules = Storage.getRecurringRules() || [];
        let totalEntradas = 0, totalSaidas = 0;
        const tbody = document.querySelector('#recurring-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (rules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-subtitle">Nenhuma conta fixa cadastrada.</td></tr>';
            return;
        }
        
        rules.forEach(rule => {
            if (rule.type === 'entrada') totalEntradas += Number(rule.amount);
            if (rule.type === 'saida') totalSaidas += Number(rule.amount);
            
            const tr = document.createElement('tr');
            const corClass = rule.type === 'entrada' ? 'text-success' : 'text-danger';

            tr.innerHTML = `
                <td style="font-weight: 600; color: #1e293b;">${rule.description}</td>
                <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #475569;">${rule.category}</span></td>
                <td style="text-transform: capitalize; color: #64748b;">${rule.type}</td>
                <td class="${corClass}" style="font-weight: bold;">R$ ${Number(rule.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td>
                    <button onclick="App.deleteRecurringRule('${rule.id}')" class="btn-action btn-delete" title="Cancelar Conta Fixa">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('mensal-entrada-total').textContent = `R$ ${totalEntradas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        document.getElementById('mensal-saida-total').textContent = `R$ ${totalSaidas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    },

    deleteRecurringRule: function(id) {
        if (confirm("Tem certeza que deseja CANCELAR esta conta fixa?\n\nEla não será mais gerada nos próximos meses.")) {
            let rules = Storage.getRecurringRules() || [];
            rules = rules.filter(r => String(r.id) !== String(id));
            
            if (typeof Storage.saveRecurringRules === 'function') {
                Storage.saveRecurringRules(rules);
            } else {
                localStorage.setItem('finance_recurring_rules', JSON.stringify(rules));
                localStorage.setItem('finance_recurring', JSON.stringify(rules)); 
            }
            this.updateRecurringTab();
            this.updateDashboard(); 
        }
    },

    updateSeparatedTabs: function(filteredTransactions) {
        const entradas = filteredTransactions.filter(t => t.type === 'entrada');
        const saidas = filteredTransactions.filter(t => t.type === 'saida');

        const totalEntradas = entradas.reduce((acc, t) => acc + Number(t.amount), 0);
        const totalSaidas = saidas.reduce((acc, t) => acc + Number(t.amount), 0);

        const cardEntrada = document.getElementById('total-entradas-aba');
        if (cardEntrada) cardEntrada.textContent = Renderer.formatCurrency(totalEntradas);
        
        const cardSaida = document.getElementById('total-saidas-aba');
        if (cardSaida) cardSaida.textContent = Renderer.formatCurrency(totalSaidas);

        this.renderTableData('#entradas-table tbody', entradas, 'entrada');
        this.renderTableData('#saidas-table tbody', saidas, 'saida');
    },

    renderTableData: function(selector, transactions, type) {
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-subtitle">Nenhuma ${type} registrada neste mês.</td></tr>`;
            return;
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
            const tr = document.createElement('tr');
            const [ano, mes, dia] = t.date.split('-');
            
            const corClass = t.type === 'entrada' ? 'text-success' : 'text-danger';
            const sinal = t.type === 'saida' ? '- ' : '';
            
            tr.innerHTML = `
                <td class="text-subtitle">${dia}/${mes}/${ano}</td>
                <td style="font-weight: 500; color: #1e293b;">${t.description}</td>
                <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #475569;">${t.category}</span></td>
                <td class="text-right ${corClass}" style="font-weight: bold;">${sinal}${Renderer.formatCurrency(t.amount)}</td>
                <td class="text-center">
                    <button class="btn-action btn-edit" onclick="App.handleEdit('${t.id}')" title="Editar">✏️</button>
                    <button class="btn-action btn-delete" onclick="App.handleDelete('${t.id}')" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    handleAporteSubmit: function(e) {
        e.preventDefault();
        const aporte = {
            id: Date.now().toString(),
            description: document.getElementById('aporte-desc').value,
            category: document.getElementById('aporte-cat').value,
            amount: parseFloat(document.getElementById('aporte-valor').value),
            date: document.getElementById('aporte-data').value
        };

        const aportes = JSON.parse(localStorage.getItem('finance_aportes') || '[]');
        aportes.push(aporte);
        localStorage.setItem('finance_aportes', JSON.stringify(aportes));

        document.getElementById('aporte-desc').value = '';
        document.getElementById('aporte-valor').value = '';
        
        this.updateAporteTab();
        this.updateDashboard(); 
        alert("Investimento registrado com sucesso! 🚀");
    },

    updateAporteTab: function() {
        const tbody = document.querySelector('#aportes-table tbody');
        if (!tbody) return;
        
        const allAportes = JSON.parse(localStorage.getItem('finance_aportes') || '[]');
        const currentMonth = document.getElementById('month-filter').value;
        const filteredAportes = allAportes.filter(a => a.date.startsWith(currentMonth));
        
        let totalMes = 0;
        tbody.innerHTML = '';
        
        if (filteredAportes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-subtitle">Nenhum aporte registrado neste mês. Que tal investir algo?</td></tr>`;
        } else {
            filteredAportes.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(a => {
                totalMes += Number(a.amount);
                const tr = document.createElement('tr');
                const [ano, mes, dia] = a.date.split('-');
                
                tr.innerHTML = `
                    <td class="text-subtitle">${dia}/${mes}/${ano}</td>
                    <td style="font-weight: 600; color: #1e3a8a;">${a.description}</td>
                    <td><span style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #1e40af;">${a.category}</span></td>
                    <td class="text-right text-primary" style="font-weight: bold;">R$ ${a.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="text-center">
                        <button class="btn-action btn-delete" onclick="App.deleteAporte('${a.id}')" title="Excluir">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        document.getElementById('aporte-total-mes').textContent = `R$ ${totalMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    },

    deleteAporte: function(id) {
        if (confirm("Tem certeza que deseja excluir este investimento?")) {
            let aportes = JSON.parse(localStorage.getItem('finance_aportes') || '[]');
            aportes = aportes.filter(a => String(a.id) !== String(id));
            localStorage.setItem('finance_aportes', JSON.stringify(aportes));
            this.updateAporteTab();
            this.updateDashboard();
        }
    },

    handlePatrimonioSubmit: function(e) {
        e.preventDefault();
        const item = {
            id: Date.now().toString(),
            description: document.getElementById('patrimonio-desc').value,
            type: document.getElementById('patrimonio-tipo').value,
            amount: parseFloat(document.getElementById('patrimonio-valor').value)
        };

        const patrimonio = JSON.parse(localStorage.getItem('finance_patrimonio') || '[]');
        patrimonio.push(item);
        localStorage.setItem('finance_patrimonio', JSON.stringify(patrimonio));

        document.getElementById('patrimonio-desc').value = '';
        document.getElementById('patrimonio-valor').value = '';
        
        this.updatePatrimonioTab();
        alert("Patrimônio atualizado com sucesso! 🏛️");
    },

    updatePatrimonioTab: function() {
        const tbody = document.querySelector('#patrimonio-table tbody');
        if (!tbody) return;
        
        const patrimonio = JSON.parse(localStorage.getItem('finance_patrimonio') || '[]');
        let totalAtivos = 0, totalPassivos = 0;
        
        tbody.innerHTML = '';
        if (patrimonio.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-subtitle">Nenhum bem ou dívida registada.</td></tr>`;
        } else {
            patrimonio.forEach(item => {
                if (item.type === 'ativo') totalAtivos += Number(item.amount);
                if (item.type === 'passivo') totalPassivos += Number(item.amount);
                
                const tr = document.createElement('tr');
                const corClass = item.type === 'ativo' ? 'text-success' : 'text-danger';
                const labelTipo = item.type === 'ativo' ? 'Ativo' : 'Passivo';
                const corBadge = item.type === 'ativo' ? '#dcfce7' : '#fee2e2';
                const corTextoBadge = item.type === 'ativo' ? '#166534' : '#991b1b';
                
                tr.innerHTML = `
                    <td style="font-weight: 600; color: #1e293b;">${item.description}</td>
                    <td><span style="background: ${corBadge}; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: ${corTextoBadge}; font-weight: bold;">${labelTipo}</span></td>
                    <td class="text-right ${corClass}" style="font-weight: bold;">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="text-center">
                        <button class="btn-action btn-delete" onclick="App.deletePatrimonio('${item.id}')" title="Remover">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        const patrimonioLiquido = totalAtivos - totalPassivos;
        document.getElementById('patrimonio-ativos').textContent = `R$ ${totalAtivos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        document.getElementById('patrimonio-passivos').textContent = `R$ ${totalPassivos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        
        const liquiElement = document.getElementById('patrimonio-liquido');
        liquiElement.textContent = `R$ ${patrimonioLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        liquiElement.className = `value ${patrimonioLiquido >= 0 ? 'text-primary' : 'text-danger'}`;
    },

    deletePatrimonio: function(id) {
        if (confirm("Tem a certeza de que deseja remover este item do seu patrimônio?")) {
            let patrimonio = JSON.parse(localStorage.getItem('finance_patrimonio') || '[]');
            patrimonio = patrimonio.filter(p => String(p.id) !== String(id));
            localStorage.setItem('finance_patrimonio', JSON.stringify(patrimonio));
            this.updatePatrimonioTab();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});