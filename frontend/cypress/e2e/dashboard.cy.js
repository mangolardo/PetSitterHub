Cypress.on('uncaught:exception', (err, runnable) => {
  return false; // Ignora errori JS interni della pagina
});

describe('Dashboard Pet-Sitter e Chat', () => {
  it('dovrebbe caricare i dati dell\'utente, le prenotazioni e gestire la sezione chat', () => {

    // Mocks di rete per le API sulla porta 3000
    cy.intercept('GET', '**/api/auth/me*', {
      statusCode: 200,
      body: { id: 1, nome: 'Giulia', cognome: 'Rossi', email: 'giulia@email.it', ruolo: 'professionista' }
    }).as('getProfilo');

    cy.intercept('GET', '**/api/services/*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/reviews/*', { statusCode: 200, body: [] });

    cy.intercept('GET', '**/api/bookings*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          data_inizio: '2026-10-15T10:00:00.000Z',
          data_fine: '2026-10-15T11:30:00.000Z',
          nome_servizio: 'Passeggiata',
          nome_proprietario: 'Mario',
          cognome_proprietario: 'Verdi',
          importo: 20.00,
          stato: 'confermata'
        }
      ]
    }).as('getBookings');

    // Mock degli endpoint relativi alla chat del professionista
    cy.intercept('GET', '**/api/messages', {
      statusCode: 200,
      body: [
        {
          id: 10,
          nome_interlocutore: 'Mario Verdi',
          ultimo_messaggio: 'Salve, vorrei informazioni per il cane.'
        }
      ]
    }).as('getConversations');

    cy.intercept('GET', '**/api/messages/10', {
      statusCode: 200,
      body: [
        {
          id: 100,
          id_mittente: 1, // Messaggio inviato dal professionista loggato
          testo: 'Buongiorno Mario, dimmi pure!',
          created_at: '2026-09-09T10:00:00.000Z'
        }
      ]
    }).as('getMessagesDetail');

    cy.intercept('POST', '**/api/messages/10', {
      statusCode: 201,
      body: { message: 'Messaggio inviato con successo' }
    }).as('sendMessage');

    // Visita alla dashboard del professionista
    cy.visit('http://localhost:3000/dashboard.html', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'professionista', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'professionista');
      }
    });
    cy.url().should('include', 'dashboard.html');
    cy.wait('@getProfilo');

    // Test tab Prenotazioni
    cy.get('#tab-prenotazioni-btn').click();
    cy.wait('@getBookings');
    cy.get('#lista-prenotazioni').should('contain', 'Mario');
    cy.get('#lista-prenotazioni').should('contain', 'Passeggiata');

    // Test tab Messaggi / Chat del professionista
    cy.get('#tab-messaggi-btn').click();
    cy.wait('@getConversations');

    // Verifica che la conversazione con il proprietario compaia in lista e cliccala
    cy.get('#lista-conversazioni').should('contain', 'Mario Verdi');
    cy.get('.item-chat').first().click();

    cy.wait('@getMessagesDetail');
    cy.get('#chat-body').should('contain', 'Buongiorno Mario, dimmi pure!');

    // Invio di un nuovo messaggio all'interno della chat
    cy.get('#input-messaggio').should('not.be.disabled').type('Certamente, a che ora preferisci?');
    cy.get('#btn-invia-msg').click();
    cy.wait('@sendMessage');
  });
});