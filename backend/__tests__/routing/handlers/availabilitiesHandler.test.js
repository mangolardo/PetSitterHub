const db = require('../../../database/config');
const availabilitiesHandler = require('../../../routing/handlers/availabilitiesHandler');

jest.mock('../../../database/config', () => ({ query: jest.fn() }));
jest.mock('../../../database/queries', () => ({
    GET_DISP: 'mock', CHECK_SERVICE_OWNERSHIP: 'mock', ADD_AVAILABILITY: 'mock', DELETE_AVAILABILITY: 'mock'
}));

describe('Unit Tests per availabilitiesHandler', () => {
    let req, res;
    beforeEach(() => {
        req = { params: {}, body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    it('dovrebbe bloccare l\'aggiunta se data fine è precedente', async () => {
        req.user = { id: 1 }; req.params.id_service = 5;
        req.body = { data_inizio: '2026-12-31', data_fine: '2026-11-01' };
        await availabilitiesHandler.addAvailability(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('dovrebbe aggiungere disponibilità con successo', async () => {
        req.user = { id: 1 }; req.params.id_service = 5;
        req.body = { data_inizio: '2026-11-01', data_fine: '2026-11-10' };
        db.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });
        db.query.mockResolvedValueOnce({ rows: [{ data_inizio: '2026-11-01' }] });
        await availabilitiesHandler.addAvailability(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
