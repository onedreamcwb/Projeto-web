const FormsHandler = {
    form: document.getElementById('finance-form'),
    typeSelect: document.getElementById('tipo'),
    categorySelect: document.getElementById('categoria'),
    dateInput: document.getElementById('data'),

    init: function () {
        if (!this.form) return;

        // Define a data de hoje como padrão
        this.dateInput.valueAsDate = new Date();

        // Escuta mudanças no tipo (Entrada/Saída) para atualizar categorias
        this.typeSelect.addEventListener('change', () => this.updateCategories());

        // Captura o envio do formulário
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Inicializa as categorias com o valor padrão (Entrada)
        this.updateCategories();
    },

    updateCategories: function () {
        // Limpa as opções atuais
        this.categorySelect.innerHTML = '';

        const type = this.typeSelect.value; // 'entrada' ou 'saida'

        // Pega as categorias corretas baseadas no arquivo constants.js
        // Mapeando 'entrada' -> CATEGORIAS_ENTRADA e 'saida' -> CATEGORIAS_SAIDA
        const categories = type === 'entrada'
            ? CONFIG.CATEGORIAS_ENTRADA
            : CONFIG.CATEGORIAS_SAIDA;

        // Cria as opções no <select> dinamicamente
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.categorySelect.appendChild(option);
        });
    },

    handleSubmit: function (e) {
        e.preventDefault();

        // ... (Captura dos dados rawData igual antes) ...
        const rawData = {
            desc: document.getElementById('desc').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: this.typeSelect.value,
            categoria: this.categorySelect.value,
            data: this.dateInput.value,
            isRecurring: document.getElementById('is-recurring').checked // NOVO
        };

        // ... (Validação igual antes) ...

        // Cria transação normal
        const transaction = {
            id: Date.now(),
            description: rawData.desc,
            amount: rawData.valor,
            type: rawData.tipo,
            category: rawData.categoria,
            date: rawData.data,
            createdAt: new Date().toISOString()
        };

        // SE for recorrente, cria também a REGRA
        if (rawData.isRecurring) {
            const rule = {
                id: Date.now(), // ID da regra
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                day: new Date(rawData.data).getDate() + 1 // Pega o dia (ajuste de fuso simples)
            };
            Storage.saveRecurringRule(rule);
            transaction.recurringRuleId = rule.id; // Vincula a primeira transação à regra
        }

        Storage.saveTransaction(transaction);

        // ... (Reset e Atualização igual antes) ...
        // Importante: Desmarcar o checkbox no reset
        document.getElementById('is-recurring').checked = false;

        alert("Lançamento adicionado!");
        App.loadData(); // Recarrega tudo para garantir
    }
};
