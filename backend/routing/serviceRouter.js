const express = require('express');
const router = express.Router();
const servicesHandler = require('./handlers/serviceHandler.js');
const verifyToken = require('./authMiddleware')

router.delete('/availability/:id', verifyToken, servicesHandler.deleteAvailability);
router.post('/:id_service/availability', verifyToken, servicesHandler.addAvailability);
router.get('/:id_service/availability', servicesHandler.getAvailabilities)
router.get('/:id_service',servicesHandler.getService)

module.exports = router;
