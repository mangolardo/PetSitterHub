const express = require('express');
const router = express.Router();
const reviewsHandler = require('./handlers/reviewsHandler.js');
const verifyToken = require('./authMiddleware')

router.post('/add', verifyToken, reviewsHandler.createReview);
router.get('/:id_professionista', reviewsHandler.getReviews);
router.delete('/delete/:id', verifyToken, reviewsHandler.deleteReview);


module.exports = router;