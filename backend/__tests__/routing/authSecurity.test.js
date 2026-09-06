const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock del database dalla root (tre livelli sopra)
jest.mock('../../../database/config', () => ({
    query: jest.fn(),
}));

const db = require('../../../database/config');
const authMiddleware = require('../../routing/authMiddleware');
const serviceRouter = require('../../routing/serviceRouter');
const app = express();
app.use(express.json());
app.use('/api/services', authMiddleware, serviceRouter);

describe('Security & Authentication Middleware Tests', () => {

    it('dovrebbe bloccare con 401 se non viene fornito alcun token di autenticazione', async () => {
        const res = await request(app)
            .post('/api/services')
            .send({
                tipologia: 'Pensione',
                tariffa: 25,
                tipo_animale: 'cane',
                zona: 'Milano'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('dovrebbe bloccare con 403 se viene fornito un token non valido o contraffatto', async () => {
        const res = await request(app)
            .post('/api/services')
            .set('Authorization', 'Bearer token_finto_o_corrotto_12345')
            .send({
                tipologia: 'Pensione',
                tariffa: 25,
                tipo_animale: 'cane',
                zona: 'Milano'
            });

        expect([401, 403]).toContain(res.statusCode);
    });

    it('dovrebbe bloccare con 401 se il formato dell\'header Authorization non è di tipo Bearer', async () => {
        const res = await request(app)
            .post('/api/services')
            .set('Authorization', 'Basic dXNlcjpwYXNz')
            .send({});

        expect([401, 403]).toContain(res.statusCode);
    });

    it('dovrebbe bloccare con 403 o 401 un token scaduto', async () => {
        const secret = process.env.JWT_SECRET || 'test_secret';
        const expiredToken = jwt.sign({ id: 1, ruolo: 'professionista' }, secret, { expiresIn: '-10s' });

        const res = await request(app)
            .post('/api/services')
            .set('Authorization', `Bearer ${expiredToken}`)
            .send({
                tipologia: 'Pensione',
                tariffa: 25,
                tipo_animale: 'cane',
                zona: 'Milano'
            });

        expect([401, 403]).toContain(res.statusCode);
    });
});