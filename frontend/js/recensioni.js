$(document).ready(function () {
    const token = localStorage.getItem('token');

    if (token) {
        $.ajaxSetup({
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    let idProfessionista = urlParams.get('id_professionista');
    const idServizioUrl = urlParams.get('id_servizio') || urlParams.get('id');

    if (idServizioUrl) {
        $('#reviewServizioId').val(idServizioUrl);
    }

    // --- 1. GESTIONE STELLE (RATING) ---
    let selectedRating = 0;

    $('.star-btn').on('mouseenter', function () {
        const hoverValue = $(this).data('value');
        highlightStars(hoverValue);
    });

    $('#starContainer').on('mouseleave', function () {
        highlightStars(selectedRating);
    });

    $('.star-btn').on('click', function () {
        selectedRating = $(this).data('value');
        $('#reviewValutazione').val(selectedRating);
        highlightStars(selectedRating);
    });

    function highlightStars(count) {
        $('.star-btn').each(function (index) {
            if (index < count) {
                $(this).removeClass('bi-star').addClass('bi-star-fill');
            } else {
                $(this).removeClass('bi-star-fill').addClass('bi-star');
            }
        });
    }

    // --- 2. CARICAMENTO RECENSIONI (Funzione Esportata e Globale) ---
    window.loadReviewsForProfessionist = function (profId) {
        const targetId = profId || idProfessionista || getCurrentUserId();
        const $reviewsList = $('#lista-recensioni').length ? $('#lista-recensioni') : $('#reviewsList');

        if (!$reviewsList.length) return;

        if (!targetId) {
            $reviewsList.html('<p class="text-muted text-center py-3">Impossibile identificare il professionista.</p>');
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/recensioni/${targetId}`,
            method: 'GET',
            success: function (reviews) {
                $reviewsList.empty();

                // Aggiorna il contatore recensioni nella UI della pagina dettaglio (se presente)
                if ($('#reviewsCount').length) {
                    $('#reviewsCount').text(`(${reviews ? reviews.length : 0} recensioni)`);
                }

                if (!reviews || reviews.length === 0) {
                    $reviewsList.html(`
                        <div class="dash-card p-4 text-center text-muted">
                            <i class="bi bi-star-slash fs-1 d-block mb-2 text-secondary"></i>
                            Non ci sono ancora recensioni per questo professionista.
                        </div>
                    `);
                    return;
                }

                // Calcolo e aggiornamento media voto nella pagina dettaglio
                let totaleVoti = 0;

                reviews.forEach(function (r) {
                    totaleVoti += r.valutazione;

                    let starsHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        starsHtml += i <= r.valutazione
                            ? '<i class="bi bi-star-fill text-warning"></i>'
                            : '<i class="bi bi-star text-muted"></i>';
                    }

                    const dataCreazione = r.data_creazione
                        ? new Date(r.data_creazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '';

                    const nomeProprietario = (r.nome_proprietario || r.nome)
                        ? `${r.nome_proprietario || r.nome} ${r.cognome_proprietario || r.cognome || ''}`
                        : 'Cliente';

                    const servizioInfo = r.tipologia
                        ? `${r.tipologia} (${r.tipo_animale || 'Pet'})`
                        : `Servizio #${r.id_servizio}`;

                    let deleteBtn = '';
                    if (r.is_owner || r.id_proprietario === getCurrentUserId()) {
                        deleteBtn = `
                            <button class="btn btn-sm btn-outline-danger btn-delete-review ms-auto" data-id="${r.id}">
                                <i class="bi bi-trash"></i> Elimina
                            </button>
                        `;
                    }

                    $reviewsList.append(`
                        <div class="dash-card p-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h5 class="fw-bold mb-0">${escapeHtml(nomeProprietario)}</h5>
                                    <small class="text-muted">${dataCreazione}</small>
                                </div>
                                <div class="fs-5">${starsHtml}</div>
                            </div>
                            <p class="text-secondary mb-3">${escapeHtml(r.commento || 'Nessun commento scritto.')}</p>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-light text-dark border">
                                    <i class="bi bi-tag me-1"></i>${escapeHtml(servizioInfo)}
                                </span>
                                ${deleteBtn}
                            </div>
                        </div>
                    `);
                });

                if ($('#sitterRating').length && reviews.length > 0) {
                    const media = (totaleVoti / reviews.length).toFixed(1);
                    $('#sitterRating').text(media);
                }
            },
            error: function () {
                $reviewsList.html('<div class="dash-card p-4 text-danger text-center">Errore durante il caricamento delle recensioni.</div>');
            }
        });
    };

    // Esegui subito se idProfessionista è già presente nell'URL
    if (idProfessionista) {
        window.loadReviewsForProfessionist(idProfessionista);
    }

    // Carica al click del tab nella Dashboard
    $('#tab-recensioni-btn').on('click', function () {
        window.loadReviewsForProfessionist();
    });

    // --- 3. CREAZIONE NUOVA RECENSIONE ---
    $('#addReviewForm').on('submit', function (e) {
        e.preventDefault();

        const $btn = $('#btnSubmitReview');

        if (!token) {
            showAlert('Devi effettuare il login per lasciare una recensione.', 'danger');
            return;
        }

        const idServizio = $('#reviewServizioId').val();
        const valutazione = parseInt($('#reviewValutazione').val());
        const commento = $('#reviewCommento').val().trim();

        if (!idServizio) {
            showAlert('Inserisci un ID servizio valido.', 'danger');
            return;
        }

        if (!valutazione || valutazione < 1 || valutazione > 5) {
            showAlert('Seleziona una valutazione da 1 a 5 stelle.', 'danger');
            return;
        }

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Invio in corso...');

        const payload = {
            id_servizio: parseInt(idServizio),
            valutazione: valutazione,
            commento: commento
        };

        $.ajax({
            url: '${API_BASE_URL}/recensioni/add',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                showAlert(response.message || 'Recensione pubblicata con successo!', 'success');

                $('#addReviewForm')[0].reset();
                selectedRating = 0;
                highlightStars(0);
                $('#reviewValutazione').val(0);

                $btn.prop('disabled', false).text('Pubblica Recensione');
                window.loadReviewsForProfessionist();
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text('Pubblica Recensione');
                const errorMsg = xhr.responseJSON?.error || 'Errore durante l\'invio della recensione.';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // --- 4. CANCELLAZIONE RECENSIONE ---
    $(document).on('click', '.btn-delete-review', function () {
        const idRecensione = $(this).data('id');

        if (!confirm('Sei sicuro di voler eliminare questa recensione?')) {
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/recensioni/delete/${idRecensione}`,
            method: 'DELETE',
            success: function (response) {
                showAlert(response.message || 'Recensione eliminata.', 'success');
                window.loadReviewsForProfessionist();
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Errore durante la cancellazione.';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    function showAlert(msg, type) {
        const $alert = $('#alert-message').length ? $('#alert-message') : $('#reviewAlert');
        if ($alert.length) {
            $alert.removeClass('d-none alert-success alert-danger')
                  .addClass(`alert-${type}`)
                  .text(msg);
        }
    }

    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

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