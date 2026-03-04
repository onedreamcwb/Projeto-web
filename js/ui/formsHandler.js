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
        e.preventDefault(); // Impede o recarregamento da página

        // 1. Captura dos dados (Raw Data)
        const rawData = {
            desc: document.getElementById('desc').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: this.typeSelect.value,
            categoria: this.categorySelect.value,
            data: this.dateInput.value // YYYY-MM-DD
        };

        // 2. Validação básica (Fail Fast)
        if (isNaN(rawData.valor) || rawData.valor <= 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        // 3. Criação do Objeto de Transação (Normalização)
        const transaction = {
            id: Date.now(), // ID único baseado em Timestamp
            description: rawData.desc,
            amount: rawData.valor,
            type: rawData.tipo,
            category: rawData.categoria,
            date: rawData.data,
            createdAt: new Date().toISOString()
        };

        console.log("Transação Criada:", transaction);

        // 4. Salvar e Atualizar (Integração com os outros módulos)
        // Storage.save(transaction); -> Vamos implementar em breve
        // App.updateDashboard();     -> Vamos implementar em breve

        // Mock temporário para você ver funcionando no console agora:
        Storage.saveTransaction(transaction);

        // 5. Reset do Formulário e Feedback Visual
        this.form.reset();
        this.dateInput.valueAsDate = new Date(); // Restaura a data de hoje
        this.updateCategories(); // Restaura categorias

        // Feedback simples para o usuário
        alert("Lançamento adicionado com sucesso!");

        // Atualiza a tela (Chamada ao Renderer)
        Renderer.renderTransaction(transaction);
        App.updateDashboard();
    }
};
