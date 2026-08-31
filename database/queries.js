module.exports = {
    CHECK_EMAIL_PROP: 'SELECT id FROM proprietari WHERE email = $1',
    CHECK_EMAIL_PROF: 'SELECT id FROM professionista WHERE email = $1',
    CHECK_EMAIL : 'SELECT pr.id, p.id FROM professionista pr join proprietari p on pr.email = p.email WHERE p.email = $1 OR pr.email = $1',
    INSERT_PROF: 'INSERT INTO professionista  (nome,cognome, email, password) VALUES ($1, $2, $3, $4)',
    INSERT_PROP: 'INSERT INTO proprietari  (nome,cognome,zona, email, password) VALUES ($1, $2, $3, $4, $5)',
    FIND_PROP_EMAIL: 'SELECT * FROM proprietari WHERE email = $1',
    FIND_PROF_EMAIL: 'SELECT * FROM professionista WHERE email = $1',
  //  FIND_BY_EMAIL: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE email = $1 UNION SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE email = $1 ',
    FIND_PROP_ID: 'SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1',
    FIND_PROF_ID: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1',
   // FIND_BY_ID: 'SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1 UNION SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1 ',
    GET_CAT_PROF: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P join servizio on P.id = id_professionista where zona = $1 AND tipologia = $2 `,
    GET_CAT_PROF_ANIMAL: `SELECT P.id, nome, zona, tipologia, tariffa , tipo_animale  FROM professionista as P  join servizio on P.id = id_professionista where zona = $1 AND tipologia = $2 AND tipo_animale = $3`,
    GET_PROF_ID: `SELECT id, nome, cognome , data_registrazione  FROM professionista   where id = $1 `,
    GET_SERVIZI: 'SELECT id, tipologia, tariffa, tipo_animale, zona from servizio where id_professionista = $1',
    GET_RECENSIONI: 'SELECT valutazione,commento,data_creazione,data_fine,data_inizio,tipologia from recensione as R join prenotazione P on R.id = P.id_prenotazione join servizio S on P.id_servizio = S.id  where id_professionista = $1',
    GET_DISP : 'SELECT id,data_inizio,data_fine,is_disponibile from disponibilita where id_servizio = $1',
    CHECK_SERVICE_OWNERSHIP: `SELECT id FROM servizio WHERE id = $1 AND id_professionista = $2`,
    ADD_AVAILABILITY: ` INSERT INTO disponibilita (data_inizio, data_fine, id_servizio)  VALUES ($1, $2, $3)RETURNING id, data_inizio, data_fine, is_disponibile, id_servizio`,
    DELETE_AVAILABILITY: ` DELETE FROM disponibilita WHERE id = $1  AND id_servizio IN (SELECT id FROM servizio WHERE id_professionista = $2)RETURNING id  `,
    ADD_SERVICE: ` INSERT INTO servizio (tipologia, tariffa, tipo_animale, zona, id_professionista)  VALUES ($1, $2, $3, $4, $5) RETURNING id, tipologia, tariffa, tipo_animale, zona`,
    DELETE_SERVICE: `DELETE FROM servizio  WHERE id = $1 AND id_professionista = $2 RETURNING id`,
    GET_SERVICE_BY_ID: `SELECT S.id,  S.tipologia,S.tariffa, S.tipo_animale, S.zona,P.nome AS nome_professionista, P.cognome AS cognome_professionista FROM servizio S JOIN professionista P ON S.id_professionista = P.id WHERE S.id = $1 `,
    LOCK_AVAILABILITY: ` UPDATE disponibilita  SET is_disponibile = FALSE  WHERE id = $1 AND is_disponibile = TRUE RETURNING id_servizio, data_inizio, data_fine `,
    CREATE_BOOKING: ` INSERT INTO prenotazione (id_proprietario, id_servizio, data_inizio, data_fine) VALUES ($1, $2, $3, $4) RETURNING id, data_inizio, data_fine, stato, id_servizio `,
    GET_PRENOTAZIONI_PROP: `
        SELECT 
            p.id AS id_prenotazione, 
            p.data_inizio, 
            p.data_fine, 
            p.stato, 
            p.data_richiesta,
            s.tipologia AS nome_servizio,
            s.tariffa,
            prof.nome AS nome_professionista,
            prof.cognome AS cognome_professionista
        FROM prenotazione p
        JOIN servizio s ON p.id_servizio = s.id
        JOIN professionista prof ON s.id_professionista = prof.id
        WHERE p.id_proprietario = $1
        ORDER BY p.data_inizio DESC
    `,
    GET_PRENOTAZIONI_PROF: `
        SELECT 
            p.id AS id_prenotazione, 
            p.data_inizio, 
            p.data_fine, 
            p.stato, 
            p.data_richiesta,
            s.tipologia AS nome_servizio,
            s.tariffa,
            pr.nome AS nome_proprietario,
            pr.cognome AS cognome_proprietario
        FROM proprietari pr JOIN prenotazione p on pr.id = p.id_proprietario JOIN servizio s ON p.id_servizio = s.id
        WHERE p.id_proprietario = $1
        ORDER BY p.data_inizio DESC
    `,
    GET_PRENOTAZIONE_PROP: `
        SELECT 
            p.id AS id_prenotazione, 
            p.data_inizio, 
            p.data_fine, 
            p.stato, 
            p.data_richiesta,
            s.tipologia AS nome_servizio,
            s.tariffa,
            prof.nome AS nome_professionista,
            prof.cognome AS cognome_professionista
        FROM prenotazione p
        JOIN servizio s ON p.id_servizio = s.id
        JOIN professionista prof ON s.id_professionista = prof.id
        WHERE p.id_proprietario = $1 AND p.id = $2
        ORDER BY p.data_inizio DESC
    `,
    GET_PRENOTAZIONE_PROF: `
        SELECT 
            p.id AS id_prenotazione, 
            p.data_inizio, 
            p.data_fine, 
            p.stato, 
            p.data_richiesta,
            s.tipologia AS nome_servizio,
            s.tariffa,
            pr.nome AS nome_proprietario,
            pr.cognome AS cognome_proprietario
        FROM proprietari pr JOIN prenotazione p on pr.id = p.id_proprietario JOIN servizio s ON p.id_servizio = s.id
        WHERE p.id_proprietario = $1  AND p.id = $2
        ORDER BY p.data_inizio DESC
    `,
    UPDATE_PROFILO_PROP: `
        UPDATE proprietari 
        SET 
            nome = COALESCE($1, nome),
            cognome = COALESCE($2, cognome),
            zona = COALESCE($3, zona),
            email = COALESCE($4, email)
        WHERE id = $5
        RETURNING id, nome, cognome, zona, email 
    `,

    // Aggiorna il profilo del professionista (senza il campo zona)
    UPDATE_PROFILO_PROF: `
        UPDATE professionista 
        SET 
            nome = COALESCE($1, nome),
            cognome = COALESCE($2, cognome),
            email = COALESCE($3, email)
        WHERE id = $4
        RETURNING id, nome, cognome, email
    `,
    GET_PASSWORD_PROP: `SELECT password FROM proprietari WHERE id = $1`,
    UPDATE_PASSWORD_PROP: `UPDATE proprietari SET password = $1 WHERE id = $2`,

    // --- PROFESSIONISTI ---
    GET_PASSWORD_PROF: `SELECT password FROM professionista WHERE id = $1`,
    UPDATE_PASSWORD_PROF: `UPDATE professionista SET password = $1 WHERE id = $2`


};