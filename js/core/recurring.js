const RecurringManager = {
    // Verifica e gera despesas para o mês atual
    processRecurringExpenses: function () {
        const rules = Storage.getRecurringRules();
        const transactions = Storage.getTransactions();

        const hoje = new Date();
        const anoMesAtual = hoje.toISOString().slice(0, 7); // Ex: "2026-03"

        let generatedCount = 0;

        rules.forEach(rule => {
            // Verifica se esta regra JÁ foi processada para ESTE mês
            const alreadyExists = transactions.some(t =>
                t.recurringRuleId === rule.id &&
                t.date.startsWith(anoMesAtual)
            );

            if (!alreadyExists) {
                // Cria a transação automaticamente
                const newTransaction = {
                    id: Date.now() + Math.random(), // ID único
                    description: rule.description,
                    amount: rule.amount,
                    type: rule.type,
                    category: rule.category,
                    date: `${anoMesAtual}-${String(rule.day).padStart(2, '0')}`, // Mantém o dia original
                    recurringRuleId: rule.id, // Vínculo com a regra
                    createdAt: new Date().toISOString()
                };

                Storage.saveTransaction(newTransaction);
                generatedCount++;
            }
        });

        if (generatedCount > 0) {
            alert(`${generatedCount} despesas fixas foram geradas automaticamente para este mês!`);
            return true; // Indica que houve mudanças
        }
        return false;
    }
};