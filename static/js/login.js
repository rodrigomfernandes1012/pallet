// ==============================================
// VALIDAÇÃO AVANÇADA DE SENHA
// ==============================================
function setupValidations() {
    // Validação de senha
    const password1 = document.getElementById('id_password1');
    const password2 = document.getElementById('id_password2');
    const strengthIndicator = document.getElementById('passwordStrength');

    if (password1 && password2) {
        password1.addEventListener('input', function() {
            validatePassword();
            validatePasswordStrength();
        });

        password2.addEventListener('input', validatePassword);
    }

    // Validação do formulário
    const form = document.getElementById('PessoaJuridicaForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            // Primeiro verifica a validação padrão do formulário
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            // Agora verifica a força da senha
            const password = document.getElementById('id_password1').value;
            const strength = checkPasswordStrength(password);
            
            // Consideramos senha forte apenas quando for class="text-success"
            if (strength.class !== 'text-success') {
                event.preventDefault();
                event.stopPropagation();
                alert('Você deve inserir uma senha forte para prosseguir!\n\nRequisitos:\n- Mínimo 8 caracteres\n- Pelo menos 1 número\n- Pelo menos 1 letra maiúscula\n- Pelo menos 1 letra minúscula\n- Pelo menos 1 caractere especial');
                return;
            }

            // Se chegou aqui, a senha é forte e o formulário é válido
            form.classList.add('was-validated');
        }, false);
    }
}

function validatePassword() {
    const password1 = document.getElementById('id_password1'); //
    const password2 = document.getElementById('id_password2'); //

    if (password1.value !== password2.value && password2.value.length > 0) { //
        password2.setCustomValidity("As senhas não coincidem"); //
        password2.classList.add('is-invalid'); //
    } else {
        password2.setCustomValidity(""); //
        password2.classList.remove('is-invalid'); //
    }
}

function validatePasswordStrength() {
    const password = document.getElementById('id_password1').value; //
    const indicator = document.getElementById('passwordStrength'); //

    if (!password) { //
        indicator.textContent = ''; //
        return;
    }

    const strength = checkPasswordStrength(password); //
    indicator.textContent = strength.message; //
    indicator.className = 'form-text ' + strength.class; //
}

function checkPasswordStrength(password) {
    // Verifica comprimento mínimo
    if (password.length < 8) { //
        return { message: 'Senha fraca (mínimo 8 caracteres)', class: 'text-danger' }; //
    }

    // Verifica complexidade
    const hasNumber = /\d/.test(password); //
    const hasUpper = /[A-Z]/.test(password); //
    const hasLower = /[a-z]/.test(password); //
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password); //

    let score = 0; //
    if (hasNumber) score++; //
    if (hasUpper) score++; //
    if (hasLower) score++; //
    if (hasSpecial) score++; //

    if (score < 2) { //
        return { message: 'Senha fraca (adicione números, maiúsculas ou caracteres especiais)', class: 'text-danger' }; //
    } else if (score < 4) { //
        return { message: 'Senha média (pode ser melhorada)', class: 'text-warning' }; //
    } else {
        return { message: 'Senha forte', class: 'text-success' }; //
    }
}

// ==============================================
// CONFIGURAÇÃO DE EVENTOS
// ==============================================
const API_URLS = {
    VALIDAR_CNPJ: window.URLS?.validarCNPJ || '/api/validarCNPJ/', //
    CONSULTAR_CEP: window.URLS?.consultarCEP || '/api/consultarCEP/', //
    LISTAR_ESTADOS: window.URLS?.listarEstados || '/api/estados/', //
    LISTAR_MUNICIPIOS: (uf) => (window.URLS?.listarMunicipios || '/api/municipios/').replace('UF', uf) //
};

// Módulo de Utilidades
const FormUtils = {
    initTooltips: function () {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]'); //
        tooltips.forEach(el => new bootstrap.Tooltip(el)); //
    },

    setupRequiredFields: function () {
        document.querySelectorAll('[required]').forEach(element => { //
            const label = document.querySelector(`label[for="${element.id}"]`); //
            label?.classList.add('required-field'); //
        });
    },

    initFormValidation: function () {
        document.querySelectorAll('.needs-validation').forEach(form => { //
            form.addEventListener('submit', function (event) { //
                if (!form.checkValidity()) { //
                    event.preventDefault(); //
                    event.stopPropagation(); //
                }
                form.classList.add('was-validated'); //
            });
        });
    }
};

// Módulo de Máscaras
const MaskUtils = {
    applyCnpjMask: function (value) {
        value = value.replace(/\D/g, ''); //
        return value
            .replace(/^(\d{2})/, '$1.') //
            .replace(/^(\d{2})\.(\d{3})/, '$1.$2.') //
            .replace(/\.(\d{3})(\d)/, '.$1/$2') //
            .replace(/(\d{4})(\d)/, '$1-$2') //
            .substring(0, 18); //
    },

    applyCepMask: function (value) {
        value = value.replace(/\D/g, ''); //
        return value.replace(/^(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, ''); //
    },

    applyPhoneMask: function (value) {
        value = value.replace(/\D/g, ''); //
        const isMobile = value.length > 10; //
        return value
            .replace(/^(\d{2})/, '($1) ') //
            .replace(/(\d{4,5})(\d)/, '$1-$2') //
            .substring(0, isMobile ? 15 : 14); //
    },

    initMasks: function () {
        // CNPJ
        const cnpjInput = document.getElementById('id_cnpj'); //
        if (cnpjInput) { //
            cnpjInput.addEventListener('input', (e) => { //
                e.target.value = this.applyCnpjMask(e.target.value); //
            });
        }

        // CEP
        const cepInput = document.getElementById('id_cep'); //
        if (cepInput) { //
            cepInput.addEventListener('input', (e) => { //
                e.target.value = this.applyCepMask(e.target.value); //
            });
        }

        // Telefone
        document.querySelectorAll('input[id^="id_telefone"]').forEach(input => { //
            input.addEventListener('input', (e) => { //
                e.target.value = this.applyPhoneMask(e.target.value); //
            });
        });
    }
};

// Módulo de APIs
const ApiServices = {
    fetchWithTimeout: async function (url, options = {}, timeout = 8000) {
        const controller = new AbortController(); //
        const timeoutId = setTimeout(() => controller.abort(), timeout); //

        try {
            const response = await fetch(url, { //
                ...options, //
                signal: controller.signal //
            });
            clearTimeout(timeoutId); //

            if (!response.ok) { //
                
            }

            return await response.json(); //
        } catch (error) {
            clearTimeout(timeoutId); //
            
        }
    },

    validateCNPJ: async function (cnpj) {
        try {
            const data = await this.fetchWithTimeout( //
                `${API_URLS.VALIDAR_CNPJ}?cnpj=${cnpj.replace(/\D/g, '')}` //
            );

            if (!data.valido) { //
                throw new Error('CNPJ inválido ou não encontrado.'); //
            }

            return data; //
        } catch (error) {
            console.log('error authenticate:'); //
            throw error; //
        }
    },

    searchCEP: async function (cep) {
        try {
            const data = await this.fetchWithTimeout( //
                `${API_URLS.CONSULTAR_CEP}?cep=${cep.replace(/\D/g, '')}` //
            );

            if (data.erro) { //
                throw new Error(data.erro || 'CEP não encontrado ou inválido.'); //
            }

            return data; //
        } catch (error) {
            console.error('CEP search error:', error); //
            throw error; //
        }
    },

    listStates: async function () {
        try {
            const response = await fetch(API_URLS.LISTAR_ESTADOS); //
            const data = await response.json(); //

            if (!response.ok || !data.estados) { //
                throw new Error('Failed to load states'); //
            }

            return data.estados; //
        } catch (error) {
            console.error('States loading error:', error); //
            throw error; //
        }
    },

    listCities: async function (uf) {
        try {
            const response = await fetch(API_URLS.LISTAR_MUNICIPIOS(uf)); //
            const data = await response.json(); //

            if (!response.ok || !data.municipios) { //
                throw new Error('Failed to load cities'); //
            }

            return data.municipios; //
        } catch (error) {
            console.error('Cities loading error:', error); //
            throw error; //
        }
    }
};

// Módulo de UI
const UIManager = {
    showLoading: function (element, message) {
        element.textContent = message; //
        element.className = 'form-text text-muted d-block'; //
    },

    showSuccess: function (element, message) {
        element.textContent = message; //
        element.className = 'valid-feedback d-block'; //
    },

    showError: function (element, message) {
        element.textContent = message; //
        element.className = 'invalid-feedback d-block'; //
    },

    resetFeedback: function (element) {
        element.textContent = ''; //
        element.className = 'form-text'; //
    }
};

// Módulo Principal - ÚNICO BLOCO DE INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function () {
    // Inicializa utilitários
    FormUtils.initTooltips(); //
    FormUtils.setupRequiredFields(); //
    FormUtils.initFormValidation(); //
    
    // Inicializa máscaras (substitui a antiga função setupMasks)
    MaskUtils.initMasks(); //

    // Inicializa validações (senha, etc)
    setupValidations(); //

    // Configura eventos
    setupLoginForm(); //
    setupCNPJValidation(); //
    setupCEPSearch(); //
    setupLocationSelects(); //
    setupPasswordToggle(); //
});

function setupLoginForm() {
    const formContainer = document.getElementById('formContainer'); //
    const showLoginFormBtn = document.getElementById('showLoginFormBtn'); //

    if (showLoginFormBtn) { //
        showLoginFormBtn.addEventListener('click', () => { //
            formContainer.classList.add('show-login'); //
        });
    }
}

function setupCNPJValidation() {
    const cnpjInput = document.getElementById('id_cnpj'); //
    const validateBtn = document.getElementById('validar-cnpj-btn'); //
    const feedbackDiv = document.getElementById('cnpjFeedback'); //

    if (!cnpjInput || !validateBtn || !feedbackDiv) return; //

    validateBtn.addEventListener('click', async () => { //
        const cnpj = cnpjInput.value; //
        UIManager.resetFeedback(feedbackDiv); //
        cnpjInput.classList.remove('is-invalid', 'is-valid'); //

        // Validação básica
        if (cnpj.replace(/\D/g, '').length !== 14) { //
            UIManager.showError(feedbackDiv, 'CNPJ deve ter 14 dígitos.'); //
            cnpjInput.classList.add('is-invalid'); //
            return;
        }

        UIManager.showLoading(feedbackDiv, 'Validando CNPJ...'); //

        try {
            const data = await ApiServices.validateCNPJ(cnpj); //

            UIManager.showSuccess(feedbackDiv, 'CNPJ válido.'); //
            cnpjInput.classList.add('is-valid'); //

            // Preenche todos os campos com dados da API
            fillCompanyData(data); //
            await fillAddress(data); //

        } catch (error) {
            console.log('CNPJ validation error:', ); //
            UIManager.showError(feedbackDiv, 'CNPJ indisponível'); //
            cnpjInput.classList.add('is-invalid'); //
        }
    });
}

function fillCompanyData(data) {
    // Mapeamento completo dos campos com os prefixos
    const fields = { //
        // Dados básicos
        'id_razao_social': data.DsRazaoSocial || '', //
        'id_nome_fantasia': data.DsNomeFantasia || '', //
        'id_email': data.DsEmail || '', //
        'id_site': data.DsSite || '', //

        // Documentos
        'id_inscricao_estadual': data.DsInscricaoEstadual || '', //
        'id_inscricao_municipal': data.DsInscricaoMunicipal || '', //
        'id_iest': data.DsIEST || '', //

        // Situação cadastral
        'id_situacao_cadastral': data.DsSituacaoCadastral || 'Ativo', //

        // Endereço
        'id_cep': data.NrEnderecoCep ? data.NrEnderecoCep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : '', //
        'id_logradouro': data.DsEnderecoLogradouro || '', //
        'id_numero': data.NrEnderecoNumero || '', //
        'id_bairro': data.DsEnderecoBairro || '', //
        'id_complemento': data.DsEnderecoComplemento || '', //
    };

    // Preenche todos os campos
    Object.entries(fields).forEach(([id, value]) => { //
        const element = document.getElementById(id); //
        if (element) { //
            // Para selects, verifica se a opção existe
            if (element.tagName === 'SELECT') { //
                const optionExists = Array.from(element.options).some(opt => opt.value === value); //
                if (optionExists) { //
                    element.value = value; //
                    element.classList.add('is-valid'); //
                }
            }
            // Para inputs normais
            else {
                element.value = value; //
                if (value && value.trim() !== '') { //
                    element.classList.add('is-valid'); //
                }
            }
        }
    });
}

async function fillAddress(addressData) {
    const elements = { //
        'id_logradouro': addressData.DsEnderecoLogradouro, //
        'id_numero': addressData.NrEnderecoNumero, //
        'id_bairro': addressData.DsEnderecoBairro, //
        'id_complemento': addressData.DsEnderecoComplemento //
    };

    Object.entries(elements).forEach(([id, value]) => { //
        const element = document.getElementById(id); //
        if (element && value) { //
            element.value = value; //
            if (value) element.classList.add('is-valid'); //
        }
    });

    // Preenche estado e cidade
    await fillCityState(addressData.estado, addressData.cidade); //

    // Foca no campo de número
    document.getElementById('id_numero')?.focus(); //
}

async function fillCityState(uf, cityName) {
    const estadoSelect = document.getElementById('id_estado'); //
    const cidadeSelect = document.getElementById('id_cidade'); //

    if (!estadoSelect || !cidadeSelect || !uf) return; //

    estadoSelect.value = uf; //
    estadoSelect.dispatchEvent(new Event('change')); //

    // Espera as cidades carregarem
    let attempts = 0; //
    const maxAttempts = 10; //
    const checkInterval = 100; // ms

    return new Promise((resolve) => { //
        const checkCitySelect = setInterval(() => { //
            attempts++; //

            if (cidadeSelect.options.length > 1 && !cidadeSelect.disabled) { //
                clearInterval(checkCitySelect); //

                // Tenta encontrar a cidade
                const cityOption = Array.from(cidadeSelect.options) //
                    .find(opt => opt.text.trim().toUpperCase() === (cityName || '').trim().toUpperCase()); //

                if (cityOption) { //
                    cidadeSelect.value = cityOption.value; //
                    cidadeSelect.classList.add('is-valid'); //
                }

                resolve(); //
            } else if (attempts >= maxAttempts) { //
                clearInterval(checkCitySelect); //
                resolve(); //
            }
        }, checkInterval);
    });
}

function setupCEPSearch() {
    const cepInput = document.getElementById('id_cep'); //
    const searchBtn = document.getElementById('buscar-cep-btn'); //
    const feedbackDiv = document.getElementById('cepFeedback'); //

    if (!cepInput || !searchBtn || !feedbackDiv) return; //

    searchBtn.addEventListener('click', async () => { //
        const cep = cepInput.value; //
        UIManager.resetFeedback(feedbackDiv); //
        cepInput.classList.remove('is-invalid', 'is-valid'); //

        // Validação básica
        if (cep.replace(/\D/g, '').length !== 8) { //
            return;
        }

        UIManager.showLoading(feedbackDiv, 'Buscando CEP...'); //

        try {
            const data = await ApiServices.searchCEP(cep); //

            UIManager.showSuccess(feedbackDiv, 'CEP encontrado.'); //
            cepInput.classList.add('is-valid'); //

            await fillAddress(data); //

        } catch (error) {
            console.error('CEP search error:', error); //
            UIManager.showError(feedbackDiv, 'CNPJ Indisponivel'); //
            cepInput.classList.add('is-invalid'); //
        }
    });
}

function setupLocationSelects() {
    const estadoSelect = document.getElementById('id_estado'); //

    if (!estadoSelect) return; //

    // Carrega estados
    loadStates(); //

    // Configura evento para carregar cidades
    estadoSelect.addEventListener('change', function () { //
        if (this.value) { //
            loadCities(this.value); //
        } else {
            const cidadeSelect = document.getElementById('id_cidade'); //
            cidadeSelect.innerHTML = '<option value="">Selecione o estado primeiro</option>'; //
            cidadeSelect.disabled = true; //
        }
    });
}

async function loadStates() {
    const estadoSelect = document.getElementById('id_estado'); //
    if (!estadoSelect) return; //

    try {
        const states = await ApiServices.listStates(); //

        estadoSelect.innerHTML = '<option value="" selected disabled>Selecione...</option>'; //
        states.forEach(state => { //
            estadoSelect.add(new Option(state.nome, state.sigla)); //
        });
    } catch (error) {
        estadoSelect.innerHTML = '<option value="">Erro ao carregar estados</option>'; //
    }
}

async function loadCities(uf) {
    const cidadeSelect = document.getElementById('id_cidade'); //
    if (!cidadeSelect || !uf) return; //

    cidadeSelect.disabled = true; //
    cidadeSelect.innerHTML = '<option value="">Carregando cidades...</option>'; //

    try {
        const cities = await ApiServices.listCities(uf); //

        cidadeSelect.innerHTML = '<option value="" selected disabled>Selecione...</option>'; //
        cities.forEach(city => { //
            cidadeSelect.add(new Option(city.nome, city.nome)); //
        });
        cidadeSelect.disabled = false; //
    } catch (error) {
        cidadeSelect.innerHTML = '<option value="">Erro ao carregar cidades</option>'; //
        cidadeSelect.disabled = false; //
    }
}

function setupPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(button => { //
        button.addEventListener('click', function () { //
            const inputId = this.getAttribute('data-target'); //
            const input = document.getElementById(inputId); //
            const icon = this.querySelector('i'); //

            if (input.type === "password") { //
                input.type = "text"; //
                icon.classList.replace('bi-eye', 'bi-eye-slash'); //
            } else {
                input.type = "password"; //
                icon.classList.replace('bi-eye-slash', 'bi-eye'); //
            }
        });
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId); //
    const icon = input.nextElementSibling.querySelector('i'); //
    if (input.type === "password") { //
        input.type = "text"; //
        icon.classList.remove('bi-eye'); //
        icon.classList.add('bi-eye-slash'); //
    } else {
        input.type = "password"; //
        icon.classList.remove('bi-eye-slash'); //
        icon.classList.add('bi-eye'); //
    }
}