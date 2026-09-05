//const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
$(document).ready(function () {
    const SITTERS_API = `${API_BASE_URL}/sitters`;
    const REVIEWS_API = `${API_BASE_URL}/reviews`;
    const token = localStorage.getItem('token');
    const ruolo = localStorage.getItem('ruolo');
    let currentUserId = null;

    // Protezione rotta: solo i professionisti possono accedere alla dashboard
    if (!token || ruolo !== 'professionista') {
        window.location.href = 'login.html';
        return;
    }

    // Carica profilo, servizi e recensioni all'avvio
    initDashboard();

    function initDashboard() {
        $.ajax({
            url: `${API_BASE_URL}/auth/me`,
            method: 'GET',
            //headers: { 'Authorization': `Bearer ${token}` },
            success: function (user) {
                currentUserId = user.id;
                $('#nav-sitter-nome').text(`${user.nome} ${user.cognome}`);
                $('#summary-nome').text(user.nome || '—');
                $('#summary-cognome').text(user.cognome || '—');
                $('#summary-email').text(user.email || '—');;

                // Carica i dati del professionista corrente
                loadMyServices(currentUserId);
                loadMyReviews(currentUserId); // <-- Richiamo caricamento recensioni
            },
            error: function () {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    //Event Listener: Ricarica le recensioni quando si clicca sulla tab dedicata
        $('#tab-recensioni-btn').on('click', function () {
            if (currentUserId) {
                loadMyReviews(currentUserId);
            }
        });

    // --- CARICAMENTO RECENSIONI (GET /api/reviews/:id_professionista) ---
    function loadMyReviews(sitterId) {
            const $container = $('#lista-recensioni');
            $container.html('<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Caricamento recensioni...</div>');

            $.ajax({
                url: `${REVIEWS_API}/${sitterId}`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                success: function (recensioni) {
                    $container.empty();

                    if (!recensioni || recensioni.length === 0) {
                        $container.html(`
                            <div class="dash-card p-4 text-center text-muted">
                                <i class="bi bi-star fs-1 d-block mb-2 text-secondary"></i>
                                Nessuna recensione ricevuta al momento.
                            </div>
                        `);
                        return;
                    }

                    recensioni.forEach(function (rev) {
                        const stelleHtml = renderStars(rev.valutazione || rev.stelle || 0);
                        const dataFormattata = rev.data_creazione
                            ? new Date(rev.data_creazione).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '';

                        const cardHtml = `
                            <div class="dash-card p-3 shadow-sm border-0 rounded-3 mb-3 bg-white">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-person-circle fs-4 text-secondary"></i>
                                        <strong class="text-dark">${escapeHtml(rev.nome_cliente || rev.autore || 'Cliente')}</strong>
                                        <span class="ms-2">${stelleHtml}</span>
                                    </div>
                                    <small class="text-muted">${dataFormattata}</small>
                                </div>
                                <p class="mb-0 text-secondary ps-1">${escapeHtml(rev.testo || rev.commento || '')}</p>
                            </div>
                        `;
                        $container.append(cardHtml);
                    });
                },
                error: function (xhr) {
                    $container.html('<div class="text-center py-4 text-danger">Impossibile caricare le recensioni.</div>');
                    showDashboardAlert(xhr.responseJSON?.error || 'Errore nel caricamento delle recensioni', 'danger');
                }
            });
        }

        // Helper per generare le stelle del rating
        function renderStars(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="bi bi-star-fill text-warning me-1"></i>';
                } else {
                    stars += '<i class="bi bi-star text-muted opacity-50 me-1"></i>';
                }
            }
            return stars;
        }

    // --- CARICAMENTO SERVIZI NELLA TABELLA ---
    function loadMyServices(sitterId) {
        $.ajax({
            url: `${API_BASE_URL}/services/${sitterId}`,
            method: 'GET',
            success: function (servizi) {
                const $tbody = $('#lista-servizi');
                $tbody.empty();

                if (!servizi || servizi.length === 0) {
                    $tbody.html('<tr><td colspan="6" class="text-center py-4 text-muted">Nessun servizio inserito.</td></tr>');
                    return;
                }

                servizi.forEach(function (servizio) {
                    const row = `
                        <tr>
                            <td><strong>${escapeHtml(servizio.tipologia)}</strong></td>
                            <td>${escapeHtml(servizio.tipo_animale)}</td>
                            <td>${escapeHtml(servizio.zona)}</td>
                            <td>€ ${parseFloat(servizio.tariffa).toFixed(2)}</td>
                            <td><span class="badge bg-success">Attivo</span></td>
                            <td class="text-end">
                                <button class="btn btn-outline-danger btn-sm btn-delete-service" data-id="${servizio.id}">
                                    <i class="bi bi-trash"></i> Elimina
                                </button>
                            </td>
                        </tr>
                    `;
                    $tbody.append(row);
                });
            },
            error: function (xhr) {
                showDashboardAlert(xhr.responseJSON?.error || 'Errore nel caricamento dei servizi', 'danger');
            }
        });
    }

    // --- CREAZIONE NUOVO SERVIZIO (POST /api/services) ---
    $('#form-nuovo-servizio').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            tipologia: $('#serv-tipologia').val(),
            tipo_animale: $('#serv-tipo-animale').val(),
            tariffa: parseFloat($('#serv-tariffa').val()),
            zona: $('#serv-zona').val().trim()
        };

        $.ajax({
            url: `${API_BASE_URL}/services/`,
            method: 'POST',
            contentType: 'application/json',
            //headers: { 'Authorization': `Bearer ${token}` },
            data: JSON.stringify(payload),
            success: function (response) {
                showDashboardAlert(response.message || 'Servizio aggiunto!', 'success');
                $('#form-nuovo-servizio')[0].reset();

                const modalEl = document.getElementById('modalNuovoServizio');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                loadMyServices(currentUserId);
            },
            error: function (xhr) {
                showDashboardAlert(xhr.responseJSON?.error || 'Errore nella creazione del servizio', 'danger');
            }
        });
    });

    // --- ELIMINAZIONE SERVIZIO (DELETE) ---
    $(document).on('click', '.btn-delete-service', function () {
        const idServizio = $(this).data('id');
        if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return;

        $.ajax({
            url: `${API_BASE_URL}/services/${idServizio}`,
            method: 'DELETE',
            //headers: { 'Authorization': `Bearer ${token}` },
            success: function (response) {
                showDashboardAlert(response.message || 'Servizio eliminato', 'success');
                loadMyServices(currentUserId);
            },
            error: function (xhr) {
                showDashboardAlert(xhr.responseJSON?.error || 'Errore durante l\'eliminazione', 'danger');
            }
        });
    });

    // Helper Alert
    function showDashboardAlert(message, type) {
        const $alert = $('#alert-message');
        if ($alert.length) {
            $alert.removeClass('d-none alert-success alert-danger alert-info')
                  .addClass(`alert-${type}`)
                  .text(message);
            setTimeout(() => $alert.addClass('d-none'), 4000);
        }
    }

    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }
});