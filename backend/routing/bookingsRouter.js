const express = require('express');
const router = express.Router();
const bookingHandler = require('./handlers/bookingsHandler.js');
const verifyToken = require('./authMiddleware')

router.get('/',verifyToken,bookingHandler.getBookings)
router.post('/book/:id_availability',verifyToken,bookingHandler.book)
router.get('/:id',verifyToken,bookingHandler.getBooking)

module.exports = router;