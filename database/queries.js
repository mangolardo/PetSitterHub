module.exports = {
    CHECK_EMAIL_PROP: 'SELECT id FROM proprietari WHERE email = $1',
    CHECK_EMAIL_PROF: 'SELECT id FROM professionista WHERE email = $1',
    CHECK_EMAIL : 'SELECT pr.id, p.id FROM professionista pr join proprietari p on pr.email = p.email WHERE p.email = $1 OR pr.email = $1',
    INSERT_PROF: 'INSERT INTO professionista  (nome,cognome, email, password) VALUES ($1, $2, $3, $4)',
    INSERT_PROP: 'INSERT INTO proprietari  (nome,cognome,zona, email, password) VALUES ($1, $2, $3, $4, $5)',
    FIND_PROP_EMAIL: 'SELECT * FROM proprietari WHERE email = $1',
    FIND_PROF_EMAIL: 'SELECT * FROM professionista WHERE email = $1',
    FIND_PROP_ID: 'SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1',
    FIND_PROF_ID: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1',
    GET_PROF_ID: 'SELECT id, nome, cognome, data_registrazione FROM professionista WHERE id = $1',

    GET_CAT_PROF_SERVIZIO: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P join servizio on P.id = id_professionista where zona = $1 AND tipologia = $2 `,
    GET_CAT_PROF_AN_SERV: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P  join servizio on P.id = id_professionista where zona = $1 AND tipologia = $2 AND tipo_animale = $3`,
    GET_CAT_PROF_ANIMALE: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P  join servizio on P.id = id_professionista where zona = $1 AND tipo_animale = $3`,
    GET_CAT_PROF: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P join servizio on P.id = id_professionista where zona = $1  `,
    GET_SERVIZI: 'SELECT id, tipologia, tariffa, tipo_animale, zona from servizio where id_professionista = $1',
    GET_DISP : 'SELECT id,data_inizio,data_fine,is_disponibile from disponibilita where id_servizio = $1',
    CHECK_SERVICE_OWNERSHIP: `SELECT id FROM servizio WHERE id = $1 AND id_professionista = $2`,
    ADD_AVAILABILITY: ` INSERT INTO disponibilita (data_inizio, data_fine, id_servizio)  VALUES ($1, $2, $3)RETURNING id, data_inizio, data_fine, is_disponibile, id_servizio`,
    DELETE_AVAILABILITY: ` DELETE FROM disponibilita WHERE id = $1  AND id_servizio IN (SELECT id FROM servizio WHERE id_professionista = $2)RETURNING id  `,
    ADD_SERVICE: ` INSERT INTO servizio (tipologia, tariffa, tipo_animale, zona, id_professionista)  VALUES ($1, $2, $3, $4, $5) RETURNING id, tipologia, tariffa, tipo_animale, zona`,
    DELETE_SERVICE: `DELETE FROM servizio  WHERE id = $1 AND id_professionista = $2 RETURNING id`,
    GET_SERVICE_BY_ID: `SELECT S.id,  S.tipologia,S.tariffa, S.tipo_animale, S.zona,P.id AS id_professionista, P.nome AS nome_professionista, P.cognome AS cognome_professionista FROM servizio S JOIN professionista P ON S.id_professionista = P.id WHERE S.id = $1 `,
    LOCK_AVAILABILITY: ` UPDATE disponibilita  SET is_disponibile = FALSE  WHERE id = $1 AND is_disponibile = TRUE RETURNING id, id_servizio, data_inizio, data_fine `,
    CREATE_BOOKING: ` INSERT INTO prenotazione (id_proprietario, id_disponibilita) VALUES ($1, $2) RETURNING id, data_richiesta`,
    CREATE_PENDING_BOOKING: `INSERT INTO prenotazione (id_proprietario, id_disponibilita, stato) VALUES ($1, $2, 'in_attesa')RETURNING id, id_disponibilita, stato, data_richiesta`,
    CONFIRM_BOOKING: `UPDATE prenotazione SET stato = 'confermata' WHERE id = $1 AND stato = 'in_attesa'RETURNING id`,
    EXPIRE_UNPAID_BOOKINGS: `WITH prenotazioni_scadute AS (UPDATE prenotazione SET stato = 'annullata'WHERE stato = 'in_attesa' AND data_richiesta < NOW() - INTERVAL '15 minutes'RETURNING id_disponibilita)
        UPDATE disponibilita d
        SET is_disponibile = TRUE
        FROM prenotazioni_scadute ps
        WHERE d.id = ps.id_disponibilita`,
   GET_PRENOTAZIONI_PROP: `SELECT  P.id AS id_prenotazione,  D.data_inizio, D.data_fine,  P.stato,  P.data_richiesta,S.tipologia AS nome_servizio,PROF.nome AS nome_professionista, PROF.cognome AS cognome_professionista , PAY.importo
FROM pagamento PAY JOIN prenotazione P ON PAY.id_prenotazione = P.id  JOIN disponibilita D ON P.id_disponibilita = D.id JOIN servizio S ON D.id_servizio = S.id JOIN professionista PROF ON S.id_professionista = PROF.id WHERE P.id_proprietario = $1 ORDER BY D.data_inizio DESC`,
    GET_PRENOTAZIONI_PROF: `
        WITH first AS (SELECT  P.id AS id_prenotazione,  D.data_inizio, D.data_fine,  P.stato,  P.data_richiesta,S.tipologia AS nome_servizio,PR.nome AS nome_proprietario, PR.cognome AS cognome_proprietario, S.id_professionista
                       FROM proprietari PR JOIN prenotazione P ON PR.id = P.id_proprietario JOIN disponibilita D ON P.id_disponibilita = D.id JOIN servizio S ON D.id_servizio = S.id
                       ORDER BY D.data_inizio DESC)
        SELECT  fs.id_prenotazione, fs.data_inizio, fs.data_fine, fs.stato, fs.data_richiesta,fs.nome_servizio,fs. nome_proprietario,fs.cognome_proprietario, PAY.importo
        FROM first fs JOIN pagamento PAY ON fs.id_prenotazione = PAY.id_prenotazione
        WHERE fs.id_professionista = $1
       `,


    GET_PRENOTAZIONE_PROP: `SELECT  P.id AS id_prenotazione,  D.data_inizio, D.data_fine,  P.stato,  P.data_richiesta,S.tipologia AS nome_servizio,PROF.nome AS nome_professionista, PROF.cognome AS cognome_professionista , PAY.importo
                            FROM pagamento PAY JOIN prenotazione P ON PAY.id_prenotazione = P.id  JOIN disponibilita D ON P.id_disponibilita = D.id JOIN servizio S ON D.id_servizio = S.id JOIN professionista PROF ON S.id_professionista = PROF.id WHERE P.id_proprietario = $1 AND P.id= $2 ORDER BY D.data_inizio DESC`,
    GET_PRENOTAZIONE_PROF: `WITH first AS (SELECT  P.id AS id_prenotazione,  D.data_inizio, D.data_fine,  P.stato,  P.data_richiesta,S.tipologia AS nome_servizio,PR.nome AS nome_proprietario, PR.cognome AS cognome_proprietario, S.id_professionista
                                           FROM proprietari PR JOIN prenotazione P ON PR.id = P.id_proprietario JOIN disponibilita D ON P.id_disponibilita = D.id JOIN servizio S ON D.id_servizio = S.id
                                           ORDER BY D.data_inizio DESC)
                            SELECT  fs.id_prenotazione, fs.data_inizio, fs.data_fine, fs.stato, fs.data_richiesta,fs.nome_servizio,fs. nome_proprietario,fs.cognome_proprietario, PAY.importo
                            FROM first fs JOIN pagamento PAY ON fs.id_prenotazione = PAY.id_prenotazione
                            WHERE fs.id_professionista = $1 AND fs.id_prenotazione = $2`,
   GET_PRENOTAZIONE_STATO : `SELECT stato FROM prenotazione WHERE id = $1`,

    UPDATE_PROFILO_PROP: `UPDATE proprietari SET nome = COALESCE($1, nome),cognome = COALESCE($2, cognome),zona = COALESCE($3, zona),email = COALESCE($4, email) WHERE id = $5 RETURNING id, nome, cognome, zona, email`,
    UPDATE_PROFILO_PROF: `UPDATE professionista SET nome = COALESCE($1, nome), cognome = COALESCE($2, cognome), email = COALESCE($3, email) WHERE id = $4 RETURNING id, nome, cognome, email`,
    GET_PASSWORD_PROP: `SELECT password FROM proprietari WHERE id = $1`,
    UPDATE_PASSWORD_PROP: `UPDATE proprietari SET password = $1 WHERE id = $2`,
    GET_PASSWORD_PROF: `SELECT password FROM professionista WHERE id = $1`,
    UPDATE_PASSWORD_PROF: `UPDATE professionista SET password = $1 WHERE id = $2`,
    CREATE_PAYMENT: `INSERT INTO pagamento (metodo, importo, id_prenotazione, stato)  VALUES ($1, $2, $3, $4) RETURNING *`,
    UPDATE_PAYMENT_STATUS: `UPDATE pagamento SET stato = $1 WHERE id = $2 RETURNING *`,
    GET_RECENSIONI_PROFESSIONISTA: ` SELECT  r.id,  r.valutazione, r.commento,  r.data_creazione,p.nome AS nome_proprietario, p.cognome AS cognome_proprietario, s.tipologia AS tipo_servizio
     FROM recensione r  JOIN proprietari p ON r.id_proprietario = p.id JOIN servizio s ON r.id_servizio = s.id WHERE s.id_professionista = $1 ORDER BY r.data_creazione DESC `,
    CREATE_RECENSIONE: `
        INSERT INTO recensione (valutazione, commento, id_servizio, id_proprietario) VALUES ($1, $2, $3, $4) RETURNING id, valutazione, commento, data_creazione `,
    DELETE_RECENSIONE: ` DELETE FROM recensione  WHERE id = $1 AND id_proprietario = $2 RETURNING id`,
    CHECK_PRENOTAZIONE_CONFERMATA: ` SELECT p.id  FROM prenotazione p JOIN disponibilita d ON p.id_disponibilita = d.id WHERE p.id_proprietario = $1   AND d.id_servizio = $2  AND p.stato = 'confermata'  LIMIT 1  `,
    //se esiste conversazione restituisci id, se no crea e restituisci id
    INITIATE_CONVERSATION: ` INSERT INTO conversazione (id_proprietario, id_professionista) VALUES ($1, $2) ON CONFLICT (id_proprietario, id_professionista)  DO UPDATE SET id_proprietario = EXCLUDED.id_proprietario RETURNING id  `,
    GET_CONVERSATIONS_PROPRIETARIO: `   SELECT c.id, c.id_professionista, p.nome, p.cognome, MAX(m.data_invio) AS ultimo_messaggio FROM conversazione c JOIN professionista p ON c.id_professionista = p.id LEFT JOIN messaggio m ON c.id = m.id_conversazione  WHERE c.id_proprietario = $1  GROUP BY c.id, p.nome, p.cognome  ORDER BY ultimo_messaggio DESC NULLS LAST`,
    GET_CONVERSATIONS_PROFESSIONISTA: `  SELECT c.id, c.id_proprietario, p.nome, p.cognome, p.zona, MAX(m.data_invio) AS ultimo_messaggio FROM conversazione c JOIN proprietari p ON c.id_proprietario = p.id LEFT JOIN messaggio m ON c.id = m.id_conversazione   WHERE c.id_professionista = $1 GROUP BY c.id, p.nome, p.cognome, p.zona ORDER BY ultimo_messaggio DESC NULLS LAST`,
    CHECK_CONVERSATION_ACCESS: `  SELECT id FROM conversazione    WHERE id = $1 AND (id_proprietario = $2 OR id_professionista = $2)  `,
    GET_MESSAGES: `   SELECT id, id_mittente, tipo_mittente, testo, data_invio  FROM messaggio  WHERE id_conversazione = $1   ORDER BY data_invio `,
    INSERT_MESSAGE: ` INSERT INTO messaggio (id_conversazione, id_mittente, tipo_mittente, testo)  VALUES ($1, $2, $3, $4)  RETURNING id, id_mittente, tipo_mittente, testo, data_invio `,
    DELETE_MESSAGE: `  DELETE FROM messaggio    WHERE id = $1     AND id_mittente = $2   AND tipo_mittente = $3  RETURNING id `,
    GET_RECENSIONI_SERVIZIO: 'SELECT  r.id,  r.valutazione, r.commento,  r.data_creazione,p.nome AS nome_proprietario, p.cognome AS cognome_proprietario, s.tipologia AS tipo_servizio  FROM recensione r  JOIN proprietari p ON r.id_proprietario = p.id JOIN servizio s ON r.id_servizio = s.id WHERE s.id= $1 ORDER BY r.data_creazione DESC  ',
    GET_ZONES : 'SELECT DISTINCT zona FROM servizio WHERE zona IS NOT NULL ',
    GET_3_BEST : `
        WITH sitter_valutazioni AS (
            SELECT
                p.id AS id_professionista,
                p.nome AS nome_professionista,
                p.cognome AS cognome_professionista,
                COALESCE(AVG(r.valutazione), 5.0) AS valutazione_media
            FROM professionista p
                     LEFT JOIN servizio s ON p.id = s.id_professionista
                     LEFT JOIN recensione r ON s.id = r.id_servizio
            GROUP BY p.id, p.nome, p.cognome
            ORDER BY valutazione_media DESC
            LIMIT 3
        )
        SELECT
            sv.id_professionista,
            sv.nome_professionista,
            sv.cognome_professionista,
            sv.valutazione_media,
            STRING_AGG(DISTINCT s.tipologia, ', ') AS lista_servizi
        FROM sitter_valutazioni sv
                 LEFT JOIN servizio s ON sv.id_professionista = s.id_professionista
        GROUP BY sv.id_professionista, sv.nome_professionista, sv.cognome_professionista, sv.valutazione_media
        ORDER BY sv.valutazione_media DESC;
    `
};