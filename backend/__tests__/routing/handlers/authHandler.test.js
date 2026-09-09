const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../../database/config');
const authHandler = require('../../../routing/handlers/authHandler');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../database/config', () => ({
    query: jest.fn()
}));
jest.mock('../../../database/queries', () => ({
    CHECK_EMAIL: 'mock_query',
    INSERT_PROP: 'mock_query',
    FIND_PROP_EMAIL: 'mock_query',
    FIND_PROF_EMAIL: 'mock_query'
}));

describe('Unit Tests per authHandler', () => {
    let req, res;
    beforeEach(() => {
        req = { body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    describe('Registrazione', () => {
        it('dovrebbe bloccare se email esiste', async () => {
            req.body = { email: 'esistente@email.com', password: 'pass' };
            db.query.mockResolvedValue({ rows: [{ id: 1 }] });
            await authHandler.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('dovrebbe registrare un proprietario', async () => {
            req.body = { nome: 'Ellen', cognome: 'Machado', zona: 'Brianza', email: 'nuovo@email.com', password: 'pass', contains: function(key) { return Object.keys(this).includes(key); } };
            db.query.mockResolvedValue({ rows: [] });
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed');
            await authHandler.register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('Login', () => {
        it('dovrebbe restituire 401 se credenziali errate', async () => {
            req.body = { email: 'errata@email.com', password: 'pass' };
            db.query.mockResolvedValue({ rows: [] });
            await authHandler.login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('dovrebbe fare login con successo', async () => {
            req.body = { email: 'utente@email.com', password: 'pass' };
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, password: 'hashed' }] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token-jwt');
            await authHandler.login(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
