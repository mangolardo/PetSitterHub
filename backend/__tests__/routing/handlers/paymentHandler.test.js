const db = require('../../../database/config');
const paymentHandler = require('../../../routing/handlers/paymentHandler');

jest.mock('../../../../database/config', () => {
    const mClient = {
        query: jest.fn(),
        release: jest.fn()
    };
    return { connect: jest.fn(() => mClient) };
});

jest.mock('../../../../database/queries', () => ({
    GET_PRENOTAZIONE_STATO: 'mock',
    CREATE_PAYMENT: 'mock',
    CONFIRM_BOOKING: 'mock'
}));

describe('Unit Tests per paymentHandler', () => {
    let req, res, client;

    beforeEach(async () => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        client = await db.connect();
        jest.clearAllMocks();
    });

    it('dovrebbe restituire 400 se la prenotazione non è "in_attesa"', async () => {
        req.body = { id_prenotazione: 1, importo: 35, numero_carta: '1234567812346767' };

        client.query.mockResolvedValueOnce(); // BEGIN
        client.query.mockResolvedValueOnce({ rows: [{ stato: 'completato' }] }); // Stato errato

        await paymentHandler.pay(req, res);

        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('dovrebbe rifiutare il pagamento se la carta NON finisce con 6767 (402 Payment Required)', async () => {
        req.body = { id_prenotazione: 1, importo: 35, numero_carta: '1111222233334444' }; // Carta errata

        client.query.mockResolvedValueOnce(); // BEGIN
        client.query.mockResolvedValueOnce({ rows: [{ stato: 'in_attesa' }] }); // Stato corretto
        client.query.mockResolvedValueOnce({}); // CREATE_PAYMENT fallito
        client.query.mockResolvedValueOnce({}); // COMMIT

        await paymentHandler.pay(req, res);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Pagamento rifiutato dalla banca.' });
    });

    it('dovrebbe approvare il pagamento se la carta finisce con 6767 (200 OK)', async () => {
        req.body = { id_prenotazione: 1, importo: 35, numero_carta: '1234567812346767' }; // Carta vincente!

        client.query.mockResolvedValueOnce(); // BEGIN
        client.query.mockResolvedValueOnce({ rows: [{ stato: 'in_attesa' }] });
        client.query.mockResolvedValueOnce({}); // CREATE_PAYMENT
        client.query.mockResolvedValueOnce({}); // CONFIRM_BOOKING

        await paymentHandler.pay(req, res);

        expect(client.query).toHaveBeenCalledWith('COMMIT');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});