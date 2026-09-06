Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso di Messaggistica e Chat', () => {
  it('dovrebbe permettere di selezionare una conversazione e inviare un messaggio', () => {

    // Mock per la verifica utente
    cy.intercept('GET', '**/api/auth/me*', {
      statusCode: 200,
      body: { id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'proprietario' }
    }).as('getMe');

    // Mock della lista conversazioni
    cy.intercept('GET', '**/api/messages', {
      statusCode: 200,
      body: [
        {
          id: 10,
          nome_interlocutore: 'Marco Bianchi',
          ultimo_messaggio: 'Ci vediamo domani alle 10!'
        }
      ]
    }).as('getConversations');

    // Mock dei messaggi interni alla conversazione 10
    cy.intercept('GET', '**/api/messages/10', {
      statusCode: 200,
      body: [
        {
          id: 100,
          id_mittente: 2, // Inviato dall'altra persona
          testo: 'Ci vediamo domani alle 10!',
          created_at: '2026-09-06T10:00:00Z'
        }
      ]
    }).as('getMessages');

    // Mock dell'invio di un nuovo messaggio
    cy.intercept('POST', '**/api/messages/10', {
      statusCode: 201,
      body: {
        id: 101,
        id_mittente: 1,
        testo: 'Perfetto, a domani!',
        created_at: '2026-09-06T10:05:00Z'
      }
    }).as('sendMessage');

    // Apriamo la pagina del profilo (dove si trova la tab della chat)
    cy.visit('http://localhost:3000/profilo.html', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.wait('@getMe');

    // Clicchiamo sulla tab dei messaggi/chat nel profilo
    cy.get('#tab-servizi-btn').click(); // Nel tuo HTML la tab chat ha id="tab-servizi-btn"
    cy.wait('@getConversations');

    // Selezioniamo la conversazione dalla lista
    cy.get('.item-chat[data-id="10"]').click();
    cy.wait('@getMessages');

    // Verifichiamo che il messaggio precedente sia visibile
    cy.get('#chat-body').should('contain', 'Ci vediamo domani alle 10!');

    // Digitiamo e inviamo un nuovo messaggio
    cy.get('#input-messaggio').type('Perfetto, a domani!');
    cy.get('#btn-invia-msg').click();

    cy.wait('@sendMessage');
  });
});