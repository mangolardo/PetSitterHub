
const jwt = require('jsonwebtoken');

module.exports =(req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Il token arriva nel formato "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({error: 'Accesso negato. Token mancante.'});

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attacca i dati dell'utente alla richiesta (es. req.user.id)
        next(); // Fai procedere la richiesta al controller successivo

    } catch (error) {
        res.status(403).json({error: 'Token non valido o scaduto.'});
    }
};