const tableSelectors = {
    tbody: '.table.table-hover tbody',
    rows: '.table.table-hover tbody tr',
    sortOptions: '.sort-option',
    dropdownToggle: '.btn-group .dropdown-toggle',
    header: '.d-flex.justify-content-between.align-items-center.mb-4'
};

// Pré-compilação de funções
const textContent = (el, index) => el.cells[index].textContent.trim().toLowerCase();
const hasDataCells = row => row.querySelectorAll('td').length > 0;

// Função de ordenação otimizada
function sortTable(order) {
    const tbody = document.querySelector(tableSelectors.tbody);
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const fragment = document.createDocumentFragment();
    const dataRows = rows.filter(hasDataCells);

    dataRows.sort((a, b) => {
        const aText = textContent(a, 0);
        const bText = textContent(b, 0);
        return order === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    // Usa DocumentFragment para manipulação em memória
    dataRows.forEach(row => fragment.appendChild(row));
    
    // Limpa e re-insere de uma só vez
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// Função de filtro otimizada
function filterTable() {
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (!searchValue) {
        // Mostra todas as linhas se não houver busca
        document.querySelectorAll(tableSelectors.rows).forEach(row => {
            row.style.display = '';
        });
        return;
    }

    const rows = document.querySelectorAll(tableSelectors.rows);
    const searchValueLen = searchValue.length;
    
    rows.forEach(row => {
        if (hasDataCells(row)) {
            const nome = textContent(row, 0);
            const cpfCnpj = textContent(row, 1);
            
            // Verificação otimizada
            const shouldShow = nome.includes(searchValue) || 
                             cpfCnpj.includes(searchValue);
            row.style.display = shouldShow ? '' : 'none';
        }
    });
}

// Debounce para o evento keyup
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Configuração inicial
function initTableFunctions() {
    // Event listeners com delegação de eventos
    document.addEventListener('click', function(e) {
        if (e.target.closest(tableSelectors.sortOptions)) {
            e.preventDefault();
            const option = e.target.closest(tableSelectors.sortOptions);
            const sortOrder = option.getAttribute('data-sort');
            sortTable(sortOrder);

            const dropdownToggle = document.querySelector(tableSelectors.dropdownToggle);
            if (dropdownToggle) {
                const iconClass = option.querySelector('i').className;
                dropdownToggle.innerHTML = `<i class="${iconClass}"></i> ${option.textContent.trim()}`;
            }
        }
        
        if (e.target.closest('#searchButton')) {
            filterTable();
        }
    });

    // Adiciona campo de busca com debounce
    const header = document.querySelector(tableSelectors.header);
    if (header && !document.getElementById('searchInput')) {
        const searchDiv = document.createElement('div');
        searchDiv.className = 'input-group ms-3';
        searchDiv.style.width = '300px';

        const isMotoristasPage = document.querySelector('h2')?.textContent.includes('Motoristas');
        const placeholder = isMotoristasPage ?
            'Buscar Nome ou CPF' : 'Buscar Nome ou CNPJ';

        searchDiv.innerHTML = `
            <input type="text" id="searchInput" class="form-control" placeholder="${placeholder}">
            <button class="btn btn-outline-secondary" type="button" id="searchButton">
                <i class="bi bi-search"></i>
            </button>
        `;
        header.insertBefore(searchDiv, header.querySelector('h2'));

        document.getElementById('searchInput').addEventListener(
            'keyup', 
            debounce(filterTable, 300)
        );
    }

    // Ordenação inicial
    sortTable('asc');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initTableFunctions);