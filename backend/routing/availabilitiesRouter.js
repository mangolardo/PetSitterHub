const express = require('express');
const router = express.Router();
const availHandler = require('./handlers/availabilitiesHandler.js');
const bookingHandler = require('./handlers/bookingsHandler.js');
const verifyToken = require('./authMiddleware')

router.delete('/:id', verifyToken, availHandler.deleteAvailability);
router.post('/:id_service', verifyToken, availHandler.addAvailability);
router.get('/:id_service', availHandler.getAvailabilities)
module.exports = router;