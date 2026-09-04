$(document).ready(function () {
    const token = localStorage.getItem('token');

    // Configura l'header di autorizzazione globale per AJAX se l'utente è loggato
    if (token) {
        $.ajaxSetup({
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    }

    // Estrae l'ID servizio dall'URL (es. dettaglio-servizio.html?id_servizio=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idServizio = urlParams.get('id_servizio') || urlParams.get('id');

    // --- 1. FUNZIONE PER CARICARE LE DISPONIBILITÀ (GET) ---
    window.loadAvailabilities = function (serviceId) {
        const targetId = serviceId || idServizio;
        const $container = $('#disponibilitaContainer');

        if (!targetId || !$container.length) return;

        $.ajax({
            url: `${API_BASE_URL}/disponibilita/${targetId}`,
            method: 'GET',
            dataType: 'json',
            success: function (disponibilita) {
                $container.empty();

                if (!disponibilita || disponibilita.length === 0) {
                    $container.html(`
                        <div class="dash-card p-3 text-center text-muted">
                            <i class="bi bi-calendar-x fs-2 d-block mb-1 text-secondary"></i>
                            Nessuna disponibilità programmata al momento.
                        </div>
                    `);
                    return;
                }

                const currentUserId = getCurrentUserId();

                disponibilita.forEach(function (disp) {
                    const dataInizio = formatDateTime(disp.data_inizio);
                    const dataFine = formatDateTime(disp.data_fine);

                    // Tasto elimina visibile solo se l'utente è il proprietario
                    let deleteBtn = '';
                    if (disp.id_professionista === currentUserId || disp.is_owner) {
                        deleteBtn = `
                            <button class="btn btn-sm btn-outline-danger btn-delete-disp ms-auto" data-id="${disp.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                    }

                    $container.append(`
                        <div class="dash-card p-3 mb-2 d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-clock-history color-green fs-5"></i>
                                <div>
                                    <span class="fw-semibold text-dark">${dataInizio}</span>
                                    <span class="text-muted mx-1">→</span>
                                    <span class="fw-semibold text-dark">${dataFine}</span>
                                </div>
                            </div>
                            ${deleteBtn}
                        </div>
                    `);
                });
            },
            error: function (xhr) {
                console.error("Errore nel caricamento delle disponibilità:", xhr);
                $container.html(`
                    <div class="alert alert-danger p-2 text-center" role="alert">
                        Errore durante il caricamento delle disponibilità.
                    </div>
                `);
            }
        });
    };

    // Esegue il caricamento automatico all'avvio se è presente l'ID nell'URL
    if (idServizio) {
        window.loadAvailabilities(idServizio);
    }

    // --- 2. AGGIUNTA NUOVA DISPONIBILITÀ (POST) ---
    $('#addAvailabilityForm').on('submit', function (e) {
        e.preventDefault();

        if (!token) {
            showDispAlert('Devi effettuare il login per aggiungere disponibilità.', 'danger');
            return;
        }

        const targetServiceId = $('#dispServizioId').val() || idServizio;
        const dataInizio = $('#dispDataInizio').val();
        const dataFine = $('#dispDataFine').val();

        if (!targetServiceId) {
            showDispAlert('ID servizio non valido.', 'danger');
            return;
        }

        if (new Date(dataInizio) >= new Date(dataFine)) {
            showDispAlert('La data/ora di fine deve essere successiva a quella di inizio.', 'danger');
            return;
        }

        const $btn = $('#btnSubmitDisp');
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio...');

        const payload = {
            data_inizio: dataInizio,
            data_fine: dataFine
        };

        $.ajax({
            url: `${API_BASE_URL}/disponibilita/${targetServiceId}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                showDispAlert(response.message || 'Disponibilità aggiunta con successo!', 'success');
                $('#addAvailabilityForm')[0].reset();
                $btn.prop('disabled', false).text('Aggiungi Disponibilità');

                // Ricarica la lista delle disponibilità
                window.loadAvailabilities(targetServiceId);
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text('Aggiungi Disponibilità');
                const errorMsg = xhr.responseJSON?.error || 'Errore durante l\'aggiunta della disponibilità.';
                showDispAlert(errorMsg, 'danger');
            }
        });
    });

    // --- 3. CANCELLAZIONE DISPONIBILITÀ (DELETE) ---
    $(document).on('click', '.btn-delete-disp', function () {
        const idDisponibilita = $(this).data('id');

        if (!confirm('Sei sicuro di voler rimuovere questa disponibilità?')) {
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/disponibilita/${idDisponibilita}`,
            method: 'DELETE',
            success: function (response) {
                window.loadAvailabilities(idServizio);
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Errore durante la cancellazione.';
                alert(errorMsg);
            }
        });
    });

    // Helper per mostrare avvisi d'errore o successo nel modulo
    function showDispAlert(msg, type) {
        const $alert = $('#dispAlert');
        if ($alert.length) {
            $alert.removeClass('d-none alert-success alert-danger')
                  .addClass(`alert-${type}`)
                  .text(msg);
        } else {
            alert(msg);
        }
    }

    // Helper per formattare la data leggibile in italiano
    function formatDateTime(isoString) {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Helper per estrarre l'ID utente loggato dal JWT
    function getCurrentUserId() {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).id;
        } catch (e) {
            return null;
        }
    }
});