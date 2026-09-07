describe('Frontend Form Validation Tests', () => {

    beforeEach(() => {
        cy.visit('/registrazione.html');
    });

    it('dovrebbe mostrare errori di validazione se i campi obbligatori sono vuoti', () => {
        cy.get('form').submit();
        cy.get('input:invalid').should('have.length.greaterThan', 0);
    });

    it('dovrebbe segnalare un errore per un formato di email non valido', () => {
        cy.get('input[type="email"]').type('email-errata-senza-chiocciola');
        cy.get('input[type="password"]').first().type('Password123!');
        cy.get('form').submit();

        cy.get('input[type="email"]').then(($input) => {
            expect($input[0].validationMessage).not.to.be.empty;
        });
    });

    it('dovrebbe compilare correttamente il form con dati validi', () => {
        cy.get('input[type="text"]').first().type('Mario');
        cy.get('input[type="email"]').type('mario.rossi@test.it');
        cy.get('input[type="password"]').first().type('PasswordSicura123!');

        cy.get('input[type="email"]').should('have.value', 'mario.rossi@test.it');
    });
});