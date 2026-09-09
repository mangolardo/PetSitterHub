const queries = require('../../database/queries');

describe('Unit Tests per queries.js', () => {
    it('dovrebbe esportare un oggetto valido e popolato', () => {
        expect(queries).toBeDefined();
        expect(typeof queries).toBe('object');
        expect(Object.keys(queries).length).toBeGreaterThan(0);
    });

    it('dovrebbe contenere query come stringhe non vuote', () => {
        Object.values(queries).forEach(queryStr => {
            expect(typeof queryStr).toBe('string');
            expect(queryStr.trim().length).toBeGreaterThan(5);
        });
    });
});
