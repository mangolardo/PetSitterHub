Cypress.on('uncaught:exception', (err, runnable) => {
  return false; // Ignora errori JS interni della pagina
});

describe('Dashboard Pet-Sitter', () => {
  it('dovrebbe caricare i dati dell\'utente e navigare tra le schede', () => {

    // Mocks di rete precisi per le API sulla porta 3000
    cy.intercept('GET', '**/api/auth/me*', {
      statusCode: 200,
      body: { nome: 'Giulia', cognome: 'Rossi', email: 'giulia@email.it', ruolo: 'professionista' }
    }).as('getProfilo');

    cy.intercept('GET', '**/api/servizi*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/bookings*', { statusCode: 200, body: [] });

    // Visita con URL assoluto alla porta del backend
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

    // Test UI
    cy.get('#summary-nome').should('contain', 'Giulia');
    cy.get('#summary-cognome').should('contain', 'Rossi');
    cy.get('#tab-servizi-btn').click();
    cy.get('#tab-servizi').should('be.visible');
  });
});