const API_BASE_URL = require('./config.js')
// Il token verrà allegato in automatico a tutte le chiamate AJAX
$.ajaxSetup({
    beforeSend: function(xhr) {
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    }
});

$(document).ready(function () {
    const API_URL = `${API_BASE_URL}/auth`;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;

    checkAuth();
    loadUserProfile();

    // --- CARICAMENTO DATI UTENTE (Sia Riepilogo che Form Modifica) ---
    function loadUserProfile() {
        if (!$('#tab-riepilogo').length && !$('#profile-form').length) return;

        $.ajax({
            url: `${API_URL}/me`,
            method: 'GET',
            dataType: 'json',
            success: function (user) {
                const ruolo = localStorage.getItem('ruolo');

                // 1. Popolamento Card Riepilogo (Sola lettura)
                $('#summary-nome').text(user.nome || '—');
                $('#summary-cognome').text(user.cognome || '—');
                $('#summary-email').text(user.email || '—');

                if (ruolo === 'professionista') {
                    $('#summary-zona-box').hide();
                    $('#profile-zona-container').hide();
                } else {
                    $('#summary-zona').text(user.zona || 'Non specificata');
                    $('#profile-zona-input').val(user.zona || '');
                }

                // 2. Popolamento Form Modifica Profilo
                $('#profile-nome-input').val(user.nome || '');
                $('#profile-cognome-input').val(user.cognome || '');
                $('#profile-email-input').val(user.email || '');
            },
            error: function (xhr) {
                console.error("Errore nel caricamento del profilo:", xhr);
            }
        });
    }

    // --- MODIFICA PROFILO ---
    $('#profile-form').on('submit', function (e) {
        e.preventDefault();

        const $status = $('#profile-status');
        const $btn = $('#btn-save-profile');

        $status.removeClass('text-success text-danger').text('');

        const payload = {
            nome: $('#profile-nome-input').val().trim(),
            cognome: $('#profile-cognome-input').val().trim(),
            email: $('#profile-email-input').val().trim()
        };

        const ruolo = localStorage.getItem('ruolo');
        if (ruolo !== 'professionista') {
            payload.zona = $('#profile-zona-input').val().trim();
        }

        if (!payload.nome || !payload.cognome || !payload.email) {
            $status.addClass('text-danger').text('Compila tutti i campi obbligatori.');
            return;
        }

        $btn.prop('disabled', true);

        $.ajax({
            url: `${API_URL}/me/edit`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                $status
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(response.message || 'Profilo aggiornato con successo!');

                // Aggiorna anche la scheda di riepilogo in tempo reale
                loadUserProfile();
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Errore durante l\'aggiornamento del profilo.';
                $status
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(errorMsg);
            },
            complete: function () {
                $btn.prop('disabled', false);
            }
        });
    });

    // --- CAMBIO PASSWORD ---
    $('#update-password-form').on('submit', function (e) {
        e.preventDefault();

        const vecchiaPassword = $('#old-password').val();
        const nuovaPassword = $('#new-password').val();
        const $status = $('#password-status');
        const $button = $(this).find('button[type="submit"]');

        $status.removeClass('text-success text-danger').text('');

        if (!vecchiaPassword || !nuovaPassword) {
            $status.addClass('text-danger').text('Compila tutti i campi.');
            return;
        }

        if (!passwordRegex.test(nuovaPassword)) {
            $status
                .addClass('text-danger')
                .text('La nuova password deve contenere almeno una maiuscola, un numero e un carattere speciale.');
            $('#new-password').addClass('is-invalid').focus();
            return;
        }

        if (vecchiaPassword === nuovaPassword) {
            $status.addClass('text-danger').text('La nuova password deve essere diversa da quella attuale.');
            return;
        }

        const payload = {
            vecchia_password: vecchiaPassword,
            nuova_password: nuovaPassword
        };

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

                $('#old-password, #new-password').val('').removeClass('is-invalid');
            },
            error: function (xhr) {
                console.error('Errore cambio password:', xhr);
                const errorMsg = xhr.responseJSON?.error || 'Errore durante l\'aggiornamento della password.';
                $status
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(errorMsg);
            },
            complete: function () {
                $button.prop('disabled', false);
            }
        });
    });

    // --- REGISTRAZIONE ---
    $('#regRuolo').on('change', function () {
        if ($(this).val() === 'prop') {
            $('#zonaGroup').removeClass('d-none');
            $('#regZona').attr('required', true);
        } else {
            $('#zonaGroup').addClass('d-none');
            $('#regZona').removeAttr('required').val('');
        }
    });

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