describe('Flusso Dettaglio e Recensioni', () => {
  beforeEach(() => {
    // Andiamo alla pagina di dettaglio simulando di essere loggati
    cy.visit('./dettaglio-servizio.html?id=101', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-token');
      }
    });
  });

  it('dovrebbe permettere di scrivere e inviare una recensione', () => {
    // Mockiamo l'API di invio recensione che abbiamo testato prima nel backend!
    cy.intercept('POST', '**/reviews/add', {
      statusCode: 201,
      body: { message: 'Recensione pubblicata con successo' }
    }).as('inviaRecensione');

    // 1. Apriamo la modale cliccando sul bottone
    cy.get('[data-bs-target="#addReviewModal"]').click();

    // 2. Simuliamo il click sulla quinta stella (voto: 5)
    cy.get('.star-btn[data-value="5"]').click({ force: true });

    // 3. Scriviamo il commento
    cy.get('#reviewCommento').type('Servizio fantastico! Yuki si è divertita tantissimo.');

    // 4. Inviamo il form
    cy.get('#addReviewForm').submit();

    // 5. Intercettiamo la chiamata finta
    cy.wait('@inviaRecensione');
  });
});