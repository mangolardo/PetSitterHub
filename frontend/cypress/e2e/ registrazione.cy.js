describe('Flusso di Registrazione', () => {
  it('dovrebbe registrare un nuovo proprietario', () => {
    // Intercettiamo la chiamata API e forziamo una risposta di successo
    cy.intercept('POST', '/api/register', {
      statusCode: 201,
      body: { message: 'Utente registrato con successo' }
    }).as('registerRequest');

    // Visita la pagina
    cy.visit('./registrazione.html');

    // Compila i campi usando i tuoi ID esatti
    cy.get('#regRuolo').select('prop');
    cy.get('#regNome').type('Mario');
    cy.get('#regCognome').type('Rossi');
    cy.get('#regEmail').type('mario.rossi@email.it');
    cy.get('#regPassword').type('PasswordSicura123!');
    cy.get('#regZona').type('Milano Centro');

    // Invia il form
    cy.get('#registerForm button[type="submit"]').click();
  });
});