const FormsHandler = {
    init: function() {
        this.formEntrada = document.getElementById('form-entrada');
        this.formSaida = document.getElementById('form-saida');

        // Configura Formulário de Entradas
        if (this.formEntrada) {
            this.populateCategories('entrada', 'cat-entrada');
            document.getElementById('data-entrada').valueAsDate = new Date();
            
            this.formEntrada.addEventListener('submit', (e) => this.handleSubmit(e, 'entrada'));
            document.getElementById('btn-cancel-entrada').addEventListener('click', () => this.cancelEdit('entrada'));
        }

        // Configura Formulário de Saídas
        if (this.formSaida) {
            this.populateCategories('saida', 'cat-saida');
            document.getElementById('data-saida').valueAsDate = new Date();
            
            this.formSaida.addEventListener('submit', (e) => this.handleSubmit(e, 'saida'));
            document.getElementById('btn-cancel-saida').addEventListener('click', () => this.cancelEdit('saida'));
        }
    },

    populateCategories: function(type, selectId, selectedValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        const categories = type === 'entrada' ? CONFIG.CATEGORIAS_ENTRADA : CONFIG.CATEGORIAS_SAIDA;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        if (selectedValue) select.value = selectedValue;
    },

    loadForEdit: function(transaction) {
        const type = transaction.type; // Descobre se é 'entrada' ou 'saida'
        
        // Preenche os campos do formulário correspondente
        document.getElementById(`edit-id-${type}`).value = transaction.id;
        document.getElementById(`desc-${type}`).value = transaction.description;
        document.getElementById(`valor-${type}`).value = transaction.amount;
        document.getElementById(`data-${type}`).value = transaction.date;
        
        this.populateCategories(type, `cat-${type}`, transaction.category);

        // Muda botões visualmente para modo "Edição"
        const submitBtn = document.getElementById(`btn-submit-${type}`);
        const cancelBtn = document.getElementById(`btn-cancel-${type}`);
        
        submitBtn.textContent = "Salvar Alteração";
        submitBtn.style.backgroundColor = "var(--warning-color)"; // Amarelo
        submitBtn.style.color = "white"; 
        cancelBtn.style.display = "block";
        
        // Dá scroll suave até o formulário
        document.getElementById(`form-${type}`).scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit: function(type) {
        const form = document.getElementById(`form-${type}`);
        form.reset();
        
        document.getElementById(`edit-id-${type}`).value = '';
        document.getElementById(`data-${type}`).valueAsDate = new Date();
        this.populateCategories(type, `cat-${type}`);
        
        const submitBtn = document.getElementById(`btn-submit-${type}`);
        const cancelBtn = document.getElementById(`btn-cancel-${type}`);
        
        // Retorna as cores normais
        submitBtn.textContent = type === 'entrada' ? "Adicionar Entrada" : "Adicionar Saída";
        submitBtn.style.backgroundColor = type === 'entrada' ? "var(--success-color)" : "var(--danger-color)";
        cancelBtn.style.display = "none";
    },

    handleSubmit: function(e, type) {
        e.preventDefault();

        const editId = document.getElementById(`edit-id-${type}`).value;
        const isEditing = !!editId;

        const rawData = {
            desc: document.getElementById(`desc-${type}`).value,
            valor: parseFloat(document.getElementById(`valor-${type}`).value),
            tipo: type, // Pega automaticamente baseado na aba em que está!
            categoria: document.getElementById(`cat-${type}`).value,
            data: document.getElementById(`data-${type}`).value,
            // Checkbox só existe no form de saída
            isRecurring: type === 'saida' && document.getElementById('is-recurring-saida') ? document.getElementById('is-recurring-saida').checked : false
        };

        if (isNaN(rawData.valor) || rawData.valor <= 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        if (isEditing) {
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
            alert("Alteração salva com sucesso!");
            this.cancelEdit(type);

        } else {
            const newTransaction = {
                id: Date.now(),
                description: rawData.desc,
                amount: rawData.valor,
                type: rawData.tipo,
                category: rawData.categoria,
                date: rawData.data,
                createdAt: new Date().toISOString()
            };

            // Lógica de Recorrência (Apenas Saídas)
            if (rawData.isRecurring) {
                const transactionMonth = rawData.data.slice(0, 7); 
                const rule = {
                    id: Date.now(),
                    description: rawData.desc,
                    amount: rawData.valor,
                    type: rawData.tipo,
                    category: rawData.categoria,
                    day: new Date(rawData.data).getDate() + 1,
                    generationHistory: [transactionMonth] 
                };
                Storage.saveRecurringRule(rule);
                newTransaction.recurringRuleId = rule.id;
            }

            Storage.saveTransaction(newTransaction);
            this.cancelEdit(type); // Limpa o form
            alert(`${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        }

        App.loadData();
    }
};