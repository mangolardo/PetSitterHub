$(document).ready(function () {
    const token = localStorage.getItem('token');
    const ruolo = localStorage.getItem('ruolo');
    const $authContainer = $('#nav-auth-container');

    if (token) {
        // Se l'utente è loggato, reindirizza alla dashboard se professionista, al profilo se proprietario
        const targetUrl = (ruolo === 'professionista') ? 'dashboard.html' : 'profilo.html';
        const labelArea = (ruolo === 'professionista') ? 'Dashboard' : 'Area Personale';

        $authContainer.html(`
            <div class="d-flex align-items-center gap-2">
                <a href="${targetUrl}" class="btn btn-outline-green rounded-pill px-3">
                    <i class="bi bi-person-circle me-1"></i> ${labelArea}
                </a>
                <button id="btn-index-logout" class="btn btn-outline-danger rounded-pill px-3" title="Esci">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
        `);
    } else {
        // Se non è loggato, mostra il pulsante Accedi
        $authContainer.html(`
            <a href="login.html" id="login-button" class="btn btn-outline-green rounded-pill px-4">Accedi</a>
        `);
    }
    // Caricamento dei top 3 professionisti per valutazione media
    loadTopSitters();

    function loadTopSitters() {
        $.ajax({
            url: `${API_BASE_URL}/sitters/best`,
            method: 'GET',
            dataType: 'json',
            success: function (sitters) {
                const $grid = $('#sitter-grid');
                $grid.empty();

                if (!Array.isArray(sitters) || sitters.length === 0) {
                    $('#empty-results').removeClass('d-none');
                    return;
                }

                sitters.forEach(function (item) {
                    const idProfessionista = item.id_professionista;
                    const nome = item.nome_professionista || 'Pet Sitter';
                    const cognome = item.cognome_professionista || '';
                    const valutazione = parseFloat(item.valutazione_media || 5.0).toFixed(1);
                    const listaServizi = item.lista_servizi || 'Vari servizi disponibili';

                    $grid.append(`
                    <div class="col-md-6 col-xl-4 sitter-wrapper">
                        <article class="sitter-card h-100 shadow-sm d-flex flex-column justify-content-between">
                            <div class="sitter-top">
                                <span class="verified-badge">
                                    <i class="bi bi-shield-check"></i> Verificato
                                </span>
                                <i class="bi bi-person-fill sitter-icon"></i>
                            </div>
                            <div class="sitter-body d-flex flex-column justify-content-between flex-grow-1 p-4">
                                <div>
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h3 class="h5 mb-1">${escapeHtml(nome)} ${escapeHtml(cognome)}</h3>
                                        </div>
                                        <span class="rating badge bg-light text-dark border">
                                            <i class="bi bi-star-fill text-warning"></i> ${escapeHtml(valutazione)}
                                        </span>
                                    </div>
                                    <p class="services text-secondary mt-3">
                                        <strong>Servizi offerti:</strong> ${escapeHtml(listaServizi)}
                                    </p>
                                </div>
                                <div class="sitter-footer mt-4 pt-3 border-top d-flex align-items-center justify-content-between">
                                    <a href="profilo-sitter.html?id=${idProfessionista}" class="btn btn-outline-coral btn-sm rounded-pill px-3 w-100">
                                        Vedi Profilo
                                    </a>
                                </div>
                            </div>
                        </article>
                    </div>
                `);
                });
            },
            error: function (err) {
                console.warn("Impossibile caricare i professionisti in evidenza:", err);
                $('#sitter-grid').html(`
                <div class="col-12 text-center text-muted py-4">
                    Impossibile caricare i professionisti in questo momento.
                </div>
            `);
            }
        });
    }

    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    let allZones = [];
    loadAvailableZones();
    function loadAvailableZones() {

        $.ajax({
            url: `${API_BASE_URL}/services/zones`,
            method: 'GET',
            dataType: 'json',
            success: function (zones) {
                if (Array.isArray(zones)) {
                    // Estrae la proprietà "zona" da ogni oggetto dell'array (gestisce anche eventuali stringhe dirette)
                    allZones = zones.map(item => (item !== null) ? item.zona : item)
                }
            },
            error: function (err) {
                console.warn("Impossibile caricare l'elenco delle zone attive:", err);
            }
        });
    }
    // Gestione della digitazione e filtraggio parziale (non case-sensitive)
    $('#location-input').on('input', function () {
        const query = $(this).val().toLowerCase().trim();
        const $dropdown = $('#zones-dropdown');

        $(this).removeClass('is-invalid');
        $('#search-status').text('');

        if (query.length === 0) {
            $dropdown.hide().empty();
            return;
        }

        // Filtra le zone (corrispondenza parziale, non case-sensitive)
        const filteredZones = allZones.filter(zona => zona.toLowerCase().includes(query));

        $dropdown.empty();
        if (filteredZones.length > 0) {
            filteredZones.forEach(zona => {
                $dropdown.append(`
                    <li><a class="dropdown-item py-2 px-3 zone-option" href="#" data-value="${zona}">${zona}</a></li>
                `);
            });
            $dropdown.show();
        } else {
            $dropdown.hide();
        }
    });


    // Selezione di una zona dal menu a tendina
    $(document).on('click', '.zone-option', function (e) {
        e.preventDefault();
        const selectedZone = $(this).data('value');
        $('#location-input').val(selectedZone);
        $('#zones-dropdown').hide().empty();
    });

    // Chiude il dropdown se si clicca al di fuori della barra di ricerca
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#location-input, #zones-dropdown').length) {
            $('#zones-dropdown').hide();
        }
    });

    // Gestione del logout rapido dalla home
    $(document).on('click', '#btn-index-logout', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('ruolo');
        window.location.href = 'index.html';
    });
});