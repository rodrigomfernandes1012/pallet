// Cache de elementos DOM
const domCache = {
    // Elementos principais
    clientesChart: document.getElementById('clientesChart'),
    valesModal: document.getElementById('valesModal'),
    valesTableBody: document.getElementById('valesTableBody'),
    fornecedoresTableBody: document.getElementById('fornecedoresTableBody'),
    currentYear: document.getElementById('current-year'),
    
    // Elementos de filtro
    filtrosBotoes: document.querySelectorAll('#filtros-botoes button'),
    filtrosData: document.querySelectorAll('#filtros-data button'),
    
    // Elementos de ordenação (excluindo os do modal)
    sortableHeaders: document.querySelectorAll('.sortable-header:not(#valesModal .sortable-header)'),
    
    // Elementos de valores
    valueDisplays: document.querySelectorAll('.value-display'),
    
    // Elementos de status
    statusCards: document.querySelectorAll('.status-card')
};

// Variáveis de estado
const appState = {
    chartInstance: null,
    ordenacaoAtual: 'responsavel',
    ordemCrescente: true,
    ultimoFiltro: 'todos',
    ultimoFiltroData: 'todos',
    fetchController: null,
    isFetching: false
};

// Inicialização do gráfico
function initChart() {
    if (!domCache.clientesChart) return;

    if (appState.chartInstance) {
        appState.chartInstance.destroy();
    }

    try {
        // Usa os dados da janela se disponíveis, caso contrário tenta do template Django
        const chartData = window.graficoData || {
            labels: JSON.parse('{{ grafico_labels|escapejs }}'),
            data: JSON.parse('{{ grafico_data|escapejs }}'),
            cores: JSON.parse('{{ grafico_cores|escapejs }}')
        };

        appState.chartInstance = new Chart(domCache.clientesChart, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Pallets por Fornecedor',
                    data: chartData.data,
                    backgroundColor: chartData.cores,
                    borderColor: chartData.cores.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' pallets';
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Erro ao carregar gráfico:', e);
    }
}

// Configuração dos filtros e modal
function setupFiltros() {
    // Configura botões de filtro do dashboard
    domCache.filtrosBotoes.forEach(botao => {
        botao.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Cancela qualquer requisição em andamento
            if (appState.isFetching && appState.fetchController) {
                appState.fetchController.abort();
            }
            
            document.querySelectorAll('#filtros-botoes button').forEach(btn => 
                btn.classList.remove('active'));
            this.classList.add('active');

            const tipoFiltro = this.dataset.filtro;
            appState.ultimoFiltro = tipoFiltro;
            
            if (tipoFiltro !== 'todos') {
                carregarValesModal(tipoFiltro, appState.ordenacaoAtual);
            }
        });
    });

    // Configura cards de status clicáveis
    domCache.statusCards.forEach(card => {
        card.addEventListener('click', function() {
            const tipo = this.querySelector('.card-title').textContent.trim().toLowerCase();
            const filtroMap = {
                'a vencer': 'a_vencer',
                'coletado': 'coletado',
                'pendente': 'pendente',
                'vencido': 'vencidos'
            };

            const tipoFiltro = filtroMap[tipo];
            if (tipoFiltro) {
                // Ativa o botão correspondente
                document.querySelectorAll('#filtros-botoes button').forEach(btn =>
                    btn.classList.remove('active'));
                const botaoCorrespondente = document.querySelector(`#filtros-botoes button[data-filtro="${tipoFiltro}"]`);
                if (botaoCorrespondente) {
                    botaoCorrespondente.classList.add('active');
                    appState.ultimoFiltro = tipoFiltro;
                }

                carregarValesModal(tipoFiltro, appState.ordenacaoAtual);
            }
        });
    });
}

// Configuração dos filtros de data
function setupFiltrosData() {
    const filtrosData = document.querySelectorAll('#filtros-data button');
    if (!filtrosData) return;

    filtrosData.forEach(botao => {
        botao.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Cancela qualquer requisição em andamento
            if (appState.isFetching && appState.fetchController) {
                appState.fetchController.abort();
            }
            
            document.querySelectorAll('#filtros-data button').forEach(btn =>
                btn.classList.remove('active'));
            this.classList.add('active');

            const tipoFiltroData = this.dataset.filtroData;
            appState.ultimoFiltroData = tipoFiltroData;
            
            // Adiciona console.log para debug
            console.log('Filtro selecionado:', tipoFiltroData);
            
            atualizarDashboard(tipoFiltroData);
        });
    });
}

// Configura ordenação pelos cabeçalhos (exceto modal)
function setupOrdenacao() {
    domCache.sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const novaOrdenacao = this.dataset.sort;

            if (appState.ordenacaoAtual === novaOrdenacao) {
                appState.ordemCrescente = !appState.ordemCrescente;
            } else {
                appState.ordenacaoAtual = novaOrdenacao;
                appState.ordemCrescente = true;
            }

            // Atualiza indicadores visuais
            domCache.sortableHeaders.forEach(h => {
                h.classList.remove('sorted-asc', 'sorted-desc');
            });

            // Adiciona classe de ordenação
            this.classList.add(appState.ordemCrescente ? 'sorted-asc' : 'sorted-desc');

            // Ordena localmente a tabela de fornecedores
            ordenarTabelaFornecedores(appState.ordenacaoAtual, appState.ordemCrescente);
        });
    });
}

// Função para ordenar a tabela de fornecedores localmente
function ordenarTabelaFornecedores(coluna, crescente) {
    const tbody = domCache.fornecedoresTableBody;
    if (!tbody) return;

    const linhas = Array.from(tbody.querySelectorAll('tr'));
    
    linhas.sort((a, b) => {
        const valorA = a.cells[coluna === 'responsavel' ? 0 : coluna === 'vale' ? 1 : 2].textContent.trim();
        const valorB = b.cells[coluna === 'responsavel' ? 0 : coluna === 'vale' ? 1 : 2].textContent.trim();
        
        if (coluna === 'vale' || coluna === 'pallets') {
            // Ordenação numérica
            const numA = parseInt(valorA) || 0;
            const numB = parseInt(valorB) || 0;
            return crescente ? numA - numB : numB - numA;
        } else {
            // Ordenação alfabética
            return crescente ? 
                valorA.localeCompare(valorB, 'pt', { sensitivity: 'base' }) : 
                valorB.localeCompare(valorA, 'pt', { sensitivity: 'base' });
        }
    });

    // Remove todas as linhas
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    // Adiciona as linhas ordenadas
    linhas.forEach(linha => tbody.appendChild(linha));
}

// Função para atualizar o dashboard com base no filtro de data
async function atualizarDashboard(filtroData) {
    // Mostrar loading em todos os cards
    domCache.valueDisplays.forEach(display => {
        const originalValue = display.textContent;
        display.dataset.originalValue = originalValue;
        display.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    });

    // Configuração do timeout e abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    appState.fetchController = controller;
    appState.isFetching = true;

    try {
        const response = await fetch(`/dashboard/filtrar/?periodo=${filtroData}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        
        const data = await response.json();
        
        // Atualizar os cards de status
        if (data.a_vencer !== undefined) document.getElementById('a_vencer').textContent = data.a_vencer;
        if (data.coletado !== undefined) document.getElementById('coletado').textContent = data.coletado;
        if (data.pendente !== undefined) document.getElementById('pendente').textContent = data.pendente;
        if (data.vencido !== undefined) document.getElementById('vencido').textContent = data.vencido;

        // Atualizar os cards de pallets
        if (data.pallets_movimentacao !== undefined) document.getElementById('pallets_movimentacao').textContent = data.pallets_movimentacao;
        if (data.pallets_prazo !== undefined) document.getElementById('pallets_prazo').textContent = data.pallets_prazo;
        if (data.pallets_vencidos !== undefined) document.getElementById('pallets_vencidos').textContent = data.pallets_vencidos;
        if (data.total_pallets !== undefined) document.getElementById('total_pallets').textContent = data.total_pallets;

        // Atualizar os cards de dias em aberto
        if (data.menos_30_dias !== undefined) document.getElementById('menos_30_dias').textContent = data.menos_30_dias;
        if (data.mais_30_dias !== undefined) document.getElementById('mais_30_dias').textContent = data.mais_30_dias;
        if (data.mais_90_dias !== undefined) document.getElementById('mais_90_dias').textContent = data.mais_90_dias;
        if (data.mais_180_dias !== undefined) document.getElementById('mais_180_dias').textContent = data.mais_180_dias;

        // Atualizar o gráfico se existirem novos dados
        if (data.grafico_labels && data.grafico_data && data.grafico_cores && appState.chartInstance) {
            appState.chartInstance.data.labels = data.grafico_labels;
            appState.chartInstance.data.datasets[0].data = data.grafico_data;
            appState.chartInstance.data.datasets[0].backgroundColor = data.grafico_cores;
            appState.chartInstance.data.datasets[0].borderColor = data.grafico_cores.map(c => c.replace('0.7', '1'));
            appState.chartInstance.update();
        }

        // Atualizar a tabela de fornecedores
        if (data.fornecedores_data && data.total_fornecedores) {
            const tbody = domCache.fornecedoresTableBody;
            const totalVales = document.getElementById('total_fornecedores_vales');
            const totalPallets = document.getElementById('total_fornecedores_pallets');

            if (tbody) {
                tbody.innerHTML = data.fornecedores_data.map(fornecedor => `
                    <tr>
                        <td class="text-start">${fornecedor.responsavel__username || '-'}</td>
                        <td class="text-center">${fornecedor.vale || '0'}</td>
                        <td class="text-center">${fornecedor.pallets || '0'}</td>
                    </tr>
                `).join('');

                if (data.fornecedores_data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum dado disponível</td></tr>';
                }
            }

            if (totalVales) {
                totalVales.textContent = data.total_fornecedores.vales || '0';
            }

            if (totalPallets) {
                totalPallets.textContent = data.total_fornecedores.pallets || '0';
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        // Restaurar valores originais em caso de erro
        domCache.valueDisplays.forEach(display => {
            if (display.dataset.originalValue) {
                display.textContent = display.dataset.originalValue;
            }
        });
    } finally {
        appState.isFetching = false;
        appState.fetchController = null;
    }
}

// Função para carregar os vales no modal
async function carregarValesModal(tipo, ordenacao = 'responsavel') {
    const modalTitle = document.getElementById('valesModalLabel');
    const tableBody = domCache.valesTableBody;

    const titulos = {
        'a_vencer': 'Vales a Vencer (próximos 30 dias)',
        'no_prazo': 'Vales no Prazo',
        'vencidos': 'Vales Vencidos',
        'movimentacao': 'Vales em Movimentação',
        'coletado': 'Vales Coletados/Devolvidos',
        'pendente': 'Vales Pendentes'
    };

    modalTitle.textContent = titulos[tipo] || 'Lista de Vales';

    tableBody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';

    // Configuração do timeout e abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    appState.fetchController = controller;
    appState.isFetching = true;

    try {
        const response = await fetch(`/movimentacoes/filtrar/?tipo=${tipo}&ordenacao=${ordenacao}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        
        const data = await response.json();
        
        tableBody.innerHTML = '';

        if (data.vales.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum vale encontrado</td></tr>';
            return;
        }

        data.vales.forEach(vale => {
            const row = document.createElement('tr');

            let statusClass = '';
            let statusText = vale.estado;

            switch (vale.estado) {
                case 'EMITIDO':
                    statusClass = 'bg-secondary';
                    break;
                case 'SAIDA':
                    statusClass = 'bg-warning text-dark';
                    break;
                case 'RETORNO':
                    statusClass = 'bg-success';
                    break;
                case 'VENCIDO':
                    statusClass = 'bg-danger';
                    break;
                default:
                    statusClass = 'bg-primary';
            }

            // Adiciona informação de dias restantes
            let diasInfo = '';
            if (vale.dias_restantes !== null && vale.dias_restantes !== undefined) {
                if (vale.dias_restantes < 0) {
                    diasInfo = `<span class="badge bg-danger ms-2">Vencido há ${Math.abs(vale.dias_restantes)} dias</span>`;
                } else {
                    diasInfo = `<span class="badge bg-info ms-2">${vale.dias_restantes} dias restantes</span>`;
                }
            }

            row.innerHTML = `
                <td>${vale.numero_vale || '-'}</td>
                <td>${vale.cliente || '-'}</td>
                <td>${vale.transportadora || '-'}</td>
                <td>${vale.motorista || '-'}</td>
                <td>${vale.data_emissao || '-'}</td>
                <td>${vale.data_validade || '-'} ${diasInfo}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${vale.responsavel || 'Sistema'}</td>
            `;
            tableBody.appendChild(row);
        });

        const modal = new bootstrap.Modal(domCache.valesModal);
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar vales:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar dados. Tente novamente.</td></tr>';
    } finally {
        appState.isFetching = false;
        appState.fetchController = null;
    }
}

// Atualizar ano no footer
function updateYear() {
    if (domCache.currentYear) {
        domCache.currentYear.textContent = new Date().getFullYear();
    }
}

// Configura tooltips do Bootstrap
function setupTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Inicialização
function initDashboard() {
    initChart();
    setupFiltros();
    setupFiltrosData();
    setupOrdenacao();
    updateYear();
    setupTooltips();
}

// Inicia a aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Passa os dados do gráfico do Django para o JavaScript
window.graficoData = {
    labels: JSON.parse('{{ grafico_labels|escapejs }}'),
    data: JSON.parse('{{ grafico_data|escapejs }}'),
    cores: JSON.parse('{{ grafico_cores|escapejs }}')
};