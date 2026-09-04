$(document).ready(function () {
    // previene attacchi XSS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    // Configura la base URL delle tue API Express (modifica la porta se diversa)
    const API_BASE_URL = 'http://localhost:3000/api';

    // Recupera l'ID del servizio dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const idServizio = urlParams.get('id_servizio') || urlParams.get('id');

    // Se manca l'ID del servizio, reindirizza o mostra un errore
    if (!idServizio) {
        $("#loader").addClass("d-none");
        alert("Nessun servizio specificato.");
        window.location.href = "catalogo.html";
        return;
    }

    // Carica i dati del servizio dal backend
    loadServiceDetails(idServizio);

    /**
     * Chiamata GET all'endpoint /services/:id_service
     */
    function loadServiceDetails(id) {
        $.ajax({
            url: `${API_BASE_URL}/services/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (servizio) {
                renderServiceData(servizio);

                // Carica le disponibilità se vuoi mostrarle in pagina
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
     * Chiamata GET per le disponibilità (utilizza la funzione getAvailabilities del controller)
     */
    function loadAvailabilities(id) {
        $.ajax({
            url: `${API_BASE_URL}/services/${id}/availabilities`,
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
     * Mappa i campi ritornati dalla query SQL negli elementi HTML della pagina
     */
    function renderServiceData(data) {
        // Nome e cognome del sitter (corretto nome della variabile)
        const nomeSitter = `${data.nome || ''} ${data.cognome || ''}`.trim();
        $("#sitterName").text(nomeSitter || "Pet Sitter");

        // Zona/Città
        $("#sitterZone").text(data.zona || "Zona non specificata");

        // Valutazione / Stelle
        const valutazione = data.media_voto != null
            ? parseFloat(data.media_voto).toFixed(1)
            : "Nessuna Valutazione";

        $("#sitterRating").text(valutazione);

        // Numero di recensioni
        const numRecensioni = data.num_recensioni != null
            ? data.num_recensioni
            : (data.recensioni ? data.recensioni.length : 0);
        $("#reviewsCount").text(`(${numRecensioni} recensioni)`);

        // Tipologia
        $("#serviceTitle").text(data.tipologia|| "Tipo di Servizio");

        // Prezzo / Tariffa
        const tariffa = parseFloat(data.tariffa ||  0).toFixed(2);
        $("#servicePrice").text(`€${tariffa}`);

        // Link per la prenotazione con passaggio dell'ID
        $("#btnBookNow").attr("href", `prenotazioni.html?id_servizio=${data.id_servizio || data.id}`);

        // Renderizza le recensioni se presenti
        renderReviews(data.recensioni || []);

        // Nasconde lo spinner e mostra il contenuto
        $("#loader").addClass("d-none");
        $("#detailContent").removeClass("d-none");
    }

    /**
     * Inietta la lista delle recensioni dinamiche
     */
    function renderReviews(recensioni) {
        const $reviewsList = $("#reviewsList");
        $reviewsList.empty();

        if (!recensioni || recensioni.length === 0) {
            $reviewsList.append('<p class="text-muted mb-0">Nessuna recensione disponibile per questo servizio.</p>');
            return;
        }

        recensioni.forEach(function (rec) {
            let stelleHTML = '';
            const voto = parseInt(rec.valutazione || 5);

            for (let i = 1; i <= 5; i++) {
                stelleHTML += `<i class="bi bi-star-fill ${i <= voto ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
            }

            const dataFormattata = rec.data_creazione ? new Date(rec.data_creazione).toLocaleDateString('it-IT') : '';

            $reviewsList.append(`
                <div class="p-3 bg-paper rounded-4 border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <strong class="d-block text-dark">${escapeHtml(rec.nome || 'Utente')}</strong>
                            <small class="text-muted" style="font-size: 0.8rem;">${escapeHtml(dataFormattata)}</small>
                        </div>
                        <div>${stelleHTML}</div>
                    </div>
                    <p class="mb-0 text-secondary small">${escapeHtml(rec.testo || rec.commento)}</p>
                </div>
            `);
        });
    }
});