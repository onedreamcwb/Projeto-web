const Storage = {
    // ... (Mantenha getTransactions e saveTransaction como estão) ...
    getTransactions: function () {
        return JSON.parse(localStorage.getItem('finance_transactions')) || [];
    },

    saveTransaction: function (transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    },

    // --- NOVO: Gestão de Regras Recorrentes ---
    getRecurringRules: function () {
        return JSON.parse(localStorage.getItem('finance_recurring_rules')) || [];
    },

    saveRecurringRule: function (rule) {
        const rules = this.getRecurringRules();
        // Evita duplicatas (Opcional: validação mais robusta depois)
        rules.push(rule);
        localStorage.setItem('finance_recurring_rules', JSON.stringify(rules));
    }
};
