const FormsHandler = {
    form: document.getElementById('finance-form'),
    typeSelect: document.getElementById('tipo'),
    categorySelect: document.getElementById('categoria'),
    dateInput: document.getElementById('data'),
    
    editIdInput: document.getElementById('edit-id'),
    submitBtn: document.getElementById('btn-submit'),
    cancelBtn: document.getElementById('btn-cancel'),

    init: function() {
        if (!this.form) return;

        this.dateInput.valueAsDate = new Date();
        
        this.typeSelect.addEventListener('change', () => this.updateCategories());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        this.updateCategories();
    },

    updateCategories: function(selectedCategory = null) {
        this.categorySelect.innerHTML = '';
        const type = this.typeSelect.value;
        const categories = type === 'entrada' ? CONFIG.CATEGORIAS_ENTRADA : CONFIG.CATEGORIAS_SAIDA;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.categorySelect.appendChild(option);
        });

        if (selectedCategory) {
            this.categorySelect.value = selectedCategory;
        }
    },

    loadForEdit: function(transaction) {
        this.editIdInput.value = transaction.id;
        document.getElementById('desc').value = transaction.description;
        document.getElementById('valor').value = transaction.amount;
        this.typeSelect.value = transaction.type;
        this.dateInput.value = transaction.date;
        
        this.updateCategories(transaction.category);

        this.submitBtn.textContent = "Salvar Alteração";
        this.submitBtn.style.backgroundColor = "#f59e0b";
        this.cancelBtn.style.display = "block";
        
        this.form.scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit: function() {
        this.form.reset();
        this.editIdInput.value = '';
        this.dateInput.valueAsDate = new Date();
        this.updateCategories();
        
        this.submitBtn.textContent = "Adicionar";
        this.submitBtn.style.backgroundColor = "";
        this.cancelBtn.style.display = "none";
    },

    handleSubmit: function(e) {
        e.preventDefault();

        const editId = this.editIdInput.value;
        const isEditing = !!editId;

        const rawData = {
            desc: document.getElementById('desc').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: this.typeSelect.value,
            categoria: this.categorySelect.value,
            data: this.dateInput.value,
            isRecurring: document.getElementById('is-recurring') ? document.getElementById('is-recurring').checked : false
        };

        if (isNaN(rawData.valor) || rawData.valor <= 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        if (isEditing) {
            // Edição
            const updatedTransaction = {
                id: editId,
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                date: rawData.data,
                updatedAt: new Date().toISOString()
            };
            
            Storage.updateTransaction(updatedTransaction);
            alert("Transação atualizada com sucesso!");
            this.cancelEdit();

        } else {
            // Criação Nova
            const newTransaction = {
                id: Date.now(),
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                date: rawData.data,
                createdAt: new Date().toISOString()
            };

            // --- LÓGICA DE RECORRÊNCIA CORRIGIDA ---
            if (rawData.isRecurring) {
                // Calcula a chave do mês atual (ex: "2026-03") baseada na data escolhida
                // Isso evita que o sistema gere de novo se a data for hoje
                const transactionMonth = rawData.data.slice(0, 7); 

                const rule = {
                    id: Date.now(),
                    description: rawData.desc,
                    amount: rawData.valor,
                    type: rawData.tipo,
                    category: rawData.categoria,
                    day: new Date(rawData.data).getDate() + 1, // Ajuste simples de fuso dia
                    // AQUI ESTÁ A CORREÇÃO:
                    // Já nasce dizendo: "Este mês está pago!"
                    generationHistory: [transactionMonth] 
                };
                Storage.saveRecurringRule(rule);
                newTransaction.recurringRuleId = rule.id;
            }

            Storage.saveTransaction(newTransaction);
            
            this.form.reset();
            this.dateInput.valueAsDate = new Date();
            this.updateCategories();
            
            alert("Lançamento adicionado!");
        }

        App.loadData();
    }
};