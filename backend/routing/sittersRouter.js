const express = require('express');
const router = express.Router();
const sittersHandler = require('./handlers/sittersHandler.js');
verifyToken = require('./authMiddleware')

router.get('/',sittersHandler.catalog)
router.get('/:id', sittersHandler.getSitterById);
router.get('/:id/reviews', sittersHandler.reviews)
router.get('/:id/services', sittersHandler.services)
router.post('/services', verifyToken, sittersHandler.addService)
router.delete('/servizi/:id', verifyToken, sittersHandler.deleteService);

module.exports = router;
