const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'API PetSitterHub',
        version: '1.0.0',
        description: 'Documentazione API per PetSitterHub ',
    },
    host: 'localhost:3000', // Modifica con l'URL di Cloud Run in produzione
    schemes: ['http'],
};

const outputFile = './API_docs/swagger.json';
const routes = ['./../app.js'];

// Genera il file
swaggerAutogen(outputFile, routes, doc);