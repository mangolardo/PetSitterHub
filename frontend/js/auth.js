$(document).ready(function () {
    const API_URL = '/api/auth';

    // Controlla la presenza di una sessione attiva all'avvio
    checkAuth();

    // Mostra/Nascondi il campo 'zona' in base al tipo utente scelto
    $('#regRuolo').on('change', function () {
        if ($(this).val() === 'prop') {
            $('#zonaGroup').removeClass('d-none');
            $('#regZona').attr('required', true);
        } else {
            $('#zonaGroup').addClass('d-none');
            $('#regZona').removeAttr('required').val('');
        }
    });

    // --- REGISTRAZIONE ---
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            nome: $('#regNome').val().trim(),
            cognome: $('#regCognome').val().trim(),
            email: $('#regEmail').val().trim(),
            password: $('#regPassword').val()
        };

        // Aggiunge la zona se selezionato 'Proprietario'
        if ($('#regRuolo').val() === 'prop') {
            payload.zona = $('#regZona').val().trim();
        }

        $.ajax({
            url: `${API_URL}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                showAlert(response.message || 'Registrazione completata!', 'success');
                $('#registerForm')[0].reset();
                $('#zonaGroup').addClass('d-none');
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Errore durante la registrazione';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // --- LOGIN ---
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            email: $('#loginEmail').val().trim(),
            password: $('#loginPassword').val()
        };



        $.ajax({
            url: `${API_URL}/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                // Salva sia il token che il ruolo nel localStorage
                localStorage.setItem('token', response.token);
                localStorage.setItem('ruolo', response.ruolo);

                showAlert('Login effettuato con successo! Reindirizzamento...', 'success');

                // Redirect in base al ruolo restituito dal backend
                setTimeout(function () {
                    if (response.ruolo === 'professionista') {
                        window.location.href = 'dashboard.html';
                    } else {
                        // Se è proprietario puoi mandarlo alla home o a un'altra pagina
                        window.location.href = 'index.html';
                    }
                }, 1000);
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Credenziali non valide';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // --- LOGOUT ---
    $(document).on('click', '#btn-logout, #btnLogout', function (e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('ruolo');
            window.location.href = 'login.html';
        });

    // --- VERIFICA AUTENTICAZIONE  ---
    function checkAuth() {
            const token = localStorage.getItem('token');
            const ruolo = localStorage.getItem('ruolo');

            // Se si trova già nella pagina di login ed è già loggato come professionista, lo reindirizza alla dashboard
            const isLoginPage = window.location.pathname.endsWith('login.html');

            if (token && isLoginPage) {
                if (ruolo === 'professionista') {
                    window.location.href = 'dashboard.html';
                }
            }
    }

    // Helper per mostrare messaggi alert Bootstrap
    function showAlert(message, type) {
        const alert = $('#alertMessage');
        alert.removeClass('d-none alert-success alert-danger alert-info')
             .addClass(`alert-${type}`)
             .text(message);

        setTimeout(() => alert.addClass('d-none'), 4000);
    }
});