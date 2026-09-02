const express = require('express');
const router = express.Router();
const servicesHandler = require('./handlers/serviceHandler.js');

const verifyToken = require('./authMiddleware')
const serviceHandler = require("./handlers/serviceHandler");


router.get('/:id/services', serviceHandler.services)
router.post('/services', verifyToken, serviceHandler.addService)
router.delete('/services/:id', verifyToken, serviceHandler.deleteService);
router.get('/:id_service',servicesHandler.getService)

module.exports = router;
