//const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
$(document).ready(function () {
    // Previene attacchi XSS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    // Recupera l'ID del professionista dall'URL (es. profilo-sitter.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idProfessionista = urlParams.get('id');

    if (!idProfessionista) {
        alert("Nessun pet sitter specificato.");
        window.location.href = "catalogo.html";
        return;
    }

    // Avvia il caricamento di tutti i dati in parallelo
    loadAllSitterData(idProfessionista);

    /**
     * Coordina le chiamate API
     */
    function loadAllSitterData(id) {
        $.when(
            fetchSitterDetails(id),
            fetchSitterServices(id),
            fetchSitterReviews(id)
        ).then(function (sitterRes, servicesRes, reviewsRes) {
            // sitterRes, servicesRes, reviewsRes contengono [data, status, xhr]
            const sitterData = sitterRes[0];
            const servicesData = servicesRes[0];
            const reviewsData = reviewsRes[0];

            // Renderizza i dati nelle rispettive sezioni
            renderSitterInfo(sitterData);
            renderServices(servicesData);
            renderReviews(reviewsData);

            // Nasconde il loader e mostra la pagina
            $("#loader").addClass("d-none");
            $("#sitterProfileContent").removeClass("d-none");
        }).fail(function (err) {
            console.error("Errore durante il caricamento dei dati del pet sitter:", err);
            $("#loader").addClass("d-none");
            alert("Impossibile caricare le informazioni del pet sitter.");
        });
    }

    /**
     * 1. Recupera i dettagli del Pet Sitter
     */
    function fetchSitterDetails(id) {
        return $.ajax({
            url: `${API_BASE_URL}/sitters/${id}`, // o la tua rotta per il profilo
            method: 'GET',
            dataType: 'json'
        });
    }

    /**
     * 2. Recupera i servizi offerti (Router: GET /:id/services)
     */
    function fetchSitterServices(id) {
        return $.ajax({
            url: `${API_BASE_URL}/services/${id}`,
            method: 'GET',
            dataType: 'json'
        });
    }

    /**
     * 3. Recupera le recensioni (Router: GET /:id_professionista)
     */
    function fetchSitterReviews(id) {
        return $.ajax({
            url: `${API_BASE_URL}/reviews/${id}`,
            method: 'GET',
            dataType: 'json'
        });
    }

    /**
     * Rendering delle informazioni personali del Pet Sitter
     */
    function renderSitterInfo(data) {
        const nomeCompleto = `${data.nome || ''} ${data.cognome || ''}`.trim() || "Pet Sitter";
        $("#sitterFullName").text(nomeCompleto);
        $("#sitterCity").text(data.zona || data.citta || "Zona non specificata");

        if (data.bio) {
            $("#sitterBio").text(data.bio);
        }
        if (data.foto) {
            $("#sitterAvatar").attr("src", data.foto);
        }
    }

    /**
     * Rendering dei servizi offerti
     */
    function renderServices(servizi) {
        const $servicesList = $("#servicesList");
        $servicesList.empty();

        if (!servizi || servizi.length === 0) {
            $servicesList.append(`
                <div class="col-12 text-muted text-center py-3">
                    Il pet sitter non ha ancora configurato i suoi servizi.
                </div>
            `);
            return;
        }

        servizi.forEach(function (s) {
            const tariffa = parseFloat(s.tariffa || 0).toFixed(2);
            const serviceId = s.id || s.id_servizio;

            $servicesList.append(`
                <div class="col-md-6">
                    <div class="border rounded-3 p-3 bg-white h-100 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-primary-subtle text-primary fw-semibold">${escapeHtml(s.tipologia || 'Servizio')}</span>
                                <span class="fw-bold fs-5 text-success">€${tariffa}</span>
                            </div>
                            <h6 class="fw-bold">${escapeHtml(s.tipologia || 'Servizio')} - ${escapeHtml(s.tipo_animale || 'Pet')}</h6>
                            <p class="text-muted small mb-2">${escapeHtml(s.descrizione || 'Nessuna descrizione fornita.')}</p>
                        </div>
                        <a href="prenotazione.html?id_servizio=${serviceId}" class="btn btn-sm btn-outline-primary mt-2 w-100">
                            Prenota ora
                        </a>
                    </div>
                </div>
            `);
        });
    }

    /**
     * Rendering della lista recensioni e calcolo della media voti
     */
    function renderReviews(recensioni) {
        const $reviewsList = $("#sitterReviewsList");
        $reviewsList.empty();

        if (!recensioni || recensioni.length === 0) {
            $("#sitterRating").text("N/D");
            $("#sitterReviewsCount").text("(0 recensioni)");
            $reviewsList.append(`
                <p class="text-muted text-center py-3 mb-0">Nessuna recensione ancora ricevuta.</p>
            `);
            return;
        }

        // Calcolo media voti
        const totale = recensioni.reduce((sum, r) => sum + parseInt(r.valutazione || 0), 0);
        const media = (totale / recensioni.length).toFixed(1);

        $("#sitterRating").text(media);
        $("#sitterReviewsCount").text(`(${recensioni.length} ${recensioni.length === 1 ? 'recensione' : 'recensioni'})`);

        // Generazione lista recensioni
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

            $reviewsList.append(`
                <div class="border-bottom pb-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="fw-bold mb-0">${escapeHtml(nomeAutore)}</h6>
                        <div class="fs-6">${stelleHTML}</div>
                    </div>
                    <small class="text-muted d-block mb-2">${escapeHtml(dataFormattata)}</small>
                    <p class="text-secondary small mb-0">${escapeHtml(rec.commento || rec.testo || 'Nessun dettaglio inserito.')}</p>
                </div>
            `);
        });
    }
});