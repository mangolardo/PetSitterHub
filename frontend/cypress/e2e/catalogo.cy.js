Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Catalogo e Filtri Ricerca', () => {
  it('dovrebbe filtrare e mostrare i professionisti nel catalogo', () => {

    // Intercettazione esatta che copre anche le query string con lo slash finale
    cy.intercept('GET', '**/api/sitters/**', {
      statusCode: 200,
      body: [
        {
          id_servizio: 101,
          nome_professionista: 'Giulia',
          cognome_professionista: 'Rossi',
          zona: 'Milano',
          tipologia: 'Passeggiata',
          tipo_animale: 'Cane',
          tariffa: 15.00,
          valutazione_media: 4.9
        }
      ]
    }).as('getSittersCatalog');

    // Visita al catalogo con i parametri di ricerca
    cy.visit('http://localhost:3000/catalogo.html?zona=Milano&servizio=Passeggiata');

    cy.wait('@getSittersCatalog');
    cy.url().should('include', 'catalogo.html');

    // Verifica che la card del professionista appaia correttamente nella griglia
    cy.get('#catalog-grid').should('contain', 'Giulia Rossi');
    cy.get('#catalog-grid').should('contain', 'Passeggiata');
    cy.get('#catalog-grid').should('contain', '15.00');

    // Testiamo anche il form di ricerca interattivo
    cy.get('#filterZona').clear().type('Milano');
    cy.get('#catalogSearchForm').submit();

    cy.wait('@getSittersCatalog');
    cy.get('#catalog-grid').should('contain', 'Giulia Rossi');
  });
});