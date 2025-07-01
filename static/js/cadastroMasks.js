document.addEventListener('DOMContentLoaded', function() {
    // Função para aplicar máscara de telefone
    function aplicarMascaraTelefone(input) {
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    value = '(' + value;
                }
                if (value.length > 3) {
                    value = value.substring(0, 3) + ') ' + value.substring(3);
                }
                if (value.length > 10) {
                    value = value.substring(0, 10) + '-' + value.substring(10, 15);
                }
                e.target.value = value;
            });
        }
    }

    // Função para aplicar máscara de CPF
    function aplicarMascaraCPF(input) {
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 3) {
                    value = value.substring(0, 3) + '.' + value.substring(3);
                }
                if (value.length > 7) {
                    value = value.substring(0, 7) + '.' + value.substring(7);
                }
                if (value.length > 11) {
                    value = value.substring(0, 11) + '-' + value.substring(11, 14);
                }
                e.target.value = value.substring(0, 14); // Limita ao tamanho máximo do CPF
            });
        }
    }

    // Função para aplicar máscara de CNPJ
    function aplicarMascaraCNPJ(input) {
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 2) {
                    value = value.substring(0, 2) + '.' + value.substring(2);
                }
                if (value.length > 6) {
                    value = value.substring(0, 6) + '.' + value.substring(6);
                }
                if (value.length > 10) {
                    value = value.substring(0, 10) + '/' + value.substring(10);
                }
                if (value.length > 15) {
                    value = value.substring(0, 15) + '-' + value.substring(15, 17);
                }
                e.target.value = value.substring(0, 18); // Limita ao tamanho máximo do CNPJ
            });
        }
    }

    // Verificar qual formulário está presente e configurar adequadamente
    const clienteForm = document.getElementById('clienteForm');
    const transportadoraForm = document.getElementById('TransportadoraForm');
    const motoristaForm = document.getElementById('MotoristaForm');
    const form = clienteForm || transportadoraForm || motoristaForm;

    if (form) {
        // Aplicar máscaras conforme o formulário
        const telefoneInput = document.getElementById('id_telefone');
        aplicarMascaraTelefone(telefoneInput);

        if (motoristaForm) {
            // Formulário de Motorista (CPF)
            const cpfInput = document.getElementById('id_cpf');
            aplicarMascaraCPF(cpfInput);
        } else if (clienteForm) {
            // Formulário de Cliente (CPF ou CNPJ)
            const cpfInput = document.getElementById('id_cpf') || document.getElementById('id_cnpj');
            if (cpfInput && cpfInput.id === 'id_cpf') {
                aplicarMascaraCPF(cpfInput);
            } else if (cpfInput) {
                aplicarMascaraCNPJ(cpfInput);
            }
        } else if (transportadoraForm) {
            // Formulário de Transportadora (CNPJ)
            const cnpjInput = document.getElementById('id_cnpj');
            aplicarMascaraCNPJ(cnpjInput);
        }

        // Validação de campos obrigatórios
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    
                    // Criar mensagem de erro se não existir
                    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'invalid-feedback';
                        errorDiv.textContent = 'Este campo é obrigatório.';
                        field.parentNode.insertBefore(errorDiv, field.nextSibling);
                    }
                } else {
                    field.classList.remove('is-invalid');
                }
            });

            // Validação adicional para telefone (formato)
            if (telefoneInput && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(telefoneInput.value)) {
                isValid = false;
                telefoneInput.classList.add('is-invalid');
                if (!telefoneInput.nextElementSibling || !telefoneInput.nextElementSibling.classList.contains('invalid-feedback')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'invalid-feedback';
                    errorDiv.textContent = 'Formato inválido. Use (00) 00000-0000';
                    telefoneInput.parentNode.insertBefore(errorDiv, telefoneInput.nextSibling);
                }
            }

            // Validação adicional para CPF (formato)
            if (motoristaForm) {
                const cpfInput = document.getElementById('id_cpf');
                if (cpfInput && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpfInput.value)) {
                    isValid = false;
                    cpfInput.classList.add('is-invalid');
                    if (!cpfInput.nextElementSibling || !cpfInput.nextElementSibling.classList.contains('invalid-feedback')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'invalid-feedback';
                        errorDiv.textContent = 'Formato inválido. Use 000.000.000-00';
                        cpfInput.parentNode.insertBefore(errorDiv, cpfInput.nextSibling);
                    }
                }
            }

            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Remover mensagem de erro quando o usuário começa a digitar
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            input.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.classList.remove('is-invalid');
                }
            });
        });
    }

    // Botão Cancelar - Voltar para a página anterior
    const cancelButton = document.querySelector('.btn-secondary');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            window.history.back();
        });
    }
});