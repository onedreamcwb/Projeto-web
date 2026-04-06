const RecurringManager = {
    processRecurringExpenses: function() {
        const rules = Storage.getRecurringRules();
        const today = new Date();
        // Formato YYYY-MM (Ex: "2026-03")
        const currentMonthKey = today.toISOString().slice(0, 7); 
        
        let updatesCount = 0;

        rules.forEach(rule => {
            // Se a regra não tiver histórico (regras antigas), cria um array vazio
            if (!rule.generationHistory) rule.generationHistory = [];

            // VERIFICAÇÃO INTELIGENTE:
            // "Eu já gerei esta despesa para este mês específico?"
            if (!rule.generationHistory.includes(currentMonthKey)) {
                
                // 1. Cria a transação
                // Ajusta o dia para o mês atual
                const transactionDate = `${currentMonthKey}-${String(rule.day).padStart(2, '0')}`;
                
                const newTransaction = {
                    id: Date.now() + Math.random(), // ID único garantido
                    description: rule.description,
                    amount: rule.amount,
                    type: rule.type,
                    category: rule.category,
                    date: transactionDate,
                    recurringRuleId: rule.id,
                    createdAt: new Date().toISOString()
                };

                Storage.saveTransaction(newTransaction);

                // 2. MARCA NA REGRA QUE JÁ FOI FEITO (A Vacina Anti-Zumbi 💉)
                rule.generationHistory.push(currentMonthKey);
                Storage.updateRecurringRule(rule);
                
                updatesCount++;
            }
        });

        if (updatesCount > 0) {
            console.log(`${updatesCount} despesas recorrentes geradas.`);
            return true; // Indica que houve mudanças
        }
        return false;
    }
};