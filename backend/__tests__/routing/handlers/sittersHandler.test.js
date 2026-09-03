jest.mock('../../../../database/config', () => ({ query: jest.fn() }));
const db = require('../../../../database/config');
const sittersHandler = require('../../../routing/handlers/sittersHandler');

describe('Unit Tests per sittersHandler', () => {
    let req, res;
    beforeEach(() => {
        req = { query: {}, params: {}, body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    it('dovrebbe restituire un array di sitter (catalog)', async () => {
        req.query = { zona: 'Milano', servizio: 'Passeggiata' };
        db.query.mockResolvedValue({ rows: [{ id: 1, nome: 'Mario' }] });
        await sittersHandler.catalog(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
