const express = require('express');
const router = express.Router();
const sittersHandler = require('./handlers/sittersHandler.js');
verifyToken = require('./authMiddleware')

router.get('/',sittersHandler.catalog)
router.get('/:id', sittersHandler.getSitterById);


module.exports = router;
