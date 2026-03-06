const App = {
    // Estado da aplicação (Mês atual selecionado)
    state: {
        currentMonth: new Date().toISOString().slice(0, 7) // Ex: "2026-03"
    },

    init: function() {
        console.log("App Iniciado");
        
        // Inicializa o Formulário
        FormsHandler.init();
        
        // Configura o Filtro de Mês (Input no topo do Dashboard)
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            monthFilter.value = this.state.currentMonth;
            
            monthFilter.addEventListener('change', (e) => {
                this.state.currentMonth = e.target.value;
                this.updateDashboard(); // Recarrega ao mudar a data
            });
        }

        // Processa Despesas Recorrentes (Fixas)
        // Verifica se RecurringManager foi carregado antes de chamar
        if (typeof RecurringManager !== 'undefined') {
            RecurringManager.processRecurringExpenses();
        }
        
        // Carrega os dados iniciais
        this.loadData();
    },

    loadData: function() {
        this.updateDashboard();
    },

    // Atualiza toda a tela (Cards, Gráficos, Tabela)
    updateDashboard: function() {
        const allTransactions = Storage.getTransactions();
        
        // 1. Filtra transações pelo mês selecionado
        const filteredTransactions = allTransactions.filter(tr => 
            tr.date.startsWith(this.state.currentMonth)
        );

        // 2. Calcula os totais do mês
        const totals = Calculator.calculateTotals(filteredTransactions);
        
        // 3. Calcula Meta de Reserva (usa histórico completo para média real)
        totals.reserveTarget = Calculator.calculateReserveTarget(allTransactions);
        
        // 4. Atualiza Interface (Cards e Barra de Progresso)
        Renderer.updateSummary(totals);
        Renderer.updateSimulator(totals);

        // 5. Atualiza Gráficos (se o módulo existir)
        if (typeof Charts !== 'undefined') {
            Charts.updateCharts(filteredTransactions);
        }
        
        // 6. Atualiza a Tabela (Limpa e desenha as filtradas)
        const tbody = document.querySelector('#transactions-table tbody');
        if (tbody) {
            tbody.innerHTML = ''; // Limpa tabela
            
            // Ordena por data (mais recente primeiro) e renderiza
            filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .forEach(tr => Renderer.renderTransaction(tr));
        }
    },

    // --- AÇÕES DE EDIÇÃO E EXCLUSÃO (Conectadas aos botões da tabela) ---

    // Chamado quando clica no botão Excluir (Lixeira)
    handleDelete: function(id) {
        if (confirm("Tem certeza que deseja excluir este lançamento?")) {
            Storage.deleteTransaction(id);
            this.updateDashboard(); // Recarrega a tela para sumir com o item
            alert("Lançamento excluído.");
        }
    },

    // Chamado quando clica no botão Editar (Lápis)
    handleEdit: function(id) {
        const transaction = Storage.getTransactionById(id);
        if (transaction) {
            // Manda os dados para o formulário preencher
            FormsHandler.loadForEdit(transaction);
        } else {
            alert("Erro: Transação não encontrada.");
        }
    },

    // --- FUNCIONALIDADES EXTRAS ---

    // Alternar abas (Dashboard <-> Simulador)
    switchTab: function(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        const selected = document.getElementById(tabName);
        if (selected) selected.style.display = 'block';
    },

    // Executa a calculadora de investimentos
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
    }
};

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
