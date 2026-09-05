$(document).ready(function () {
    // Carica le prenotazioni all'avvio o quando l'utente clicca sulla scheda Prenotazioni
    caricaPrenotazioni();

    $('#tab-prenotazioni-btn').on('click', function () {
        caricaPrenotazioni();
    });
});

/**
prte del profilo utente e dashboard
 * Funzione per recuperare la lista delle prenotazioni dal backend e popolarne la tabella
 */
function caricaPrenotazioni() {
    const token = localStorage.getItem('token'); // Recupera il JWT memorizzato

    if (!token) {
        $('#lista-prenotazioni').html(`
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-circle me-1"></i> Utente non autenticato. Effettua il login.
                </td>
            </tr>
        `);
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/prenotazioni`, // Modifica l'endpoint se la tua rotta ha un prefisso diverso
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (prenotazioni) {
            const $tbody = $('#lista-prenotazioni');
            $tbody.empty();

            if (!prenotazioni || prenotazioni.length === 0) {
                $tbody.html(`
                    <tr>
                        <td colspan="5" class="text-center py-4 text-muted">
                            Nessuna prenotazione trovata.
                        </td>
                    </tr>
                `);
                return;
            }

            // Popola ogni riga della tabella
            prenotazioni.forEach(function (p) {
                // Formattazione data e ora locale
                const dataInizio = p.data_inizio ? new Date(p.data_inizio).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-';
                const dataFine = p.data_fine ? new Date(p.data_fine).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-';

                // Gestione dei campi restituite dalle query (ad es. tipologia servizio, controparte, importo/tariffa)
                const servizio = p.tipologia_servizio || p.servizio || p.tipologia || 'Servizio';
                const controparte = p.nome_controparte ? `${p.nome_controparte} ${p.cognome_controparte || ''}` : (p.professionista || p.proprietario || '-');
                const importo = p.importo || p.tariffa ? `€ ${parseFloat(p.importo || p.tariffa).toFixed(2)}` : '-';

                // Badge opzionale per lo stato della prenotazione
                let statoBadge = '';
                if (p.stato) {
                    const badgeClass = {
                        'in_attesa': 'bg-warning text-dark',
                        'confermata': 'bg-success',
                        'rifiutata': 'bg-danger',
                        'completata': 'bg-info text-dark',
                        'annullata': 'bg-secondary'
                    }[p.stato] || 'bg-secondary';

                    statoBadge = `<span class="badge ${badgeClass} ms-2">${p.stato.replace('_', ' ')}</span>`;
                }

                const rigaHtml = `
                    <tr>
                        <td><span class="fw-semibold">${servizio}</span> ${statoBadge}</td>
                        <td>${dataInizio}</td>
                        <td>${dataFine}</td>
                        <td>${controparte}</td>
                        <td class="fw-bold">${importo}</td>
                    </tr>
                `;

                $tbody.append(rigaHtml);
            });
        },
        error: function (xhr) {
            console.error('Errore durante il recupero delle prenotazioni:', xhr);
            const msgErrore = xhr.responseJSON && xhr.responseJSON.error
                ? xhr.responseJSON.error
                : 'Si è verificato un errore durante il caricamento delle prenotazioni.';

            $('#lista-prenotazioni').html(`
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle me-1"></i> ${msgErrore}
                    </td>
                </tr>
            `);
        }
    });
}