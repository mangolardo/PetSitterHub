$(document).ready(function () {
    // Previene attacchi XSS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    // Configura la base URL delle API Express (assicurati che sia definita in config.js)
    const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : '';

    // Recupera l'ID del servizio dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const idServizio = urlParams.get('id_servizio') || urlParams.get('id');

    // Se manca l'ID del servizio, reindirizza al catalogo
    if (!idServizio) {
        $("#loader").addClass("d-none");
        alert("Nessun servizio specificato.");
        window.location.href = "catalogo.html";
        return;
    }

    // Imposta subito l'ID servizio nell'input hidden del form di recensione
    $('#reviewServizioId').val(idServizio);

    // Carica i dati del servizio dal backend
    loadServiceDetails(idServizio);

    // Gestione selezione stelle nel modale recensioni
    setupStarRating();

    // Gestione invio form recensione
    setupReviewFormSubmit();

    /**
     * 1. CARICAMENTO DETTAGLI SERVIZIO
     * Chiamata GET /api/servizi/:id_service
     */
    function loadServiceDetails(id) {
        $.ajax({
            url: `${API_BASE_URL}/servizi/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (servizio) {
                renderServiceData(servizio);
            },
            error: function (xhr, status, error) {
                console.error("Errore durante il recupero del servizio:", error);
                $("#loader").addClass("d-none");

                if (xhr.status === 404) {
                    alert("Servizio non trovato.");
                } else {
                    alert("Si è verificato un errore nel caricamento dei dettagli del servizio.");
                }
                window.location.href = "catalogo.html";
            }
        });
    }

    /**
     * 2. RENDERING DEI DATI DEL SERVIZIO
     */
    function renderServiceData(data) {
        const serviceId = data.id || data.id_servizio || idServizio;

        // Imposta l'ID servizio nell'input hidden
        $('#reviewServizioId').val(serviceId);

        // Nome e cognome del sitter
        const nomeSitter = `${data.nome || data.nome_professionista || ''} ${data.cognome || data.cognome_professionista || ''}`.trim();
        $("#sitterName").text(nomeSitter || "Pet Sitter");

        // Zona/Città
        $("#sitterZone").text(data.zona || "Zona non specificata");

        // Tipologia e Animale
        const titoloServizio = `${data.tipologia || 'Servizio'} - ${data.tipo_animale || 'Pet'}`;
        $("#serviceTitle").text(titoloServizio);

        // Prezzo / Tariffa
        const tariffa = parseFloat(data.tariffa || 0).toFixed(2);
        $("#servicePrice").text(`€${tariffa}`);

        // Link per avviare la prenotazione
        $("#btnBookNow").attr("href", `prenotazione.html?id_servizio=${serviceId}`);

        // Mostra il contenitore principale
        $("#loader").addClass("d-none");
        $("#detailContent").removeClass("d-none");

        // CARICAMENTO RECENSIONI
        // Recupera le recensioni usando id_professionista se presente
        const idProfessionista = data.id_professionista;
        if (idProfessionista) {
            loadReviews(idProfessionista);
        } else {
            renderReviews([]);
        }
    }

    /**
     * 3. CARICAMENTO RECENSIONI
     * Chiamata GET /api/recensioni/:id_professionista
     */
    function loadReviews(idProfessionista) {
        $.ajax({
            url: `${API_BASE_URL}/recensioni/${idProfessionista}`,
            method: 'GET',
            dataType: 'json',
            success: function (recensioni) {
                renderReviews(recensioni);
                updateRatingSummary(recensioni);
            },
            error: function (err) {
                console.warn("Impossibile caricare le recensioni:", err);
                renderReviews([]);
            }
        });
    }

    /**
     * Calcola e mostra la media voti e il conteggio recensioni nell'intestazione
     */
    function updateRatingSummary(recensioni) {
        if (!recensioni || recensioni.length === 0) {
            $("#sitterRating").text("N/D");
            $("#reviewsCount").text("(0 recensioni)");
            return;
        }

        const totale = recensioni.reduce((sum, r) => sum + parseInt(r.valutazione || 0), 0);
        const media = (totale / recensioni.length).toFixed(1);

        $("#sitterRating").text(media);
        $("#reviewsCount").text(`(${recensioni.length} ${recensioni.length === 1 ? 'recensione' : 'recensioni'})`);
    }

    /**
     * 4. RENDERING LISTA RECENSIONI
     */
    function renderReviews(recensioni) {
        const $reviewsList = $("#reviewsList");
        $reviewsList.empty();

        if (!recensioni || recensioni.length === 0) {
            $reviewsList.append(`
                <div class="dash-card p-4 text-center text-muted">
                    <i class="bi bi-star-slash fs-1 d-block mb-2 text-secondary"></i>
                    Nessuna recensione disponibile per questo professionista.
                </div>
            `);
            return;
        }

        // Legge l'ID dell'utente corrente memorizzato al login (es. in localStorage) per consentire l'eliminazione
        const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

        recensioni.forEach(function (rec) {
            let stelleHTML = '';
            const voto = parseInt(rec.valutazione || 5);

            for (let i = 1; i <= 5; i++) {
                stelleHTML += `<i class="bi bi-star-fill ${i <= voto ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
            }

            const dataFormattata = rec.data_creazione
                ? new Date(rec.data_creazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';

            const nomeAutore = `${rec.nome || 'Cliente'} ${rec.cognome || ''}`.trim();

            // Tasto elimina: mostrato se la recensione appartiene all'utente attualmente loggato
            let deleteBtnHTML = '';
            if (currentUserId && (rec.id_proprietario == currentUserId || rec.id_utente == currentUserId)) {
                deleteBtnHTML = `
                    <button class="btn btn-sm btn-outline-danger border-0 btn-delete-review ms-2" data-id="${rec.id}" title="Elimina recensione">
                        <i class="bi bi-trash"></i>
                    </button>
                `;
            }

            $reviewsList.append(`
                <div class="dash-card p-4" id="review-card-${rec.id}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 class="fw-bold mb-0 d-inline-block">${escapeHtml(nomeAutore)}</h5>
                            ${deleteBtnHTML}
                            <br>
                            <small class="text-muted">${escapeHtml(dataFormattata)}</small>
                        </div>
                        <div class="fs-5">${stelleHTML}</div>
                    </div>
                    <p class="text-secondary mb-0">${escapeHtml(rec.commento || rec.testo || 'Nessun commento scritto.')}</p>
                </div>
            `);
        });

        // Event listener per i pulsanti di eliminazione
        $(".btn-delete-review").off('click').on('click', function () {
            const idRecensione = $(this).data('id');
            if (confirm("Sei sicuro di voler eliminare questa recensione?")) {
                deleteReview(idRecensione);
            }
        });
    }

    /**
     * 5. CREAZIONE RECENSIONE
     * Chiamata POST /api/recensioni/add
     */
    function setupReviewFormSubmit() {
        $("#addReviewForm").on("submit", function (e) {
            e.preventDefault();

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                showAlert('danger', 'Devi effettuare il login per lasciare una recensione.');
                return;
            }

            const valutazione = parseInt($("#reviewValutazione").val());
            const commento = $("#reviewCommento").val().trim();
            const idServizio = $("#reviewServizioId").val();

            if (!valutazione || valutazione < 1 || valutazione > 5) {
                showAlert('warning', 'Seleziona un voto da 1 a 5 stelle.');
                return;
            }

            const $btnSubmit = $("#btnSubmitReview");
            $btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Invio in corso...');

            $.ajax({
                url: `${API_BASE_URL}/recensioni/add`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    valutazione: valutazione,
                    commento: commento,
                    id_servizio: idServizio
                }),
                success: function (response) {
                    showAlert('success', 'Recensione pubblicata con successo!');

                    // Resetta il form
                    $("#addReviewForm")[0].reset();
                    $("#reviewValutazione").val(0);
                    resetStars();

                    // Chiudi il modale dopo 1.5 secondi e ricarica i dati
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addReviewModal'));
                        if (modal) modal.hide();
                        $("#reviewAlert").addClass("d-none");
                        loadServiceDetails(idServizio);
                    }, 1500);
                },
                error: function (xhr) {
                    console.error("Errore salvataggio recensione:", xhr);
                    let errMsg = "Impossibile salvare la recensione.";
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errMsg = xhr.responseJSON.error;
                    }
                    showAlert('danger', errMsg);
                },
                complete: function () {
                    $btnSubmit.prop('disabled', false).text('Pubblica Recensione');
                }
            });
        });
    }

    /**
     * 6. ELIMINAZIONE RECENSIONE
     * Chiamata DELETE /api/recensioni/delete/:id
     */
    function deleteReview(idRecensione) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            alert("Devi effettuare il login per eliminare una recensione.");
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/recensioni/delete/${idRecensione}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                alert("Recensione eliminata con successo.");
                // Ricarica la pagina o i dettagli per aggiornare la lista e la media
                loadServiceDetails(idServizio);
            },
            error: function (xhr) {
                console.error("Errore eliminazione recensione:", xhr);
                let msg = "Errore durante l'eliminazione della recensione.";
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    msg = xhr.responseJSON.error;
                }
                alert(msg);
            }
        });
    }

    /**
     * UTILITY: Gestione Stelle interattive nel Modale
     */
    function setupStarRating() {
        const $stars = $(".star-btn");

        $stars.on("mouseover", function () {
            const val = $(this).data("value");
            highlightStars(val);
        });

        $("#starContainer").on("mouseleave", function () {
            const currentVal = parseInt($("#reviewValutazione").val()) || 0;
            highlightStars(currentVal);
        });

        $stars.on("click", function () {
            const val = $(this).data("value");
            $("#reviewValutazione").val(val);
            highlightStars(val);
        });
    }

    function highlightStars(count) {
        $(".star-btn").each(function () {
            const starVal = $(this).data("value");
            if (starVal <= count) {
                $(this).removeClass("bi-star").addClass("bi-star-fill");
            } else {
                $(this).removeClass("bi-star-fill").addClass("bi-star");
            }
        });
    }

    function resetStars() {
        $(".star-btn").removeClass("bi-star-fill").addClass("bi-star");
    }

    function showAlert(type, message) {
        const $alert = $("#reviewAlert");
        $alert.removeClass("d-none alert-success alert-danger alert-warning")
              .addClass(`alert-${type}`)
              .text(message);
    }
});