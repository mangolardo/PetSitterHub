//il token verrà allegato in automatico
$.ajaxSetup({
    beforeSend: function(xhr) {
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    }
});

$(document).ready(function () {
    const API_URL = '/api/auth';
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;

    checkAuth();

    // Gestione campo Zona dinamico in registrazione
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

        const password = $('#regPassword').val();

        if (!passwordRegex.test(password)) {
            showAlert('La password deve contenere almeno una maiuscola, un numero e un carattere speciale.', 'danger');
            $('#regPassword').addClass('is-invalid').focus();
            return;
        }

        const payload = {
            nome: $('#regNome').val().trim(),
            cognome: $('#regCognome').val().trim(),
            email: $('#regEmail').val().trim(),
            password: password
        };

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

        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val();

        // Validazione Lato Client prima della chiamata AJAX
        if (!passwordRegex.test(password)) {
            showAlert('La password deve contenere almeno una maiuscola, un numero e un carattere speciale.', 'danger');
            $('#loginPassword').addClass('is-invalid').focus();
            return;
        }

        $('#loginPassword').removeClass('is-invalid');

        const payload = { email, password };

        $.ajax({
            url: `${API_URL}/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('ruolo', response.ruolo);

                showAlert('Login effettuato con successo! Reindirizzamento...', 'success');

                setTimeout(function () {
                    if (response.ruolo === 'professionista') {
                        window.location.href = 'dashboard.html';
                    } else {
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

    // Rimuove lo stato di errore quando si digita
    $(document).on('input', '#loginPassword, #regPassword', function () {
        $(this).removeClass('is-invalid');
    });

    // --- LOGOUT ---
    $(document).on('click', '#btn-logout, #btnLogout', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('ruolo');
        window.location.href = 'login.html';
    });

    // --- VERIFICA AUTENTICAZIONE ---
    function checkAuth() {
        const token = localStorage.getItem('token');
        const ruolo = localStorage.getItem('ruolo');
        const isLoginPage = window.location.pathname.endsWith('login.html');

        if (token && isLoginPage) {
            if (ruolo === 'professionista') {
                window.location.href = 'dashboard.html';
            }
        }
    }

    // Helper per messaggi alert
    function showAlert(message, type) {
        const alert = $('#alertMessage');
        alert.removeClass('d-none alert-success alert-danger alert-info')
             .addClass(`alert-${type}`)
             .html(message);

        setTimeout(() => alert.addClass('d-none'), 4000);
    }
});