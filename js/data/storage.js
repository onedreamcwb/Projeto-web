const Storage = {
    // Keys do LocalStorage (Constantes para evitar erros de digitação)
    KEYS: {
        TRANSACTIONS: 'finance_transactions',
        RULES: 'finance_recurring_rules'
    },

    // --- MÉTODOS DE TRANSAÇÃO (CRUD) ---

    // 1. LER (Read) - Pega todas as transações
    getTransactions: function() {
        const data = localStorage.getItem(this.KEYS.TRANSACTIONS);
        return JSON.parse(data) || [];
    },

    // 2. LER POR ID - Pega uma específica para edição
    getTransactionById: function(id) {
        const transactions = this.getTransactions();
        // Converte para String para garantir que a comparação funcione (número vs texto)
        return transactions.find(t => String(t.id) === String(id));
    },

    // 3. CRIAR (Create) - Salva uma nova
    saveTransaction: function(transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    // 4. ATUALIZAR (Update) - Substitui uma existente
    updateTransaction: function(updatedTransaction) {
        let transactions = this.getTransactions();
        
        // Encontra o índice da transação antiga
        const index = transactions.findIndex(t => String(t.id) === String(updatedTransaction.id));
        
        if (index !== -1) {
            // Substitui a antiga pela nova
            transactions[index] = updatedTransaction;
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
        } else {
            console.error("Erro: Tentativa de atualizar transação inexistente ID:", updatedTransaction.id);
        }
    },

    // 5. DELETAR (Delete) - Remove uma transação
    deleteTransaction: function(id) {
        let transactions = this.getTransactions();
        
        // Filtra mantendo apenas as que NÃO têm o ID informado
        const newTransactions = transactions.filter(t => String(t.id) !== String(id));
        
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
    },

    // --- MÉTODOS DE RECORRÊNCIA (Regras Fixas) ---

    // Pega todas as regras de recorrência salvas
    getRecurringRules: function() {
        const data = localStorage.getItem(this.KEYS.RULES);
        return JSON.parse(data) || [];
    },

    // Salva uma nova regra de recorrência
    saveRecurringRule: function(rule) {
        const rules = this.getRecurringRules();
        rules.push(rule);
        localStorage.setItem(this.KEYS.RULES, JSON.stringify(rules));
    }
};