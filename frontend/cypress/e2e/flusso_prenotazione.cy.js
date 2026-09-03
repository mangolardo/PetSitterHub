describe('Flusso Utente PetSitterHub', () => {
  it('dovrebbe fare login e cercare un sitter a Milano', () => {
    
    // MOCK DI RETE: Intercettiamo la chiamata API e forziamo una risposta 200 OK
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { token: 'token-finto', ruolo: 'proprietario' }
    }).as('loginRequest');

    cy.visit('./login.html');

    // Usiamo i NUOVI ID inseriti dai tuoi compagni
    cy.get('#loginEmail').type('utente@esempio.it');
    cy.get('#loginPassword').type('passwordSicura123');
    cy.get('#loginForm button[type="submit"]').click();

    // Diciamo a Cypress di aspettare la finta chiamata
    cy.wait('@loginRequest');

    // Verifichiamo il nuovo box di alert
    cy.get('#alertMessage').should('not.have.class', 'd-none');

    // Disabilitiamo temporaneamente i controlli rigidi sull'URL durante il redirect locale
    cy.url().should('include', 'index.html');

    // La barra di ricerca nella Home è rimasta invariata
    cy.get('#location-input').type('Milano');
    cy.get('#service-select').select('passeggiate');
    cy.get('#search-form button[type="submit"]').click();

    cy.get('.sitter-card').should('have.length.greaterThan', 0);
  });
});