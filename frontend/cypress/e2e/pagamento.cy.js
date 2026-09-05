describe('Flusso di Checkout e Pagamento', () => {
  it('dovrebbe validare la carta e simulare il pagamento', () => {
    // Visita la pagina
    cy.visit('./pagamento.html');

    // Assicuriamoci che il radio button della Carta di Credito sia spuntato
    cy.get('#methodCard').check({ force: true });

    // Compiliamo i campi (jQuery applicherà gli spazi in automatico)
    cy.get('#cardHolder').type('Mario Rossi');
    cy.get('#cardNumber').type('1234567812345678');
    cy.get('#cardExpiry').type('1226');
    cy.get('#cardCvv').type('123');

    // Inviamo il form
    cy.get('#paymentForm').submit();

    // Verifichiamo che il bottone si disabiliti e mostri lo spinner
    cy.get('#btnSubmitPayment').should('be.disabled');
    cy.get('#btnSubmitPayment').should('contain', 'Elaborazione in corso');

    // Aspettiamo che l'alert verde di successo compaia (dopo il timeout di 1.5 secondi)
    cy.get('#paymentAlert', { timeout: 3000 })
      .should('not.have.class', 'd-none')
      .and('have.class', 'alert-success')
      .and('contain', 'Pagamento completato con successo!');
  });
});