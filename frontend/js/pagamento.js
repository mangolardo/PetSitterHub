//const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
$(document).ready(function () {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Configura i parametri globali per le chiamate AJAX
    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    // 2. Lettura parametri URL (?booking_id=123 o ?id_prenotazione=123)
    const urlParams = new URLSearchParams(window.location.search);
    const idPrenotazione = urlParams.get('booking_id') || urlParams.get('id_prenotazione');

    const $alert = $('#paymentAlert');
    const $btn = $('#btnSubmitPayment');

    if (!idPrenotazione) {
        $alert.removeClass('d-none alert-success')
              .addClass('alert-danger')
              .html('<i class="bi bi-exclamation-triangle-fill me-2"></i>Nessuna prenotazione specificata. Torna al catalogo.');
        $btn.prop('disabled', true);
        return;
    }

    let importoTotale = 35.00; // Valore di default/fallback

    // 3. Caricamento Dettagli Prenotazione per il riepilogo
    $.ajax({
        url: `${API_BASE_URL}/bookings/${idPrenotazione}`,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            const p = Array.isArray(data) ? data[0] : data;

            if (!p) {
                $alert.removeClass('d-none alert-success').addClass('alert-danger').text('Dati prenotazione non trovati.');
                return;
            }

            const nomeSitter = `${p.nome_professionista || p.nome || 'Pet'} ${p.cognome_professionista || p.cognome || 'Sitter'}`.trim();
            const servizio = `${p.tipologia || 'Servizio'} (${p.tipo_animale || 'Pet'})`;
            const zona = p.zona || 'N.D.';

            let dataFormattata = 'N.D.';
            let orarioFormattato = 'N.D.';

            if (p.data_inizio && p.data_fine) {
                const dInizio = new Date(p.data_inizio);
                const dFine = new Date(p.data_fine);

                dataFormattata = dInizio.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
                orarioFormattato = `${dInizio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${dFine.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
            }

            const tariffaBase = parseFloat(p.tariffa || 30.00);
            const commissioni = 5.00;
            importoTotale = tariffaBase + commissioni;

            $('#summarySitterName').text(nomeSitter);
            $('#summaryService').text(servizio);
            $('#summaryDate').text(dataFormattata);
            $('#summaryTime').text(orarioFormattato);
            $('#summaryZone').text(zona);
            $('#summaryTotal, #btnAmount').text(`€${importoTotale.toFixed(2)}`);
        },
        error: function (xhr) {
            console.warn("Impossibile caricare i dettagli della prenotazione. Si usano i dati standard.", xhr);
        }
    });

    // 4. Gestione cambio Metodo di Pagamento
    $('input[name="paymentMethod"]').on('change', function () {
        if ($(this).val() === 'paypal') {
            $('#cardSection').addClass('d-none');
            $('#paypalSection').removeClass('d-none');
            $('#cardHolder, #cardNumber, #cardExpiry, #cardCvv').removeAttr('required');
        } else {
            $('#paypalSection').addClass('d-none');
            $('#cardSection').removeClass('d-none');
            $('#cardHolder, #cardNumber, #cardExpiry, #cardCvv').attr('required', true);
        }
    });

    // Maschere di formattazione input
    $('#cardNumber').on('input', function () {
        let val = $(this).val().replace(/\D/g, '').substring(0, 16);
        $(this).val(val.replace(/(.{4})/g, '$1 ').trim());
    });

    $('#cardExpiry').on('input', function () {
        let val = $(this).val().replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        $(this).val(val);
    });

    $('#cardCvv').on('input', function () {
        $(this).val($(this).val().replace(/\D/g, ''));
    });

    // 5. Invio Form e Chiamata POST /api/payment
    $('#paymentForm').on('submit', function (e) {
        e.preventDefault();

        const selectedMethod = $('input[name="paymentMethod"]:checked').val();
        $alert.addClass('d-none').removeClass('alert-danger alert-success').text('');

        let numeroCartaVal = '';

        if (selectedMethod === 'card') {
            const holder = $('#cardHolder').val().trim();
            numeroCartaVal = $('#cardNumber').val().replace(/\s/g, '');
            const expiry = $('#cardExpiry').val();
            const cvv = $('#cardCvv').val();

            if (!holder || numeroCartaVal.length < 16 || expiry.length < 5 || cvv.length < 3) {
                $alert.removeClass('d-none')
                      .addClass('alert-danger')
                      .html('<i class="bi bi-exclamation-triangle-fill me-2"></i>Inserisci tutti i dati della carta in modo corretto.');
                return;
            }
        } else {
            numeroCartaVal = '4000000000006767';
        }

        // Blocco pulsante per evitare invi multipli durante la simulazione backend di 2 secondi
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Elaborazione pagamento in corso...');

        const payload = {
            id_prenotazione: parseInt(idPrenotazione),
            importo: parseFloat(importoTotale.toFixed(2)),
            metodo: selectedMethod === 'paypal' ? 'paypal' : 'carta',
            numero_carta: numeroCartaVal
        };

        $.ajax({
            url: `${API_BASE_URL}/payment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                $alert.removeClass('d-none')
                      .addClass('alert-success')
                      .html(`<i class="bi bi-check-circle-fill me-2"></i>${response.message || 'Pagamento e prenotazione confermati!'}`);

                // Reindirizzamento al profilo/dashboard utente dopo l'esito positivo
                setTimeout(function () {
                    window.location.href = 'profilo.html';
                }, 1800);
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html(`<i class="bi bi-lock-fill me-2"></i> Paga Ora <span id="btnAmount">€${importoTotale.toFixed(2)}</span>`);

                let errorMsg = 'Errore durante l\'elaborazione del pagamento.';
                if (xhr.responseJSON) {
                    errorMsg = xhr.responseJSON.error || xhr.responseJSON.message || errorMsg;
                }

                $alert.removeClass('d-none')
                      .addClass('alert-danger')
                      .html(`<i class="bi bi-exclamation-triangle-fill me-2"></i>${errorMsg}`);
            }
        });
    });
});