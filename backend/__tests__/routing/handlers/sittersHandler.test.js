jest.mock('../../../../database/config', () => ({ query: jest.fn() }));

// Mock del modulo queries per evitare errori di concatenazione con stringhe undefined
jest.mock('../../../../database/queries', () => ({
    GET_CAT: 'SELECT * FROM servizio s JOIN professionista p ON s.id_professionista = p.id WHERE 1=1',
    GET_PROF_ID: 'SELECT * FROM professionista WHERE id = $1',
    GET_3_BEST: 'SELECT * FROM professionista LIMIT 3'
}));

const db = require('../../../../database/config');
const sittersHandler = require('../../../routing/handlers/sittersHandler');

describe('Unit Tests per sittersHandler', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, params: {}, body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    describe('Funzione: catalog', () => {
        it('dovrebbe restituire un array di sitter filtrato e chiamare res.json()[cite: 16]', async () => {
            req.query = { zona: 'Milano', servizio: 'Passeggiata', animale: 'Cane' };
            const mockData = [{ id_servizio: 1, nome_professionista: 'Mario' }];

            db.query.mockResolvedValue({ rows: mockData });

            await sittersHandler.catalog(req, res);

            expect(db.query).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockData);
        });

        it('dovrebbe restituire 500 in caso di errore del database[cite: 16]', async () => {
            db.query.mockRejectedValue(new Error('DB Error'));

            await sittersHandler.catalog(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante il recupero dei dati del catalogo' });
        });
    });

    describe('Funzione: getSitterById', () => {
        it('dovrebbe restituire il professionista con status 200 se trovato[cite: 16]', async () => {
            req.params.id = 1;
            const mockSitter = { id: 1, nome: 'Luigi' };

            db.query.mockResolvedValue({ rows: [mockSitter] });

            await sittersHandler.getSitterById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockSitter);
        });

        it('dovrebbe restituire 404 se il professionista non esiste[cite: 16]', async () => {
            req.params.id = 99;

            db.query.mockResolvedValue({ rows: [] });

            await sittersHandler.getSitterById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Professionista non trovato' });
        });
    });

    describe('Funzione: best', () => {
        it('dovrebbe restituire la lista dei top 3 sitter chiamando res.json()[cite: 16]', async () => {
            const mockTopSitters = [{ id: 1 }, { id: 2 }, { id: 3 }];

            db.query.mockResolvedValue({ rows: mockTopSitters });

            await sittersHandler.best(req, res);

            expect(db.query).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockTopSitters);
        });

        it('dovrebbe gestire gli errori e restituire 500[cite: 16]', async () => {
            db.query.mockRejectedValue(new Error('DB Error'));

            await sittersHandler.best(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Errore durante il recupero dei professionisti in evidenza' });
        });
    });
});
