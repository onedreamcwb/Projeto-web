const App = {
    // Estado interno para saber qual mês estamos olhando
    state: {
        currentMonth: new Date().toISOString().slice(0, 7) // Ex: "2026-03"
    },

    init: function () {
        console.log("App Iniciado");

        FormsHandler.init();

        // Configura o Filtro de Mês
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) {
            monthFilter.value = this.state.currentMonth; // Define o mês atual no input

            // Quando mudar a data, recarrega a tela
            monthFilter.addEventListener('change', (e) => {
                this.state.currentMonth = e.target.value;
                this.updateDashboard(); // Recarrega com o novo filtro
            });
        }

        // Processa recorrências (Despesas Fixas)
        RecurringManager.processRecurringExpenses();

        this.loadData();
    },

    loadData: function () {
        // Carrega tudo e atualiza
        this.updateDashboard();
    },

    updateDashboard: function () {
        const allTransactions = Storage.getTransactions();

        // --- A MÁGICA DO FILTRO ACONTECE AQUI ---
        // Filtra apenas as transações que começam com "YYYY-MM" selecionado
        const filteredTransactions = allTransactions.filter(tr =>
            tr.date.startsWith(this.state.currentMonth)
        );

        // Calcula totais baseados SOMENTE no mês filtrado
        const totals = Calculator.calculateTotals(filteredTransactions);

        // A Reserva de Emergência considera a média histórica (todos os dados), 
        // mas o progresso considera o saldo atual. Podemos manter assim.
        totals.reserveTarget = Calculator.calculateReserveTarget(allTransactions); // Média usa histórico

        // Atualiza a tela com os dados FILTRADOS
        Renderer.updateSummary(totals);
        Renderer.updateSimulator(totals);

        // Atualiza a tabela: Limpa a tabela atual e desenha só as filtradas
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = ''; // Limpa tudo

        // Ordena por data (mais recente primeiro)
        filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(tr => Renderer.renderTransaction(tr));
    },

    switchTab: function (tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        const selected = document.getElementById(tabName);
        if (selected) selected.style.display = 'block';
    },

    // (Mantenha a runSimulation aqui...)
    runSimulation: function () { /* ... código anterior ... */ }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});