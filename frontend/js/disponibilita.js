//const API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
let calendarInstance = null;
let modalCalendarInstance = null;

$(document).ready(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    let sitterId = urlParams.get('id_professionista');

    // Se non è specificato nell'URL, recupera l'ID del professionista loggato tramite /auth/me
    if (!sitterId) {
        try {
            const token = localStorage.getItem('token');
            const response = await $.ajax({
                url: `${API_BASE_URL}/auth/me`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            sitterId = response.id;
        } catch (err) {
            console.error('Errore nel recupero dell\'utente corrente:', err);
        }
    }

    // Inizializza il calendario principale quando viene mostrata la tab "Disponibilità"
    $('#tab-calendario-btn').on('shown.bs.tab', function () {
        if (!calendarInstance) {
            initMainCalendar(sitterId);
        } else {
            calendarInstance.render();
            calendarInstance.refetchEvents();
        }
    });

    // Gestione invio form creazione nuova disponibilità
    $('#form-crea-disponibilita').on('submit', handleAddAvailability);

    // Gestione apertura modale gestione disponibilità da singola riga servizio
    $('#modalDisponibilita').on('shown.bs.modal', function () {
        if (modalCalendarInstance) {
            modalCalendarInstance.render();
            modalCalendarInstance.refetchEvents();
        }
    });
});

/**
 * Recupera l'elenco dei servizi del professionista interrogando /services/:id
 * e popola la Select nel modale di creazione.
 */
async function loadSitterServicesForSelect(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/services/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Impossibile caricare i servizi.');

        const servizi = await response.json();
        const $select = $('#disp-servizio-select');

        $select.empty().append('<option value="" selected disabled>Seleziona un servizio...</option>');

        servizi.forEach(servizio => {
            $select.append(`
                <option value="${servizio.id}">
                    ${servizio.tipologia} - ${servizio.tipo_animale} (${servizio.zona})
                </option>
            `);
        });
    } catch (error) {
        console.error('Errore durante il caricamento dei servizi per la select:', error);
    }
}

/**
 * Inizializza il calendario principale nella tab Disponibilità.
 */
function initMainCalendar(id) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Popola le opzioni della select dei servizi nel modale se l'ID è valido
    if (id) {
        loadSitterServicesForSelect(id);
    }

    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        selectable: true,
        selectMirror: true,

        // Selezione/Trascrizione di date per creare un nuovo slot
        select: function (info) {
            openCreateModal(info.startStr, info.endStr);
        },

        // Click su uno slot esistente per eliminarlo
        eventClick: function (info) {
            deleteAvailability(info.event.id);
        },

        // Caricamento eventi interrogando l'endpoint /services/:id del professionista
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const token = localStorage.getItem('token');

                if (!id) {
                    successCallback([]);
                    return;
                }

                // 1. Recupera i servizi del professionista tramite l'endpoint corretto
                const resServizi = await fetch(`${API_BASE_URL}/services/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!resServizi.ok) {
                    successCallback([]);
                    return;
                }

                const servizi = await resServizi.json();
                let allEvents = [];

                // 2. Per ciascun servizio recupera le relative disponibilità
                for (const serv of servizi) {
                    const resDisp = await fetch(`${API_BASE_URL}/availabilities/${serv.id}`);
                    if (resDisp.ok) {
                        const dispList = await resDisp.json();
                        const mappedEvents = dispList.map(item => ({
                            id: item.id,
                            title: `${serv.tipologia} (${serv.tipo_animale})`,
                            start: item.data_inizio,
                            end: item.data_fine,
                            backgroundColor: '#20c997',
                            borderColor: '#198754',
                            textColor: '#ffffff'
                        }));
                        allEvents = allEvents.concat(mappedEvents);
                    }
                }

                successCallback(allEvents);
            } catch (err) {
                console.error('Errore nel caricamento eventi calendario:', err);
                failureCallback(err);
            }
        }
    });

    calendarInstance.render();
}

/**
 * Apre il modale per la creazione di un nuovo slot impostando le date pre-selezionate.
 */
function openCreateModal(startIso, endIso) {
    const formatForInput = (isoStr) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        const pad = (num) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    $('#disp-inizio-input').val(formatForInput(startIso));
    $('#disp-fine-input').val(formatForInput(endIso));

    const modalEl = document.getElementById('modalCreaDisponibilita');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

/**
 * Handler per l'invio del form di creazione nuova disponibilità.
 */
async function handleAddAvailability(e) {
    e.preventDefault();

    const idServizio = $('#disp-servizio-select').val();
    const dataInizio = $('#disp-inizio-input').val();
    const dataFine = $('#disp-fine-input').val();

    if (!idServizio) {
        alert('Seleziona prima un servizio.');
        return;
    }

    if (new Date(dataInizio) >= new Date(dataFine)) {
        alert('La data di fine deve essere successiva alla data di inizio.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/availabilities/${idServizio}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data_inizio: dataInizio,
                data_fine: dataFine
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Errore durante l\'aggiunta della disponibilità.');
        }

        const modalEl = document.getElementById('modalCreaDisponibilita');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        $('#form-crea-disponibilita')[0].reset();

        if (calendarInstance) {
            calendarInstance.refetchEvents();
        }
        if (modalCalendarInstance) {
            modalCalendarInstance.refetchEvents();
        }

        showAlert('Disponibilità salvata con successo!', 'success');
    } catch (error) {
        console.error('Errore addAvailability:', error);
        alert(error.message);
    }
}

/**
 * Cancella uno slot di disponibilità previa conferma dell'utente.
 */
async function deleteAvailability(idDisponibilita) {
    if (!confirm('Sei sicuro di voler rimuovere questa disponibilità?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/availabilities/${idDisponibilita}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Errore durante l\'eliminazione della disponibilità.');
        }

        if (calendarInstance) {
            calendarInstance.refetchEvents();
        }
        if (modalCalendarInstance) {
            modalCalendarInstance.refetchEvents();
        }

        showAlert('Disponibilità rimossa con successo.', 'info');
    } catch (error) {
        console.error('Errore deleteAvailability:', error);
        alert(error.message);
    }
}

/**
 * Funzione di utilità per inizializzare il calendario all'interno del modale dedicato al singolo servizio.
 */
function openModalForService(idServizio, titoloServizio) {
    $('#disp-servizio-id').val(idServizio);
    if (titoloServizio) {
        $('#modalDisponibilitaLabel').text(`Gestione Disponibilità - ${titoloServizio}`);
    }

    const calendarEl = document.getElementById('modal-calendar');
    if (!calendarEl) return;

    if (modalCalendarInstance) {
        modalCalendarInstance.destroy();
    }

    modalCalendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        selectable: true,
        select: function (info) {
            $('#disp-servizio-select').val(idServizio);
            openCreateModal(info.startStr, info.endStr);
        },
        eventClick: function (info) {
            deleteAvailability(info.event.id);
        },
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const response = await fetch(`${API_BASE_URL}/disponibilita/${idServizio}`);
                if (!response.ok) throw new Error('Errore nel recupero delle disponibilità');

                const dispList = await response.json();
                const events = dispList.map(item => ({
                    id: item.id,
                    title: 'Disponibile',
                    start: item.data_inizio,
                    end: item.data_fine,
                    backgroundColor: '#20c997',
                    borderColor: '#198754'
                }));

                successCallback(events);
            } catch (err) {
                failureCallback(err);
            }
        }
    });

    const modalEl = document.getElementById('modalDisponibilita');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

/**
 * Mostra un messaggio di avviso nell'alert globale della dashboard.
 */
function showAlert(message, type = 'success') {
    const $alert = $('#alert-message');
    if ($alert.length) {
        $alert
            .removeClass('d-none alert-success alert-danger alert-info alert-warning')
            .addClass(`alert-${type}`)
            .text(message);

        setTimeout(() => {
            $alert.addClass('d-none');
        }, 4000);
    }
}