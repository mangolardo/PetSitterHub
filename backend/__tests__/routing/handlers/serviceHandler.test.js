const db = require('../../../database/config');
const serviceHandler = require('../../../routing/handlers/serviceHandler');

jest.mock('../../../../database/config', () => ({ query: jest.fn() }));
jest.mock('../../../../database/queries', () => ({
    GET_SERVICE_BY_ID: 'mock', GET_SERVIZI: 'mock', ADD_SERVICE: 'mock', DELETE_SERVICE: 'mock'
}));

describe('Unit Tests per serviceHandler', () => {
    let req, res;
    beforeEach(() => {
        req = { params: {}, body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    it('dovrebbe bloccare la creazione se la tariffa è negativa', async () => {
        req.user = { id: 1 };
        req.body = { tipologia: 'Passeggiata', tariffa: -10, tipo_animale: 'Cane', zona: 'Como' };
        await serviceHandler.addService(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('dovrebbe creare il servizio', async () => {
        req.user = { id: 1 };
        req.body = { tipologia: 'Dog-walking', tariffa: 20, tipo_animale: 'Cane', zona: 'Brianza' };
        db.query.mockResolvedValue({ rows: [{ id: 10, ...req.body }] });
        await serviceHandler.addService(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
