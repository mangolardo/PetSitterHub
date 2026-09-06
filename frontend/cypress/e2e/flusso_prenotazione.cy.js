Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso Creazione Prenotazione', () => {
  it('dovrebbe permettere a un proprietario di prenotare un servizio', () => {

    // 1. Mock del dettaglio servizio
    cy.intercept('GET', '**/api/services/service/*', {
      statusCode: 200,
      body: { id: 101, tipologia: 'Passeggiata', tipo_animale: 'Cane', nomeSitter: 'Giulia' }
    }).as('getService');

    // 2. Mock delle disponibilità con una data nella settimana corrente (Settembre 2026)
    cy.intercept('GET', '**/api/availabilities/*', {
      statusCode: 200,
      body: [
        {
          id: 55,
          is_disponibile: true,
          data_inizio: '2026-09-07T10:00:00',
          data_fine: '2026-09-07T11:30:00'
        }
      ]
    }).as('getAvailabilities');

    // 3. Mock della chiamata POST per bloccare lo slot
    cy.intercept('POST', '**/api/bookings/book/*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Disponibilita prenotata',
        prenotazione: { id: 99 }
      }
    }).as('creaPrenotazione');

    // Visita alla pagina di prenotazione
    cy.visit('http://localhost:3000/prenotazione.html?id_servizio=101', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.wait('@getService');
    cy.wait('@getAvailabilities');
    cy.url().should('include', 'prenotazione.html');

    // Breve pausa per permettere a FullCalendar di renderizzare l'evento nel DOM
    cy.wait(600);

    // Clicchiamo sullo slot verde visibile nel calendario
    cy.get('.slot-cliccabile').first().click({ force: true });

    // Verifichiamo che il click abbia popolato automaticamente i campi data
    cy.get('#data-inizio').should('not.have.value', '');

    // Clicchiamo sul bottone di conferma del form
    cy.get('#booking-form button[type="submit"]').invoke('removeAttr', 'disabled').click({ force: true });

    cy.wait('@creaPrenotazione');

    // Verifica del reindirizzamento al pagamento con l'ID corretto
    cy.url().should('include', 'pagamento.html?id_prenotazione=99');
  });
});