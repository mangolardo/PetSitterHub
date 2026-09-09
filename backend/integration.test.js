const request = require('supertest');
const express = require('express');

// Visto che integration.test.js ora è direttamente in backend/, usciamo di un solo livello
jest.mock('../database/config', () => ({
    query: jest.fn(),
}));

const db = require('./database/config');
const authRouter = require('./routing/authRouter');
const bookingsRouter = require('./routing/bookingsRouter');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);

describe('API Integration Tests - PetSitterHub', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('dovrebbe gestire la richiesta di registrazione', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            db.query.mockResolvedValueOnce({ rowCount: 1 });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    nome: 'Mario',
                    cognome: 'Rossi',
                    zona: 'Milano',
                    email: 'test@email.it',
                    password: 'Password123!'
                });

            expect(res.statusCode).toBe(201);
        });
    });

    describe('POST /api/auth/login', () => {
        it('dovrebbe rifiutare credenziali non valide con 401', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            db.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'inesistente@email.it',
                    password: 'WrongPassword123!'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error', 'Credenziali non valide');
        });
    });

    describe('POST /api/bookings/book/:id_availability', () => {
        it('dovrebbe richiedere un token di autenticazione valido per prenotare', async () => {
            const res = await request(app)
                .post('/api/bookings/book/1')
                .send({});

            expect([401, 403]).toContain(res.statusCode);
        });
    });
});