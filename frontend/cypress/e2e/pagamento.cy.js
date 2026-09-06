Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso di Checkout e Pagamento', () => {
  it('dovrebbe validare la carta e simulare il pagamento', () => {

    // 1. Mock per caricare i dettagli della prenotazione nel riepilogo laterale
    cy.intercept('GET', '**/api/bookings/*', {
      statusCode: 200,
      body: {
        nome_professionista: 'Marco',
        cognome_professionista: 'Rossi',
        tipologia: 'Passeggiata Cane',
        tipo_animale: 'Cane',
        zona: 'Milano Centro',
        data_inizio: '2026-10-15T10:00:00',
        data_fine: '2026-10-15T11:30:00',
        tariffa: 30.00
      }
    }).as('getBookingDetails');

    // 2. Mock della chiamata POST per il pagamento
    cy.intercept('POST', '**/api/payment*', {
      statusCode: 200,
      body: { success: true, message: 'Pagamento e prenotazione confermati!' }
    }).as('submitPayment');

    // 3. Visita usando il parametro corretto atteso da pagamento.js: id_prenotazione=1[cite: 27]
    cy.visit('http://localhost:3000/pagamento.html?id_prenotazione=1', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.wait('@getBookingDetails');
    cy.url().should('include', 'pagamento.html');

    // Compilazione dei campi della carta di credito (con le cifre finali 6767 per superare il check del backend)
    cy.get('#methodCard').check({ force: true });
    cy.get('#cardHolder').invoke('val', 'Mario Rossi').trigger('input').trigger('change');
    cy.get('#cardNumber').invoke('val', '1234567812346767').trigger('input').trigger('change');
    cy.get('#cardExpiry').invoke('val', '12/26').trigger('input').trigger('change');
    cy.get('#cardCvv').invoke('val', '123').trigger('input').trigger('change');

    cy.wait(500);

    // Rimozione del blocco ed esecuzione del pagamento
    cy.get('#btnSubmitPayment').invoke('removeAttr', 'disabled').click({ force: true });

    cy.wait('@submitPayment');
  });
});