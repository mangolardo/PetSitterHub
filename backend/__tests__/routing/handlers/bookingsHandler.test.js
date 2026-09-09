const db = require('../../../database/config');
const bookingsHandler = require('../../../routing/handlers/bookingsHandler');
const queries = require('../../../database/queries')

// Mock avanzato per simulare le transazioni (db.connect)
jest.mock('../../../database/config', () => {
    const mClient = {
        query: jest.fn(),
        release: jest.fn()
    };
    return {
        connect: jest.fn(() => mClient),
        query: jest.fn() // Per le query normali (es. getBookings)
    };
});

jest.mock('../../../database/queries', () => ({
    LOCK_AVAILABILITY: 'mock_lock',
    CREATE_PENDING_BOOKING: 'mock_create'
}));

describe('Unit Tests per bookingsHandler', () => {
    let req, res, client;

    beforeEach(async () => {
        req = { user: { id: 1, ruolo: 'proprietario' }, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        client = await db.connect();
        jest.clearAllMocks();
    });

    describe('POST /api/bookings/book/:id_availability', () => {
        it('dovrebbe bloccare la prenotazione se l\'orario è già stato preso (409 Conflict)', async () => {
            req.params.id_availability = 5;

            // Simuliamo che il "LOCK" fallisca perché la disponibilità non esiste più
            client.query.mockResolvedValueOnce(); // Risposta per 'BEGIN'
            client.query.mockResolvedValueOnce({ rowCount: 0 }); // Risposta per LOCK_AVAILABILITY

            await bookingsHandler.book(req, res);

            expect(client.query).toHaveBeenCalledWith('ROLLBACK');
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'Siamo spiacenti, questo orario è appena stato prenotato da un altro utente.' });
        });

        it('dovrebbe creare la prenotazione in attesa (201 Created)', async () => {
            req.params.id_availability = 5;

            // Simuliamo il successo di tutte le query
            client.query.mockResolvedValueOnce(); // BEGIN
            client.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5 }] }); // LOCK
            client.query.mockResolvedValueOnce({ rows: [{ id: 10 }] }); // CREATE

            await bookingsHandler.book(req, res);

            expect(client.query).toHaveBeenCalledWith('COMMIT');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(client.release).toHaveBeenCalled(); // Verifica che la connessione venga rilasciata
        });
    });
});