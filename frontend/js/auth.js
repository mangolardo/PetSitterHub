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

    // --- CAMBIO PASSWORD ---
    $('#update-password-form').on('submit', function (e) {
        e.preventDefault();

        const vecchiaPassword = $('#old-password').val();
        const nuovaPassword = $('#new-password').val();
        const $status = $('#password-status');
        const $button = $(this).find('button[type="submit"]');

        // Pulizia messaggio precedente
        $status.removeClass('text-success text-danger').text('');

        // Controllo campi vuoti
        if (!vecchiaPassword || !nuovaPassword) {
            $status
                .addClass('text-danger')
                .text('Compila tutti i campi.');
            return;
        }

        // Controllo requisiti nuova password
        if (!passwordRegex.test(nuovaPassword)) {
            $status
                .addClass('text-danger')
                .text('La nuova password deve contenere almeno una maiuscola, un numero e un carattere speciale.');

            $('#new-password').addClass('is-invalid').focus();
            return;
        }

        // Controlla che la nuova password sia diversa dalla vecchia
        if (vecchiaPassword === nuovaPassword) {
            $status
                .addClass('text-danger')
                .text('La nuova password deve essere diversa da quella attuale.');
            return;
        }

        const payload = {
            vecchia_password: vecchiaPassword,
            nuova_password: nuovaPassword
        };

        // Disabilita il pulsante durante la richiesta
        $button.prop('disabled', true);

        $.ajax({
            url: `${API_URL}/me/password`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),

            success: function (response) {
                $status
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(response.message || 'Password aggiornata con successo!');

                // Svuota i campi
                $('#old-password').val('');
                $('#new-password').val('');

                // Rimuove eventuali errori grafici
                $('#old-password, #new-password').removeClass('is-invalid');
            },

            error: function (xhr) {
                console.error('Errore cambio password:', xhr);

                const errorMsg =
                    xhr.responseJSON?.error ||
                    'Errore durante l\'aggiornamento della password.';

                $status
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(errorMsg);
            },

            complete: function () {
                // Riabilita il pulsante
                $button.prop('disabled', false);
            }
        });
    });

    // Helper per messaggi alert
    function showAlert(message, type) {
        const alert = $('#alertMessage');
        alert.removeClass('d-none alert-success alert-danger alert-info')
             .addClass(`alert-${type}`)
             .html(message);

        setTimeout(() => alert.addClass('d-none'), 4000);
    }
});