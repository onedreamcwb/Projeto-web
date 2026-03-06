const FormsHandler = {
    // Referências aos elementos do DOM
    form: document.getElementById('finance-form'),
    typeSelect: document.getElementById('tipo'),
    categorySelect: document.getElementById('categoria'),
    dateInput: document.getElementById('data'),
    
    // Novos elementos para controle de Edição
    editIdInput: document.getElementById('edit-id'),
    submitBtn: document.getElementById('btn-submit'),
    cancelBtn: document.getElementById('btn-cancel'),

    init: function() {
        if (!this.form) return;

        // Configuração inicial
        this.dateInput.valueAsDate = new Date();
        
        // Listeners (Eventos)
        this.typeSelect.addEventListener('change', () => this.updateCategories());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Botão Cancelar sai do modo edição
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Carrega categorias iniciais
        this.updateCategories();
    },

    // Atualiza o <select> de categorias baseado no Tipo (Entrada/Saída)
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

        // Se estivermos editando, mantém a categoria que estava salva
        if (selectedCategory) {
            this.categorySelect.value = selectedCategory;
        }
    },

    // --- MODO EDIÇÃO: Chamado quando clica no lápis ---
    loadForEdit: function(transaction) {
        // 1. Preenche os campos com os dados da transação
        this.editIdInput.value = transaction.id;
        document.getElementById('desc').value = transaction.description;
        document.getElementById('valor').value = transaction.amount;
        this.typeSelect.value = transaction.type;
        this.dateInput.value = transaction.date;
        
        // Atualiza a lista de categorias e seleciona a correta
        this.updateCategories(transaction.category);

        // 2. Altera a interface para modo "Salvar"
        this.submitBtn.textContent = "Salvar Alteração";
        this.submitBtn.style.backgroundColor = "#f59e0b"; // Amarelo (Atenção)
        this.cancelBtn.style.display = "block";
        
        // 3. Rola a tela até o formulário
        this.form.scrollIntoView({ behavior: 'smooth' });
    },

    // --- CANCELAR EDIÇÃO: Chamado pelo botão Cancelar ou após salvar ---
    cancelEdit: function() {
        this.form.reset();
        this.editIdInput.value = ''; // Limpa o ID
        this.dateInput.valueAsDate = new Date(); // Volta para data de hoje
        this.updateCategories(); // Reseta categorias
        
        // Reseta os botões para o padrão
        this.submitBtn.textContent = "Adicionar";
        this.submitBtn.style.backgroundColor = ""; // Remove cor inline (volta ao CSS original)
        this.cancelBtn.style.display = "none";
    },

    // --- ENVIAR FORMULÁRIO (Adicionar ou Editar) ---
    handleSubmit: function(e) {
        e.preventDefault();

        const editId = this.editIdInput.value;
        const isEditing = !!editId; // Se tem ID, estamos editando

        // Captura dados do formulário
        const rawData = {
            desc: document.getElementById('desc').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: this.typeSelect.value,
            categoria: this.categorySelect.value,
            data: this.dateInput.value,
            isRecurring: document.getElementById('is-recurring') ? document.getElementById('is-recurring').checked : false
        };

        // Validação Simples
        if (isNaN(rawData.valor) || rawData.valor <= 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        if (isEditing) {
            // >>> FLUXO DE ATUALIZAÇÃO <<<
            const updatedTransaction = {
                id: editId, // Mantém o ID original
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                date: rawData.data,
                updatedAt: new Date().toISOString()
            };
            
            Storage.updateTransaction(updatedTransaction);
            alert("Transação atualizada com sucesso!");
            this.cancelEdit(); // Sai do modo edição

        } else {
            // >>> FLUXO DE CRIAÇÃO (Novo) <<<
            const newTransaction = {
                id: Date.now(), // Gera novo ID
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                date: rawData.data,
                createdAt: new Date().toISOString()
            };

            // Se for marcado como recorrente, cria a regra
            if (rawData.isRecurring) {
                const rule = {
                    id: Date.now(),
                    description: rawData.desc,
                    amount: rawData.valor,
                    type: rawData.tipo,
                    category: rawData.categoria,
                    day: new Date(rawData.data).getDate() + 1
                };
                Storage.saveRecurringRule(rule);
                newTransaction.recurringRuleId = rule.id;
            }

            Storage.saveTransaction(newTransaction);
            
            // Limpa o formulário mantendo a data de hoje
            this.form.reset();
            this.dateInput.valueAsDate = new Date();
            this.updateCategories();
            
            alert("Lançamento adicionado!");
        }

        // Atualiza a Dashboard inteira
        App.loadData();
    }
};