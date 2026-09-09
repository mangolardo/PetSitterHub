Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Lista Prenotazioni Proprietario', () => {
  it('dovrebbe caricare e mostrare le prenotazioni nel profilo', () => {

    cy.intercept('GET', '**/api/auth/me*', {
      statusCode: 200,
      body: { id: 1, nome: 'Mario', cognome: 'Rossi', email: 'mario@email.it', zona: 'Milano' }
    }).as('getProfilo');

    cy.intercept('GET', '**/api/messages*', {
      statusCode: 200,
      body: []
    }).as('getMessages');

    cy.intercept('GET', '**/api/bookings*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          data_inizio: '2026-10-15T10:00:00.000Z',
          data_fine: '2026-10-15T11:30:00.000Z',
          nome_servizio: 'Passeggiata',
          nome_professionista: 'Giulia',
          cognome_professionista: 'Rossi',
          importo: 15.00,
          stato: 'confermata'
        }
      ]
    }).as('getBookings');

    cy.visit('http://localhost:3000/profilo.html', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.wait('@getProfilo');
    cy.wait('@getBookings');

    cy.get('#tab-prenotazioni-btn').click();

    cy.get('#lista-prenotazioni').should('contain', 'Giulia');
    cy.get('#lista-prenotazioni').should('contain', 'Passeggiata');
  });
});