const App = {
    // Estado da aplicação
    state: {
        currentMonth: new Date().toISOString().slice(0, 7) // Ex: "2026-03"
    },

    init: function() {
        console.log("App Iniciado");
        
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
                this.updateDashboard(); // Recarrega ao mudar a data
            });
        }

        // 3. Processa Despesas Recorrentes (Fixas)
        if (typeof RecurringManager !== 'undefined') {
            RecurringManager.processRecurringExpenses();
        }

        // 4. Configuração Inicial de Navegação
        // Garante que a aba "Resultados" comece ativa visualmente no menu
        this.switchTab('tab-resultados');
        
        // 5. Carrega os dados na tela
        this.loadData();
    },

    loadData: function() {
        this.updateDashboard();
    },

    // --- NÚCLEO: ATUALIZAÇÃO DO DASHBOARD ---
    updateDashboard: function() {
        const allTransactions = Storage.getTransactions();
        
        // 1. Filtra transações pelo mês selecionado
        const filteredTransactions = allTransactions.filter(tr => 
            tr.date.startsWith(this.state.currentMonth)
        );

        // 2. Calcula os totais do mês
        const totals = Calculator.calculateTotals(filteredTransactions);
        
        // 3. Calcula Meta de Reserva (usa histórico completo)
        totals.reserveTarget = Calculator.calculateReserveTarget(allTransactions);
        
        // 4. Atualiza Interface (Cards e Barra de Progresso)
        Renderer.updateSummary(totals);
        Renderer.updateSimulator(totals);

        // 5. Atualiza Gráficos (Envia dados do mês E histórico completo)
        if (typeof Charts !== 'undefined') {
            Charts.updateCharts(filteredTransactions, allTransactions);
        }
        
        // 6. Atualiza a Tabela
        const tbody = document.querySelector('#transactions-table tbody');
        if (tbody) {
            tbody.innerHTML = ''; // Limpa tabela
            
            // Ordena por data (mais recente primeiro)
            filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .forEach(tr => Renderer.renderTransaction(tr));
        }
    },

    // --- AÇÕES DE CRUD (Editar/Excluir) ---

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
            // Se estivermos em outra aba, volta para Resultados para ver o formulário
            this.switchTab('tab-resultados');
            
            // Carrega os dados no formulário
            FormsHandler.loadForEdit(transaction);
        } else {
            alert("Erro: Transação não encontrada.");
        }
    },

    // --- CALCULADORA (Aba Simulador) ---
    
    runSimulation: function() {
        const initial = parseFloat(document.getElementById('calc-inicial').value) || 0;
        const monthly = parseFloat(document.getElementById('calc-aporte').value) || 0;
        const rate = parseFloat(document.getElementById('calc-taxa').value) || 0;
        const years = parseFloat(document.getElementById('calc-tempo').value) || 0;

        const result = Calculator.calculateCompoundInterest(initial, monthly, rate, years);

        document.getElementById('res-investido').textContent = Renderer.formatCurrency(result.invested);
        document.getElementById('res-juros').textContent = Renderer.formatCurrency(result.interest);
        document.getElementById('res-total').textContent = Renderer.formatCurrency(result.total);

        document.getElementById('calc-results').style.display = 'grid';
    },

    // --- NAVEGAÇÃO E LAYOUT (NOVO) ---

    // Alterna entre as abas (Resultados, Entradas, Simulador, etc.)
    switchTab: function(tabId) {
        // 1. Esconde todas as seções de conteúdo
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // 2. Mostra apenas a seção desejada
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // 3. Atualiza o Menu Lateral (Classe 'active')
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            // Verifica se o botão clicado corresponde à aba atual
            // O getAttribute('onclick') retorna a string da função, ex: "App.switchTab('tab-resultados')"
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
                btn.classList.add('active');
            }
        });

        // 4. Atualiza o Título da Página no Header
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
        if (titleElement) {
            titleElement.textContent = pageTitles[tabId] || 'Finanças';
        }

        // 5. Fecha a sidebar automaticamente no Mobile após clicar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    },

    // Abre/Fecha a sidebar no Mobile (Botão Hambúrguer)
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }
};

// Inicializa quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});