
const express = require('express');
const router = express.Router();
const authHandler = require('./handlers/authHandler.js');
const {verify} = require("jsonwebtoken");
const verifyToken = require('./authMiddleware')

router.post('/register', authHandler.register);
router.post('/login', authHandler.login);
router.get('/me', verifyToken, authHandler.getMe);
/////modifica profilo
router.post('/me/edit', verifyToken,authHandler.updateProfile)
router.post('/me/password', verifyToken,authHandler.changePassword)


module.exports = router;


