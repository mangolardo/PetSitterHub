$(document).ready(function () {
    // Helper per evitare attacchi XSS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    // Estrae i parametri iniziali dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    let zona = urlParams.get('zona') || '';
    let servizio = urlParams.get('servizio') || '';
    let tipoAnimale = urlParams.get('tipo_animale') || urlParams.get('animale') || '';

    // Popola i campi del form con i parametri correnti (se presenti)
    $('#filterZona').val(zona);
    $('#filterServizio').val(servizio);
    $('#filterAnimale').val(tipoAnimale);

    // Funzione principale per caricare i dati via AJAX
    function loadSitters(pZona, pServizio, pAnimale) {
        // Aggiorna il testo dei filtri attivi
        let filterDesc = [];
        if (pZona) filterDesc.push(`Zona: <strong>${escapeHtml(pZona)}</strong>`);
        if (pServizio) filterDesc.push(`Servizio: <strong>${escapeHtml(pServizio)}</strong>`);
        if (pAnimale) filterDesc.push(`Animale: <strong>${escapeHtml(pAnimale)}</strong>`);

        if (filterDesc.length > 0) {
            $("#active-filters-text").html(filterDesc.join(' | '));
        } else {
            $("#active-filters-text").html('Tutti i servizi e zone');
        }

        // Prepara i parametri per il backend
        const queryParams = {};
        if (pZona) queryParams.zona = pZona;
        if (pServizio) queryParams.servizio = pServizio;
        if (pAnimale) {
            queryParams.animale = pAnimale;
        }

        // Mostra il caricamento prima della chiamata
        $("#catalog-empty").addClass("d-none");
        $("#catalog-grid").html(`
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Caricamento...</span>
                </div>
                <p class="text-muted mt-2">Ricerca in corso...</p>
            </div>
        `);

        // Chiamata AJAX
        $.ajax({
            url: "${API_BASE_URL}/sitters",
            method: "GET",
            data: queryParams,
            success: function (serviziList) {
                const $grid = $("#catalog-grid");
                $grid.empty();

                if (!serviziList || serviziList.length === 0) {
                    $("#catalog-empty").removeClass("d-none");
                    return;
                }

                serviziList.forEach(function (item) {
                    const nome = item.nome_professionista || item.nome || 'Pet Sitter';
                    const cognome = item.cognome_professionista || item.cognome || '';
                    const itemZona = item.zona || 'Non specificata';
                    const valutazione = item.valutazione_media || item.voto || '5.0';
                    const tipologia = item.tipologia || item.servizio || 'Servizio Pet';
                    const animale = item.tipo_animale || item.animale || 'Tutti';
                    const tariffa = item.tariffa ? parseFloat(item.tariffa).toFixed(2) : '0.00';
                    const idServizio = item.id_servizio || item.id || '';

                    $grid.append(`
                        <div class="col-md-6 col-xl-4">
                            <article class="sitter-card h-100 shadow-sm">
                                <div class="sitter-top">
                                    <span class="verified-badge">
                                        <i class="bi bi-shield-check"></i> Verificato
                                    </span>
                                    <i class="bi bi-heart-fill sitter-icon"></i>
                                </div>
                                <div class="sitter-body d-flex flex-column justify-content-between h-100">
                                    <div>
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h3 class="h5 mb-1">${escapeHtml(nome)} ${escapeHtml(cognome)}</h3>
                                                <p class="zone text-muted small mb-0">
                                                    <i class="bi bi-geo-alt"></i> ${escapeHtml(itemZona)}
                                                </p>
                                            </div>
                                            <span class="rating badge bg-light text-dark border">
                                                <i class="bi bi-star-fill text-warning"></i> ${escapeHtml(valutazione)}
                                            </span>
                                        </div>
                                        <p class="services text-secondary mt-3">
                                            <strong>${escapeHtml(tipologia)}</strong> (${escapeHtml(animale)})
                                        </p>
                                    </div>

                                    <div class="sitter-footer mt-4 pt-3 border-top d-flex align-items-center justify-content-between">
                                        <div>
                                            <small class="text-muted d-block" style="font-size: 0.75rem;">Tariffa</small>
                                            <strong class="text-success fs-5">€${tariffa}</strong>
                                        </div>
                                        <a href="prenotazione.html?id_servizio=${idServizio}" class="btn btn-coral btn-sm rounded-pill px-3">
                                            Prenota ora
                                        </a>
                                    </div>
                                </div>
                            </article>
                        </div>
                    `);
                });
            },
            error: function (xhr) {
                $("#catalog-grid").empty();
                if (xhr.status === 401 || xhr.status === 404) {
                    $("#catalog-empty").removeClass("d-none");
                    return;
                }
                $("#catalog-grid").html(`
                    <div class="col-12 text-center py-5">
                        <p class="text-danger">Si è verificato un errore durante il caricamento dei dati dal server.</p>
                    </div>
                `);
            }
        });
    }

    // Caricamento iniziale
    loadSitters(zona, servizio, tipoAnimale);

    // Gestione invio modulo di ricerca
    $("#catalogSearchForm").on("submit", function (e) {
        e.preventDefault();
        const newZona = $("#filterZona").val().trim();
        const newServizio = $("#filterServizio").val();
        const newAnimale = $("#filterAnimale").val();

        loadSitters(newZona, newServizio, newAnimale);
    });

    // Gestione pulsante Reset
    $("#btnResetFilters").on("click", function () {
        $("#catalogSearchForm")[0].reset();
        loadSitters('', '', '');
    });
});