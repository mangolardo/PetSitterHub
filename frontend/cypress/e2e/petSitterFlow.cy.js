describe('PetSitterHub End-to-End User Flow', () => {

    it('dovrebbe permettere la navigazione nella home e la verifica della pagina di registrazione', () => {
        // Visita la home page principale
        cy.visit('/index.html');

        // Verifica che UI è responsive e carichi gli elementi chiave
        cy.get('nav').should('be.visible');

        // Naviga verso la sezione professionisti
        cy.get('a.nav-link[href="#professionisti"]').click();
        cy.url().should('include', '#professionisti');

        // Visita esplicitamente pagina di registrazione
        cy.visit('/login.html'); // Modifica con il nome corretto del file di registrazione se è un file separato o gestito via rotte

        // cy.visit('/registrazione.html');
    });

    it('dovrebbe testare la validazione visiva dei campi obbligatori nel form', () => {
        cy.visit('/registrazione.html');

        // Invio del form vuoto per attivare i controlli di validazione HTML5/UI
        cy.get('form').submit();

        // Controllo che il browser o l'interfaccia blocchino l'invio evidenziando i campi
        cy.get('input:invalid').should('have.length.greaterThan', 0);
    });
});