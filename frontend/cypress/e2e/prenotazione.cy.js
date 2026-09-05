describe('Flusso di Prenotazione', () => {
  beforeEach(() => {
    cy.visit('./prenotazione.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'token-valido-di-prova');
      }
    });
  });

  it('dovrebbe permettere di richiedere un servizio', () => {
    // Mock API servizi
    cy.intercept('GET', '/api/servizi', {
      statusCode: 200,
      body: [
        { id: 1, tipologia: 'Passeggiata', tipo_animale: 'Cane', tariffa: '15.00', zona: 'Milano' }
      ]
    }).as('getServizi');

    // Mock API prenotazione
    cy.intercept('POST', '/api/prenotazioni', {
      statusCode: 200,
      body: { id: 999, message: 'Prenotazione registrata' }
    }).as('creaPrenotazione');

    cy.wait('@getServizi');

    cy.get('#booking-servizio').select('1');
    cy.get('#data-inizio').type('2026-10-15T10:00');
    cy.get('#data-fine').type('2026-10-15T11:30');
    cy.get('#booking-note').type('Il cane è tranquillo.');

    cy.get('#booking-form button[type="submit"]').click();

    // Invece di controllare il testo temporaneo, aspettiamo che l'API finisca...
    cy.wait('@creaPrenotazione');

    // ...e verifichiamo che l'utente venga reindirizzato alla pagina di pagamento
    // con l'ID della prenotazione corretto (999) agganciato all'URL!
    cy.url().should('include', 'pagamento.html?booking_id=999');
  });
});