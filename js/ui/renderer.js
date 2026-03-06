const Renderer = {
    // Renderiza uma única linha na tabela de movimentações
    renderTransaction: function(transaction) {
        const tbody = document.querySelector('#transactions-table tbody');
        const tr = document.createElement('tr');

        // Formatação de moeda e cor
        const amountFormatted = this.formatCurrency(transaction.amount);
        
        // Define a cor baseada no tipo (Verde para Entrada, Vermelho para Saída)
        // Usamos variáveis CSS inline para garantir a cor correta
        const colorStyle = transaction.type === 'entrada' ? 'var(--success-color)' : 'var(--danger-color)';
        const signal = transaction.type === 'saida' ? '-' : '';

        // Monta o HTML da linha
        tr.innerHTML = `
            <td>${new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td>${transaction.description}</td>
            <td><span class="category-tag">${transaction.category}</span></td>
            <td style="color: ${colorStyle}; font-weight:bold;">
                ${signal} ${amountFormatted}
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="App.handleEdit('${transaction.id}')" title="Editar">✏️</button>
                <button class="btn-action btn-delete" onclick="App.handleDelete('${transaction.id}')" title="Excluir">🗑️</button>
            </td>
        `;

        // Adiciona a linha no topo da tabela (prepend) ou final (appendChild)
        // Usamos appendChild aqui pois a ordenação já é feita no App.js antes de chamar o render
        tbody.appendChild(tr);
    },

    // Atualiza os Cards do topo (Entrada, Saída, Saldo)
    updateSummary: function(totals) {
        const cardEntrada = document.querySelector('#card-entrada .value');
        const cardSaida = document.querySelector('#card-saida .value');
        const cardResultado = document.querySelector('#card-resultado .value');

        if(cardEntrada) cardEntrada.textContent = this.formatCurrency(totals.income);
        if(cardSaida) cardSaida.textContent = this.formatCurrency(totals.expense);
        
        if(cardResultado) {
            cardResultado.textContent = this.formatCurrency(totals.balance);
            // Muda a cor do texto do resultado
            cardResultado.style.color = totals.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }
    },

    // Atualiza a Barra de Progresso da Reserva (Aba Simulador)
    updateSimulator: function(totals) {
        const metaReserva = totals.reserveTarget || 0;
        const saldoAtual = totals.balance || 0;

        // Atualiza textos
        const elMedia = document.getElementById('sim-media-gastos');
        const elMeta = document.getElementById('sim-meta-reserva');
        
        if (elMedia) elMedia.textContent = this.formatCurrency(metaReserva / 6);
        if (elMeta) elMeta.textContent = this.formatCurrency(metaReserva);

        // Atualiza Barra
        const progressFill = document.getElementById('sim-progress-fill');
        const progressText = document.getElementById('sim-progress-text');

        if (progressFill && progressText) {
            let percentage = 0;
            if (metaReserva > 0) {
                percentage = (saldoAtual / metaReserva) * 100;
            }
            
            // Trava visualmente em 100%
            const visualPercentage = Math.min(percentage, 100);
            
            progressFill.style.width = `${visualPercentage}%`;
            progressText.textContent = `${percentage.toFixed(1)}% da Meta`;
            
            // Muda cor se completou
            progressFill.style.backgroundColor = percentage >= 100 ? 'var(--success-color)' : 'var(--primary-color)';
        }
    },

    // Helper: Formatação de Moeda Brasileira (R$)
    formatCurrency: function(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
};