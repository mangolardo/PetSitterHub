
$(document).ready(function () {
   // const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
        alert("Devi effettuare l'accesso per poter prenotare.");
        window.location.href = "login.html";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idServizio = urlParams.get('id_servizio');

    if (!idServizio) {
        alert("Nessun servizio selezionato.");
        window.location.href = "catalogo.html";
        return;
    }

    // Variabile globale per tenere traccia dello slot selezionato sul calendario
    let selectedAvailabilityId = null;

    // Prepariamo la UI
    setupFormUI();
    loadServiceInfo(idServizio);
    loadAvailabilities(idServizio);

    /**
     * Blocca i campi data in sola lettura e prepara il contenitore del calendario
     */
    function setupFormUI() {
        $('#data-inizio').prop('readonly', true);
        $('#data-fine').prop('readonly', true);

        // Inseriamo il div del calendario dinamicamente subito dopo il nome del servizio
        const calendarHtml = `
            <div class="mb-4">
                <label class="form-label fw-semibold text-coral">Seleziona uno slot dal calendario</label>
                <div id="calendar" class="border rounded p-2 bg-white"></div>
            </div>
        `;
        $('#booking-servizio-text').closest('.mb-4').after(calendarHtml);
    }

    /**
     * Funzione helper per formattare la data per l'input datetime-local (YYYY-MM-DDThh:mm)
     * mantenendo il fuso orario locale corretto.
     */
    function formatForInput(dateObj) {
        const pad = num => (num < 10 ? '0' : '') + num;
        return dateObj.getFullYear() + '-' +
            pad(dateObj.getMonth() + 1) + '-' +
            pad(dateObj.getDate()) + 'T' +
            pad(dateObj.getHours()) + ':' +
            pad(dateObj.getMinutes());
    }

    /**
     * Recupera il nome del servizio
     */
    function loadServiceInfo(id) {
        $.ajax({
            url: `${API_BASE_URL}/services/service/${id}`,
            method: 'GET',
            success: function(servizio) {
                $('#booking-servizio-text').val(`${servizio.tipologia} (${servizio.tipo_animale})`);
            }
        });
    }

    /**
     * Scarica le disponibilità e inizializza FullCalendar
     */
    function loadAvailabilities(id) {
        $.ajax({
            url: `${API_BASE_URL}/availabilities/${id}`,
            method: 'GET',
            success: function (slots) {
                const calendarEvents = [];

                // 1. IL VUOTO DEL DATABASE (GRIGIO)
                // Creiamo un evento di sfondo che copre tutti i giorni della settimana.
                // FullCalendar lo disegnerà sotto agli altri eventi e non sarà cliccabile.
                calendarEvents.push({
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Da domenica (0) a sabato (6)
                    startTime: '00:00',
                    endTime: '24:00',
                    display: 'background',
                    color: '#e9ecef' // Grigio chiaro (Bootstrap 'light' o 'secondary' schiarito)
                });

                // 2. GLI SLOT NEL DATABASE (VERDI O ROSSI)
                slots.forEach(slot => {
                    if (slot.is_disponibile) {
                        // Slot libero nel DB (VERDE)
                        calendarEvents.push({
                            id: slot.id,
                            title: 'Disponibile',
                            start: slot.data_inizio,
                            end: slot.data_fine,
                            color: '#28a745', // Verde Bootstrap
                            classNames: ['slot-cliccabile'],
                            extendedProps: {
                                is_disponibile: true
                            }
                        });
                    } else {
                        // Slot nel DB ma già prenotato da un altro utente (ROSSO)
                        calendarEvents.push({
                            id: slot.id,
                            title: 'Non disponibile',
                            start: slot.data_inizio,
                            end: slot.data_fine,
                            color: '#dc3545', // Rosso Bootstrap (Danger)
                            extendedProps: {
                                is_disponibile: false
                            }
                        });
                    }
                });

                initFullCalendar(calendarEvents);
            },
            error: function () {
                $('#calendar').html('<p class="text-danger p-3">Errore nel caricamento del calendario.</p>');
            }
        });
    }

    /**
     * Inizializzazione di FullCalendar
     */
    function initFullCalendar(events) {
        const calendarEl = document.getElementById('calendar');

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'it',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            height: 500,
            allDaySlot: false,

            // Opzionale: restringe la visualizzazione agli orari lavorativi standard (es. 07:00 - 22:00)
            // nascondendo la notte profonda, dato che nessuno prenota una passeggiata alle 3 di notte
            slotMinTime: '07:00:00',
            slotMaxTime: '22:00:00',

            events: events,

            // COSA SUCCEDE QUANDO L'UTENTE CLICCA UNO SLOT
            eventClick: function(info) {
                // CONTROLLO DI SICUREZZA: Se lo slot è grigio (già occupato), ignoriamo il click!
                if (!info.event.extendedProps.is_disponibile) {
                    return;
                }

                // 1. Resetta il colore di tutti gli eventi disponibili a verde
                calendar.getEvents().forEach(evt => {
                    if (evt.extendedProps.is_disponibile) {
                        evt.setProp('color', '#28a745');
                    }
                });

                // 2. Colora l'evento cliccato di corallo
                info.event.setProp('color', '#FF7F50');

                // 3. Salva l'ID in memoria
                selectedAvailabilityId = info.event.id;

                // 4. Popola i campi input dell'HTML per mostrare il riepilogo
                $('#data-inizio').val(formatForInput(info.event.start));
                $('#data-fine').val(formatForInput(info.event.end));

                // 5. Scroll fluido verso il bottone di conferma
                $('html, body').animate({
                    scrollTop: $("#booking-status").offset().top - 200
                }, 500);
            }
        });

        calendar.render();
    }

    /**
     * Invio del form di prenotazione
     */
    $('#booking-form').on('submit', function (e) {
        e.preventDefault();

        if (!selectedAvailabilityId) {
            alert("Per favore, clicca su uno slot verde nel calendario per selezionare l'orario.");
            return;
        }

        const $btnSubmit = $(this).find('button[type="submit"]');
        const $statusText = $('#booking-status');

        $btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Elaborazione...');
        $statusText.removeClass('text-danger text-success').text('');

        // Chiamata backend passando l'ID della disponibilità selezionata dal calendario
        $.ajax({
            url: `${API_BASE_URL}/bookings/book/${selectedAvailabilityId}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                const idPrenotazione = response.prenotazione.id;

                $statusText.addClass('text-success').text('Slot bloccato con successo! Reindirizzamento al pagamento...');

                setTimeout(() => {
                    window.location.href = `pagamento.html?id_prenotazione=${idPrenotazione}`;
                }, 1500);
            },
            error: function (xhr) {
                let errorMessage = "Si è verificato un errore imprevisto. Riprova più tardi.";
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }

                $statusText.addClass('text-danger').text(errorMessage);
                $btnSubmit.prop('disabled', false).html('<i class="bi bi-credit-card me-1"></i> Conferma e Procedi al Pagamento');
            }
        });
    });
});