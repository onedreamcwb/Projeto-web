const Storage = {
    KEYS: {
        TRANSACTIONS: 'finance_transactions',
        RULES: 'finance_recurring_rules'
    },

    // --- TRANSAÇÕES (CRUD) ---
    getTransactions: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS)) || [];
    },

    getTransactionById: function(id) {
        return this.getTransactions().find(t => String(t.id) === String(id));
    },

    saveTransaction: function(transaction) {
        const list = this.getTransactions();
        list.push(transaction);
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(list));
    },

    updateTransaction: function(updated) {
        let list = this.getTransactions();
        const index = list.findIndex(t => String(t.id) === String(updated.id));
        if (index !== -1) {
            list[index] = updated;
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(list));
        }
    },

    deleteTransaction: function(id) {
        let list = this.getTransactions();
        const newList = list.filter(t => String(t.id) !== String(id));
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(newList));
    },

    // --- REGRAS DE RECORRÊNCIA (Correção do Bug Zumbi) ---

    getRecurringRules: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.RULES)) || [];
    },

    saveRecurringRule: function(rule) {
        const list = this.getRecurringRules();
        // Garante que a regra tenha um histórico de gerações
        if (!rule.generationHistory) rule.generationHistory = []; 
        list.push(rule);
        localStorage.setItem(this.KEYS.RULES, JSON.stringify(list));
    },

    // NOVO: Atualiza a regra (para salvar que já geramos o mês X)
    updateRecurringRule: function(updatedRule) {
        let list = this.getRecurringRules();
        const index = list.findIndex(r => String(r.id) === String(updatedRule.id));
        if (index !== -1) {
            list[index] = updatedRule;
            localStorage.setItem(this.KEYS.RULES, JSON.stringify(list));
        }
    }
};