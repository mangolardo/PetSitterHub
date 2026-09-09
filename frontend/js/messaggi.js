
$(document).ready(function () {
    const token = localStorage.getItem('token');
 //   let API_BASE_URL = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'http://localhost:3000/api';
    const API_MSG = `${API_BASE_URL}/messages`
    if (!token) return;

    $.ajaxSetup({
        headers: { 'Authorization': 'Bearer ' + token }
    });
const payload = getDecodedTokenPayload();
    const currentUserId = payload.id;
    const currentUserRole = payload.ruolo;

    let activeConversationId = null;

    // Se arrivi da "Contatta Pet Sitter" con un ID nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const idDestinatarioUrl = urlParams.get('id_destinatario');

    if (idDestinatarioUrl) {

        initiateConversation(idDestinatarioUrl);


    } else {
        loadConversations();
    }

    // 1. CARICA LA LISTA DELLE CONVERSAZIONI
    function loadConversations() {
        $.ajax({
            url: API_MSG,
            method: 'GET',
            dataType: 'json',
            success: function (conversations) {
                const $listContainer = $('#lista-conversazioni');
                if (!$listContainer.length) return;

                $listContainer.empty();

                if (!conversations || conversations.length === 0) {
                    $listContainer.html(`
                        <div class="p-4 text-center text-muted">
                            <i class="bi bi-chat-square-dots fs-3 d-block mb-2"></i>
                            Nessuna chat attiva.
                        </div>
                    `);
                    return;
                }

                conversations.forEach(function (c) {
                    const activeClass = (c.id === activeConversationId) ? 'active bg-light' : '';
                    const nomeInterlocutore = c.nome_interlocutore || c.nome || 'Utente';
                    const ultimoMessaggio = c.ultimo_messaggio || 'Nessun messaggio inviato';

                    $listContainer.append(`
                        <a href="#" class="list-group-item list-group-item-action item-chat ${activeClass} p-3" data-id="${c.id}" data-nome="${escapeHtml(nomeInterlocutore)}">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong class="text-dark mb-0">${escapeHtml(nomeInterlocutore)}</strong>
                            </div>
                            <p class="text-secondary small text-truncate mb-0">${escapeHtml(ultimoMessaggio)}</p>
                        </a>
                    `);
                });
            },
            error: function (xhr) {
                console.error("Errore recupero conversazioni:", xhr);
            }
        });
    }

    // 2. AVVIA NUOVA CONVERSAZIONE (SE GIUNTO DA LINK ESTERNO)
    function initiateConversation(idDestinatario) {
        $.ajax({
            url: `${API_MSG}/`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id_destinatario: parseInt(idDestinatario) }),
            success: function (response) {
                activeConversationId = response.id_conversazione;
                loadConversations();
                loadMessages(activeConversationId);
            },
            error: function (xhr) {
                showChatAlert(xhr.responseJSON.error, 'danger')
                loadConversations();
            }
        });
    }

    // 3. SELEZIONE DI UNA CHAT DALLA LISTA
    $(document).on('click', '.item-chat', function (e) {
        e.preventDefault();
        $('.item-chat').removeClass('active bg-light');
        $(this).addClass('active bg-light');

        activeConversationId = $(this).data('id');
        const nomeInterlocutore = $(this).data('nome');

        $('#chat-header').text(nomeInterlocutore || 'Chat');
        loadMessages(activeConversationId);
    });

    // 4. CARICAMENTO MESSAGGI DI UNA CONVERSAZIONE
    function loadMessages(idConversazione) {
        if (!idConversazione) return;

        // Abilita i campi del form
        $('#input-messaggio, #btn-invia-msg').prop('disabled', false);

        $.ajax({
            url: `${API_MSG}/${idConversazione}`,
            method: 'GET',
            dataType: 'json',
            success: function (messages) {
                const $chatBody = $('#chat-body');
                $chatBody.empty();

                if (!messages || messages.length === 0) {
                    $chatBody.html(`
                        <p class="text-muted text-center my-auto py-4">
                            Inizia la conversazione inviando un messaggio.
                        </p>
                    `);
                    return;
                }

                messages.forEach(function (msg) {
                    const isMine = msg.tipo_mittente === currentUserRole;
                    const alignment = isMine ? 'justify-content-end' : 'justify-content-start';
                    const bubbleBg = isMine ? 'bg-success text-white' : 'bg-light text-dark border';

                    const deleteBtn = isMine ? `
                        <button class="btn btn-link btn-sm text-white-50 text-decoration-none btn-delete-msg p-0 ms-2" data-id="${msg.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : '';

                    $chatBody.append(`
                        <div class="d-flex ${alignment} mb-3">
                            <div class="p-3 rounded-4 ${bubbleBg}" style="max-width: 75%;">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <small class="${isMine ? 'text-white-50' : 'text-muted'}" style="font-size: 0.7rem;">
                                        ${formatTime(msg.data_invio || msg.created_at)}
                                    </small>
                                    ${deleteBtn}
                                </div>
                                <p class="mb-0 text-break">${escapeHtml(msg.testo)}</p>
                            </div>
                        </div>
                    `);
                });

                $chatBody.scrollTop($chatBody[0].scrollHeight);
            },
            error: function (xhr) {
                console.error("Errore caricamento messaggi:", xhr);
            }
        });
    }

    // 5. INVIO DI UN MESSAGGIO
    $('#form-invia-messaggio').on('submit', function (e) {
        e.preventDefault();

        if (!activeConversationId) return;

        const $input = $('#input-messaggio');
        const testo = $input.val().trim();

        if (!testo) return;

        $.ajax({
            url: `${API_MSG}/${activeConversationId}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ testo: testo }),
            success: function () {
                $input.val('');
                loadMessages(activeConversationId);
                loadConversations();
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.error || "Errore durante l'invio.");
            }
        });
    });

    // 6. ELIMINAZIONE MESSAGGIO
    $(document).on('click', '.btn-delete-msg', function (e) {
        e.preventDefault();
        const idMessaggio = $(this).data('id');

        if (!confirm('Eliminare questo messaggio?')) return;

        $.ajax({
            url: `${API_MSG}/message/${idMessaggio}`,
            method: 'DELETE',
            success: function () {
                loadMessages(activeConversationId);
                loadConversations();
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.error || "Errore durante l'eliminazione.");
            }
        });
    });

    // UTILS
    function escapeHtml(text) {
        return $('<div>').text(text || '').html();
    }

    function formatTime(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }

    function getDecodedTokenPayload() {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

});
function showChatAlert(message, type) {
    const $alert = $('#alert-message');
    if ($alert.length) {
        $alert.removeClass('d-none alert-success alert-danger alert-info')
            .addClass(`alert-${type}`)
            .text(message);
        setTimeout(() => $alert.addClass('d-none'), 4000);
    }
}