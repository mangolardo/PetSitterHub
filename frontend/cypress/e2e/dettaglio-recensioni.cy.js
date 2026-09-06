Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso Dettaglio e Recensioni', () => {
  it('dovrebbe permettere di scrivere e inviare una recensione', () => {

    // 1. Mock per i dettagli del servizio (con id_professionista per far caricare le recensioni)
    cy.intercept('GET', '**/api/services/service/*', {
      statusCode: 200,
      body: {
        id: 101,
        id_professionista: 1,
        nome: 'Marco',
        cognome: 'Bianchi',
        tipologia: 'Passeggiata',
        tariffa: '15.00',
        zona: 'Milano Centro'
      }
    }).as('getServiceDetails');

    cy.intercept('GET', '**/api/reviews/*', {
      statusCode: 200,
      body: []
    }).as('getReviews');

    cy.intercept('POST', '**/api/reviews/', {
      statusCode: 201,
      body: { message: 'Recensione pubblicata con successo' }
    }).as('inviaRecensione');

    cy.visit('http://localhost:3000/dettaglio-servizio.html?id_servizio=101', {
      onBeforeLoad(win) {
        const fakePayload = btoa(JSON.stringify({ id: 1, ruolo: 'proprietario', exp: 9999999999 }));
        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.firma_finta`;
        win.localStorage.setItem('token', fakeJwt);
        win.localStorage.setItem('ruolo', 'proprietario');
      }
    });

    cy.wait('@getServiceDetails');
    cy.wait('@getReviews');
    cy.url().should('include', 'dettaglio-servizio.html');

    // Azioni utente
    cy.get('[data-bs-target="#addReviewModal"]').should('be.visible').click();
    cy.get('.star-btn[data-value="5"]').click({ force: true });
    cy.get('#reviewCommento').type('Servizio fantastico! Yuki si è divertita tantissimo e torneremo sicuramente.');

    cy.get('#addReviewForm').submit();
    cy.wait('@inviaRecensione');
  });
});