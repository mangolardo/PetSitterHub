const express = require('express');
const router = express.Router();
const reviewsHandler = require('./handlers/reviewsHandler.js');
const verifyToken = require('./authMiddleware')

router.post('/', verifyToken, reviewsHandler.createReview);
router.get('/:id_professionista', reviewsHandler.getReviews);
router.delete('/:id', verifyToken, reviewsHandler.deleteReview);
router.get('/service/:id_service', reviewsHandler.getServiceReviews);


module.exports = router;