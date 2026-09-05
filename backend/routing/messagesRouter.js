const express = require('express');
const router = express.Router();
const verifyToken = require('./authMiddleware')
const messagesHandler = require('./handlers/messagesHandler')

router.get('/',verifyToken,messagesHandler.getConversations);
router.post('/',verifyToken,messagesHandler.initConversation);
router.get('/:id_conversazione',verifyToken,messagesHandler.getMessages);
router.post('/:id_conversazione',verifyToken,messagesHandler.sendMessage);
router.delete('/message/:id_messaggio',verifyToken, messagesHandler.deleteMessage);
module.exports = router;