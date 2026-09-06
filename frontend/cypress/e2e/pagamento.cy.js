// Ignoriamo gli errori di console
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso di Checkout e Pagamento', () => {
  it('dovrebbe validare la carta e simulare il pagamento', () => {

    // 1. Togliamo le parentesi quadre: passiamo un OGGETTO singolo!
    cy.intercept('GET', '**/bookings/*', {
      statusCode: 200,
      body: {
        id: 1,
        sitterName: 'Marco Rossi',
        servizio: 'Passeggiata Cane',
        data: '15 Ottobre 2026',
        orario: '10:00 - 11:30',
        zona: 'Milano Centro',
        totale: 35.00
      }
    }).as('getBookingData');

    cy.intercept('POST', '**/payment*', {
      statusCode: 200,
      body: { success: true, message: 'Pagamento e prenotazione confermati!' }
    }).as('submitPayment');

    cy.visit('./pagamento.html?id=1', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;

        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.url().should('include', 'pagamento.html');

    // 2. FONDAMENTALE: Aspettiamo che il frontend abbia ricevuto e renderizzato i dati prima di muoverci!
    cy.wait('@getBookingData');

    // 3. Compiliamo i campi in modo naturale (lasciamo fare gli spazi al JS!)
    cy.get('#methodCard').check({ force: true });

    cy.get('#cardHolder').type('Mario Rossi');
    cy.get('#cardNumber').type('1234567812346767'); // Senza spazi
    cy.get('#cardExpiry').type('1226');             // Senza barra
    cy.get('#cardCvv').type('123');

    // 4. Clicchiamo in un punto vuoto della pagina per simulare che abbiamo "finito di scrivere"
    cy.get('body').click();

    // Diamo mezzo secondo al JS per sbloccare il bottone
    cy.wait(500);

    // 5. Il bottone ora dovrebbe essersi sbloccato da solo
    cy.get('#btnSubmitPayment').should('not.be.disabled').click();

    cy.wait('@submitPayment');
  });
});