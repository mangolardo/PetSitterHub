const db = require('../../../database/config');
const reviewsHandler = require('../../../routing/handlers/reviewsHandler');

jest.mock('../../../database/config', () => ({ query: jest.fn() }));
jest.mock('../../../database/queries', () => ({
    GET_RECENSIONI_PROFESSIONISTA: 'mock',
    CHECK_PRENOTAZIONE_CONFERMATA: 'mock',
    CREATE_RECENSIONE: 'mock',
    DELETE_RECENSIONE: 'mock'
}));

describe('Unit Tests per reviewsHandler', () => {
    let req, res;

    beforeEach(() => {
        req = { params: {}, body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    describe('createReview', () => {
        it('dovrebbe bloccare la recensione se la valutazione è fuori range (400 Bad Request)', async () => {
            req.user = { id: 1 };
            req.body = { valutazione: 6, id_servizio: 10 };

            await reviewsHandler.createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'La valutazione deve essere compresa tra 1 e 5' });
        });

        it('dovrebbe bloccare la recensione se l\'utente non ha usufruito del servizio (403 Forbidden)', async () => {
            req.user = { id: 1 };
            req.body = { valutazione: 5, commento: 'Ottimo!', id_servizio: 10 };

            // Simuliamo che il database NON trovi prenotazioni confermate per questo utente
            db.query.mockResolvedValueOnce({ rowCount: 0 });

            await reviewsHandler.createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Azione non consentita. Puoi recensire solo i servizi di cui hai usufruito.' });
        });

        it('dovrebbe creare la recensione con successo (201 Created)', async () => {
            req.user = { id: 1 };
            req.body = { valutazione: 5, commento: 'Ottimo!', id_servizio: 10 };

            // 1. Trovata prenotazione confermata
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            // 2. Creazione recensione
            db.query.mockResolvedValueOnce({ rows: [{ id: 99, valutazione: 5 }] });

            await reviewsHandler.createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Recensione pubblicata con successo' }));
        });
    });

    describe('deleteReview', () => {
        it('dovrebbe eliminare la recensione se l\'utente è autorizzato (200 OK)', async () => {
            req.user = { id: 1 };
            req.params.id = 99; // ID recensione

            db.query.mockResolvedValueOnce({ rowCount: 1 });

            await reviewsHandler.deleteReview(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});