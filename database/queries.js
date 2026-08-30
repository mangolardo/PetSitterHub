module.exports = {
    CHECK_EMAIL_PROP: 'SELECT id FROM proprietari WHERE email = $1',
    CHECK_EMAIL_PROF: 'SELECT id FROM professionista WHERE email = $1',
    CHECK_EMAIL : 'SELECT id FROM professionista join proprietari on email WHERE email = $1',
    INSERT_PROP: 'INSERT INTO proprietari (nome,cognome, email, password) VALUES ($1, $2, $3, $4)',
    INSERT_PROF: 'INSERT INTO professionista (nome,cognome,zona, email, password) VALUES ($1, $2, $3, $4, $5)',
    FIND_PROP_EMAIL: 'SELECT * FROM proprietari WHERE email = $1',
    FIND_PROF_EMAIL: 'SELECT * FROM professionista WHERE email = $1',
    FIND_BY_EMAIL: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE email = $1 UNION SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE email = $1 ',
    FIND_PROP_ID: 'SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1',
    FIND_PROF_ID: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1',
    FIND_BY_ID: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1 UNION SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1 ',
};