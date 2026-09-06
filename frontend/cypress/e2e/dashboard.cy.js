// Questo comando dice a Cypress di non fermare il test se l'applicazione
// genera errori nella console del browser (come SyntaxError)
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Dashboard Pet-Sitter', () => {
  it('dovrebbe caricare i dati dell\'utente e navigare tra le schede', () => {

    // 1. Prepariamo le trappole di rete
    cy.intercept('GET', '**/me*', {
      statusCode: 200,
      body: {
        nome: 'Giulia',
        cognome: 'Rossi',
        email: 'giulia@email.it',
        ruolo: 'professionista'
      }
    }).as('getProfilo');

    // Intercettiamo chiamate secondarie
    cy.intercept('GET', '**/servizi*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/bookings*', { statusCode: 200, body: [] });

    // 2. Visitiamo la pagina e iniettiamo il finto token JWT
    cy.visit('./dashboard.html', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({
          id: 1,
          ruolo: 'professionista',
          exp: 9999999999
        }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;

        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'professionista');
      }
    });

    // 3. Verifichiamo la permanenza nella pagina
    cy.url().should('include', 'dashboard.html');

    // 4. Assicuriamoci che abbia catturato i dati finti
    cy.wait('@getProfilo');

    // 5. Testiamo l'interfaccia UI
    cy.get('#summary-nome').should('contain', 'Giulia');
    cy.get('#summary-cognome').should('contain', 'Rossi');

    // Navighiamo nei menu
    cy.get('#tab-servizi-btn').click();
    cy.get('#tab-servizi').should('be.visible');
    cy.get('#tab-servizi h3').should('contain', 'I Miei Servizi');
  });
});