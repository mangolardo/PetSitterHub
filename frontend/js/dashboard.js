$(document).ready(function () {
    const SITTERS_API = '${API_BASE_URL}/sitters';
    const AUTH_API = '${API_BASE_URL}/auth';
    const token = localStorage.getItem('token');
    const ruolo = localStorage.getItem('ruolo');
    let currentUserId = null;

    // Protezione rotta: solo i professionisti possono accedere alla dashboard
    if (!token || ruolo !== 'professionista') {
        window.location.href = 'login.html';
        return;
    }

    // Carica profilo e servizi all'avvio
    initDashboard();

    function initDashboard() {
        $.ajax({
            url: `${AUTH_API}/me`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (user) {
                currentUserId = user.id;
                $('#nav-sitter-nome').text(`${user.nome} ${user.cognome}`);
                $('#prof-nome').val(user.nome);
                $('#prof-cognome').val(user.cognome);
                $('#prof-email').val(user.email);

                // Carica i servizi del sitter corrente
                loadMyServices(currentUserId);
            },
            error: function () {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // --- CARICAMENTO SERVIZI NELLA TABELLA ---
    function loadMyServices(sitterId) {
        $.ajax({
            url: `${SITTERS_API}/${sitterId}/services`,
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

    // --- CREAZIONE NUOVO SERVIZIO (POST /api/sitters/services) ---
    $('#form-nuovo-servizio').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            tipologia: $('#serv-tipologia').val(),
            tipo_animale: $('#serv-tipo-animale').val(),
            tariffa: parseFloat($('#serv-tariffa').val()),
            zona: $('#serv-zona').val().trim()
        };

        $.ajax({
            url: `${SITTERS_API}/services`,
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': `Bearer ${token}` },
            data: JSON.stringify(payload),
            success: function (response) {
                showDashboardAlert(response.message || 'Servizio aggiunto!', 'success');
                $('#form-nuovo-servizio')[0].reset();

                // Chiude la modale Bootstrap
                const modalEl = document.getElementById('modalNuovoServizio');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                // Ricarica la lista dei servizi
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
            url: `${SITTERS_API}/servizi/${idServizio}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
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