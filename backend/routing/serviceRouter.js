const express = require('express');
const router = express.Router();
const servicesHandler = require('./handlers/serviceHandler.js');

const verifyToken = require('./authMiddleware')
const serviceHandler = require("./handlers/serviceHandler");


router.get('/:id', serviceHandler.services)
router.post('/', verifyToken, serviceHandler.addService)
router.delete('/:id', verifyToken, serviceHandler.deleteService);
router.get('/service/:id_service',servicesHandler.getService)

module.exports = router;
