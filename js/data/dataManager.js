const DataManager = {
    // Gera o arquivo JSON e força o download
    downloadBackup: function() {
        // Coleta todos os dados do localStorage
        const data = {
            transactions: Storage.getTransactions(),
            recurringRules: Storage.getRecurringRules(),
            meta: {
                exportedAt: new Date().toISOString(),
                appVersion: "1.0",
                user: "Gustavo Araujo"
            }
        };

        // Converte para string JSON formatada
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Cria elemento de link temporário no DOM
        const link = document.createElement('a');
        link.href = url;
        link.download = `financeiro_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        document.body.appendChild(link);
        link.click();
        
        // Limpeza de memória e DOM
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Lê o arquivo enviado e restaura os dados
    uploadBackup: function(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const parsedData = JSON.parse(content);

                // Validação de Segurança: Verifica se o arquivo tem a estrutura correta
                if (!parsedData.transactions || !Array.isArray(parsedData.transactions)) {
                    throw new Error("O arquivo selecionado não é um backup válido deste sistema.");
                }

                // Confirmação crítica antes de sobrescrever
                const confirmMsg = `Backup encontrado de: ${new Date(parsedData.meta?.exportedAt || Date.now()).toLocaleDateString()}\n\nATENÇÃO: Isso irá APAGAR seus dados atuais e substituir pelo backup.\nDeseja continuar?`;
                
                if (confirm(confirmMsg)) {
                    // 1. Limpa e Atualiza Transactions
                    localStorage.setItem(Storage.KEYS.TRANSACTIONS, JSON.stringify(parsedData.transactions));
                    
                    // 2. Limpa e Atualiza Regras (se houver)
                    if (parsedData.recurringRules) {
                        localStorage.setItem(Storage.KEYS.RULES, JSON.stringify(parsedData.recurringRules));
                    }

                    alert("Sucesso! Seus dados foram restaurados.");
                    
                    // 3. Recarrega a aplicação visualmente
                    App.loadData(); 
                }
            } catch (error) {
                console.error(error);
                alert("Erro ao restaurar: " + error.message);
            }
            
            // Limpa o input para permitir re-upload do mesmo arquivo se necessário
            inputElement.value = '';
        };

        reader.readAsText(file);
    }
};