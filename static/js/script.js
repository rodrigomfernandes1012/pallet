document.addEventListener('DOMContentLoaded', function () {
    // Definir data atual como padrão
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data_validade').value = today;

    // Botão Cancelar - Limpa a URL
    document.getElementById('btnCancelar').addEventListener('click', function () {
        window.location.href = "{% url 'movimentacoes' %}";
    });

    // Envio do formulário via AJAX para exibir o QR Code
    document.getElementById('valeForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.qr_code_url) {
                    // Exibe o QR Code no modal
                    const qrContainer = document.getElementById('qrCodeContainer');
                    qrContainer.innerHTML = `<img src="${data.qr_code_url}" alt="QR Code" class="img-fluid">`;

                    // Mostra o modal
                    const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
                    modal.show();

                    // Redireciona para movimentações após fechar o modal (opcional)
                    document.querySelector('#qrCodeModal .btn-primary').addEventListener('click', function () {
                        window.location.href = "{% url 'movimentacoes' %}";
                    });
                }
            })
            .catch(error => console.error('Error:', error));
    });
});




