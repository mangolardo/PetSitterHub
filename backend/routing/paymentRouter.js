const express = require('express');
const router = express.Router();
const paymentHandler = require('./handlers/paymentHandler.js');
const verifyToken = require('./authMiddleware')

router.post('/', verifyToken, paymentHandler.pay);

module.exports = router;