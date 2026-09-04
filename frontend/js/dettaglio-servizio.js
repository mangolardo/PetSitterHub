$(document).ready(function () {
    // Previene attacchi XSS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    // Configura la base URL delle API Express
    const API_BASE_URL = '/api';

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

    /**
     * Chiamata GET all'endpoint /api/servizi/:id
     */
    function loadServiceDetails(id) {
        $.ajax({
            url: `${API_BASE_URL}/servizi/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (servizio) {
                renderServiceData(servizio);
                loadAvailabilities(id);
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
     * Chiamata GET per le disponibilità del servizio
     */
    function loadAvailabilities(id) {
        $.ajax({
            url: `${API_BASE_URL}/disponibilita/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (disponibilita) {
                console.log("Disponibilità caricate:", disponibilita);
            },
            error: function (err) {
                console.warn("Impossibile caricare le disponibilità:", err);
            }
        });
    }

    /**
     * Mappa i campi ritornati dal DB negli elementi HTML della pagina
     */
    function renderServiceData(data) {
        const serviceId = data.id_servizio || data.id || idServizio;

        // Imposta l'ID servizio nell'input hidden della modale recensioni
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

        // Nasconde lo spinner e mostra il contenitore principale
        $("#loader").addClass("d-none");
        $("#detailContent").removeClass("d-none");

        // --- INTEGRAZIONE CON RECENSIONI.JS ---
        const idProfessionista = data.id_professionista;

        if (idProfessionista && typeof window.loadReviewsForProfessionist === 'function') {
            window.loadReviewsForProfessionist(idProfessionista);
        } else if (data.recensioni) {
            renderReviews(data.recensioni);
        }
    }

    /**
     * Fallback: Inietta la lista delle recensioni se ricevute nel payload del servizio
     */
    function renderReviews(recensioni) {
        const $reviewsList = $("#reviewsList");
        $reviewsList.empty();

        if (!recensioni || recensioni.length === 0) {
            $reviewsList.append(`
                <div class="dash-card p-4 text-center text-muted">
                    <i class="bi bi-star-slash fs-1 d-block mb-2 text-secondary"></i>
                    Nessuna recensione disponibile per questo servizio.
                </div>
            `);
            return;
        }

        recensioni.forEach(function (rec) {
            let stelleHTML = '';
            const voto = parseInt(rec.valutazione || 5);

            for (let i = 1; i <= 5; i++) {
                stelleHTML += `<i class="bi bi-star-fill ${i <= voto ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
            }

            const dataFormattata = rec.data_creazione
                ? new Date(rec.data_creazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';

            $reviewsList.append(`
                <div class="dash-card p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 class="fw-bold mb-0">${escapeHtml(rec.nome || 'Cliente')}</h5>
                            <small class="text-muted">${escapeHtml(dataFormattata)}</small>
                        </div>
                        <div class="fs-5">${stelleHTML}</div>
                    </div>
                    <p class="text-secondary mb-0">${escapeHtml(rec.commento || rec.testo || 'Nessun commento scritto.')}</p>
                </div>
            `);
        });
    }
});