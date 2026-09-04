$(document).ready(function () {
    const token = localStorage.getItem('token');

    // 1. Controllo Autenticazione: Se non c'è il token, reindirizza al Login
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Configura il Header Authorization per tutte le chiamate AJAX
    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    // 2. Recupera l'ID della disponibilità dall'URL (?id_disponibilita=... oppure ?id_availability=...)
    const urlParams = new URLSearchParams(window.location.search);
    const idDisponibilita = urlParams.get('id_disponibilita') || urlParams.get('id_availability');

    const $status = $("#booking-status");
    const $servizioInput = $("#booking-servizio-text");
    const $dataInizioInput = $("#data-inizio");
    const $dataFineInput = $("#data-fine");
    const $btnSubmit = $("#btn-submit");

    // Se manca l'ID della disponibilità nell'URL, blocca il form
    if (!idDisponibilita) {
        $servizioInput.val("Nessuno slot selezionato");
        $status.text("Nessuna disponibilità selezionata. Torna al catalogo e scegli uno slot.").css("color", "#d95e40");
        return;
    }

    // Formatta la data ISO in un formato leggibile YYYY-MM-DDTHH:mm per gli input datetime-local
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toISOString().slice(0, 16);
    }

    // 3. Carica i dettagli dello slot di disponibilità e del relativo servizio
    $.ajax({
        url: `/api/disponibilita/${idDisponibilita}`,
        method: "GET",
        success: function (slot) {
            const descrizione = `${slot.tipologia || 'Servizio'} - ${slot.tipo_animale || ''} (€${parseFloat(slot.tariffa || 0).toFixed(2)} in ${slot.zona || 'zona'})`;

            $servizioInput.val(descrizione);

            // Popola e blocca le date definite dallo slot
            if (slot.data_inizio) {
                $dataInizioInput.val(formatDateForInput(slot.data_inizio)).prop('readonly', true);
            }
            if (slot.data_fine) {
                $dataFineInput.val(formatDateForInput(slot.data_fine)).prop('readonly', true);
            }

            $btnSubmit.prop('disabled', false);
        },
        error: function (xhr) {
            // Se non esiste la rotta singola per la disponibilità, fallback
            $servizioInput.val(`Slot Disponibilità #${idDisponibilita}`);
            $btnSubmit.prop('disabled', false);
        }
    });

    // 4. Gestione Invio Prenotazione al Backend
    $("#booking-form").on("submit", function (e) {
        e.preventDefault();

        $btnSubmit.prop('disabled', true);
        $status.text("Invio richiesta in corso...").css("color", "green");

        // Chiamata POST all'endpoint definito nel router: /api/prenotazioni/book/:id_availability
        $.ajax({
            url: `/api/prenotazioni/book/${idDisponibilita}`,
            method: "POST",
            contentType: "application/json",
            success: function (response) {
                $status.text("Prenotazione confermata con successo! Reindirizzamento...").css("color", "green");

                const bookingId = response.prenotazione?.id || '';

                setTimeout(function () {
                    window.location.href = `pagamento.html?booking_id=${bookingId}`;
                }, 1200);
            },
            error: function (xhr) {
                $btnSubmit.prop('disabled', false);
                const errorMsg = xhr.responseJSON?.error || xhr.responseJSON?.message || "Errore durante la prenotazione.";
                $status.text(errorMsg).css("color", "#d95e40");
            }
        });
    });
});