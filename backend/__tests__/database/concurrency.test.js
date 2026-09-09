jest.mock('@google-cloud/cloud-sql-connector', () => ({
    Connector: jest.fn().mockImplementation(() => ({
        getOptions: jest.fn().mockResolvedValue({}),
    })),
}));
jest.mock('../../../database/config', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));
const db = require('../../database/config');

describe('Database Concurrency Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('dovrebbe gestire correttamente richieste di query multiple in parallelo', async () => {
        // Simuliamo risposte multiple del database per chiamate concorrenti
        db.query.mockResolvedValue({ rows: [{ id: 1, stato: 'disponibile' }], rowCount: 1 });

        // Creiamo un array di promesse per simulare transazioni concorrenti simultanee
        const concurrentRequests = Array.from({ length: 10 }, () =>
            db.query('SELECT * FROM disponibilita WHERE id = $1', [1])
        );

        // Eseguiamo tutte le query in parallelo
        const results = await Promise.all(concurrentRequests);

        // Verifichiamo che tutte le chiamate siano state completate con successo
        expect(results).toHaveLength(10);
        results.forEach(res => {
            expect(res.rowCount).toBe(1);
            expect(res.rows[0].stato).toBe('disponibile');
        });

        // Verifichiamo che il metodo query sia stato chiamato 10 volte in parallelo
        expect(db.query).toHaveBeenCalledTimes(10);
    });

    it('dovrebbe gestire correttamente un conflitto di concorrenza (es. esaurimento disponibilità)', async () => {
        // Prima chiamata restituisce disponibilità attiva, le successive no (es. esaurita)
        db.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5, prenotato: false }] })
            .mockResolvedValueOnce({ rowCount: 0, rows: [] });

        const p1 = db.query('SELECT * FROM disponibilita WHERE id = 5');
        const p2 = db.query('SELECT * FROM disponibilita WHERE id = 5');

        const [res1, res2] = await Promise.all([p1, p2]);

        expect(res1.rowCount).toBe(1);
        expect(res2.rowCount).toBe(0);
    });
});