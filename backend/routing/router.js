const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express'); //integra un doc in modo automatico
const swaggerDoc = require('../API_docs/swagger.json'); //espone su pagina web


router.get('/', (req, res) => {
    console.log(`Accesso avvenuto da ${req.ip}!`);
    res.json({
        message: "Accesso ad api",
        help: "/API-docs"
    });
});
//Health Check per verificare che il container sia acceso e funzionante.
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'PetSitterHub funzionante' });
});

// definisci i router {require...}
const auth = require('./authRouter')
const sitters = require('./sittersRouter')
const service = require('./serviceRouter')
const bookings = require('./bookingsRouter')
const payment = require('./paymentRouter')
const reviews = require('./reviewsRouter')
const avail = require('./availabilitiesRouter')
const messages = require ('./messagesRouter')
// imposta il router per ogni route
router.use('/auth', auth)
router.use('/sitters', sitters)
router.use('/services',service)
router.use('/bookings', bookings)
router.use('/payment',payment)
router.use('/reviews',reviews)
router.use('/availabilities',avail)
router.use('/messages', messages)
// imposta la route di swagger
router.use('/API-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));


module.exports = router;