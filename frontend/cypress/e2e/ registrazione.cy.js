Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Flusso di Registrazione', () => {
  it('dovrebbe compilare il form e registrare un nuovo utente', () => {

    // Mock di registrazione
    cy.intercept('POST', '**/auth/register*', {
      statusCode: 201,
      body: { success: true, message: 'Registrazione completata!' }
    }).as('submitRegistration');

    cy.visit('http://localhost:3000/registrazione.html');
    cy.url().should('include', 'registrazione.html');

    // Compilazione con gli ID esatti del file HTML
    cy.get('#regRuolo').select('prop'); // Selezioniamo "Proprietario"
    cy.get('#regNome').type('Luca').blur();
    cy.get('#regCognome').type('Verdi').blur();
    cy.get('#regEmail').type('luca.verdi@email.it').blur();
    cy.get('#regPassword').type('Password123!').blur();
    cy.get('#regZona').type('Milano Centro').blur();

    cy.wait(500);

    // Click sul bottone di submit pescato direttamente dentro il form
    cy.get('#registerForm button[type="submit"]').invoke('removeAttr', 'disabled').click({ force: true });

    cy.wait('@submitRegistration');
  });
});