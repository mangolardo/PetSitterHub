-- ==========================================
-- FILE: crud_queries.sql
-- DESCRIZIONE: Raccolta delle query CRUD utilizzate nel backend di PetSitterHub
-- ==========================================

-- ------------------------------------------
-- 1. UTENTI (Proprietari e Professionisti)
-- ------------------------------------------
-- CREATE: Registrazione nuovi utenti
INSERT INTO professionista (nome, cognome, email, password) VALUES ($1, $2, $3, $4);
INSERT INTO proprietari (nome, cognome, zona, email, password) VALUES ($1, $2, $3, $4, $5);

-- READ: Ricerca utenti per email o ID
SELECT id FROM proprietari WHERE email = $1;
SELECT id FROM professionista WHERE email = $1;
SELECT * FROM proprietari WHERE email = $1;
SELECT * FROM professionista WHERE email = $1;
SELECT id, nome, cognome, zona, email, data_registrazione FROM proprietari WHERE id = $1;
SELECT id, nome, cognome, email, data_registrazione FROM professionista WHERE id = $1;

-- UPDATE: Modifica profilo e password
UPDATE proprietari SET nome = COALESCE($1, nome), cognome = COALESCE($2, cognome), zona = COALESCE($3, zona), email = COALESCE($4, email) WHERE id = $5 RETURNING id, nome, cognome, zona, email;
UPDATE professionista SET nome = COALESCE($1, nome), cognome = COALESCE($2, cognome), email = COALESCE($3, email) WHERE id = $4 RETURNING id, nome, cognome, email;
UPDATE proprietari SET password = $1 WHERE id = $2;
UPDATE professionista SET password = $1 WHERE id = $2;

-- ------------------------------------------
-- 2. SERVIZI E CATALOGO
-- ------------------------------------------
-- CREATE: Aggiunta di un nuovo servizio
INSERT INTO servizio (tipologia, tariffa, tipo_animale, zona, id_professionista) VALUES ($1, $2, $3, $4, $5) RETURNING id, tipologia, tariffa, tipo_animale, zona;

-- READ: Lettura catalogo e servizi
SELECT P.id, nome, zona, tipologia, tariffa, tipo_animale FROM professionista as P JOIN servizio on P.id = id_professionista WHERE zona = $1 AND tipologia = $2 AND tipo_animale = $3;
SELECT id, tipologia, tariffa, tipo_animale, zona FROM servizio WHERE id_professionista = $1;
SELECT S.id, S.tipologia, S.tariffa, S.tipo_animale, S.zona, P.nome AS nome_professionista, P.cognome AS cognome_professionista FROM servizio S JOIN professionista P ON S.id_professionista = P.id WHERE S.id = $1;

-- DELETE: Rimozione di un servizio
DELETE FROM servizio WHERE id = $1 AND id_professionista = $2 RETURNING id;

-- ------------------------------------------
-- 3. DISPONIBILITÀ
-- ------------------------------------------
-- CREATE: Nuova disponibilità a calendario
INSERT INTO disponibilita (data_inizio, data_fine, id_servizio) VALUES ($1, $2, $3) RETURNING id, data_inizio, data_fine, is_disponibile, id_servizio;

-- READ: Lettura slot disponibili
SELECT id, data_inizio, data_fine, is_disponibile FROM disponibilita WHERE id_servizio = $1;

-- UPDATE: Blocco temporaneo dello slot (prenotazione in corso)
UPDATE disponibilita SET is_disponibile = FALSE WHERE id = $1 AND is_disponibile = TRUE RETURNING id, id_servizio, data_inizio, data_fine;

-- DELETE: Rimozione di una disponibilità
DELETE FROM disponibilita WHERE id = $1 AND id_servizio IN (SELECT id FROM servizio WHERE id_professionista = $2) RETURNING id;

-- ------------------------------------------
-- 4. PRENOTAZIONI
-- ------------------------------------------
-- CREATE: Generazione di una prenotazione
INSERT INTO prenotazione (id_proprietario, id_disponibilita, stato) VALUES ($1, $2, 'in_attesa') RETURNING id, id_disponibilita, stato, data_richiesta;

-- READ: Storico prenotazioni (lato Proprietario e lato Professionista)
SELECT P.id AS id_prenotazione, D.data_inizio, D.data_fine, P.stato, P.data_richiesta, S.tipologia AS nome_servizio, PROF.nome AS nome_professionista, PROF.cognome AS cognome_professionista, PAY.importo FROM pagamento PAY JOIN prenotazione P ON PAY.id_prenotazione = P.id JOIN disponibilita D ON P.id_disponibilita = D.id JOIN servizio S ON D.id_servizio = S.id JOIN professionista PROF ON S.id_professionista = PROF.id WHERE P.id_proprietario = $1 ORDER BY D.data_inizio DESC;

-- UPDATE: Conferma prenotazione e ripristino slot scaduti
UPDATE prenotazione SET stato = 'confermata' WHERE id = $1 AND stato = 'in_attesa' RETURNING id;

WITH prenotazioni_scadute AS (UPDATE prenotazione SET stato = 'annullata' WHERE stato = 'in_attesa' AND data_richiesta < NOW() - INTERVAL '15 minutes' RETURNING id_disponibilita)
UPDATE disponibilita d SET is_disponibile = TRUE FROM prenotazioni_scadute ps WHERE d.id = ps.id_disponibilita;

-- ------------------------------------------
-- 5. PAGAMENTI
-- ------------------------------------------
-- CREATE: Registrazione nuovo pagamento
INSERT INTO pagamento (metodo, importo, id_prenotazione, stato) VALUES ($1, $2, $3, $4) RETURNING *;

-- UPDATE: Aggiornamento stato pagamento
UPDATE pagamento SET stato = $1 WHERE id = $2 RETURNING *;

-- ------------------------------------------
-- 6. RECENSIONI
-- ------------------------------------------
-- CREATE: Inserimento nuova recensione
INSERT INTO recensione (valutazione, commento, id_servizio, id_proprietario) VALUES ($1, $2, $3, $4) RETURNING id, valutazione, commento, data_creazione;

-- READ: Lettura recensioni per professionista o servizio
SELECT r.id, r.valutazione, r.commento, r.data_creazione, p.nome AS nome_proprietario, p.cognome AS cognome_proprietario, s.tipologia AS tipo_servizio FROM recensione r JOIN proprietari p ON r.id_proprietario = p.id JOIN servizio s ON r.id_servizio = s.id WHERE s.id_professionista = $1 ORDER BY r.data_creazione DESC;

-- DELETE: Rimozione di una recensione
DELETE FROM recensione WHERE id = $1 AND id_proprietario = $2 RETURNING id;

-- ------------------------------------------
-- 7. MESSAGGI E CHAT
-- ------------------------------------------
-- CREATE: Avvio conversazione e invio messaggio
INSERT INTO conversazione (id_proprietario, id_professionista) VALUES ($1, $2) ON CONFLICT (id_proprietario, id_professionista) DO UPDATE SET id_proprietario = EXCLUDED.id_proprietario RETURNING id;
INSERT INTO messaggio (id_conversazione, id_mittente, tipo_mittente, testo) VALUES ($1, $2, $3, $4) RETURNING id, id_mittente, tipo_mittente, testo, data_invio;

-- READ: Lista chat e cronologia messaggi
SELECT c.id, c.id_professionista, p.nome, p.cognome, MAX(m.data_invio) AS ultimo_messaggio FROM conversazione c JOIN professionista p ON c.id_professionista = p.id LEFT JOIN messaggio m ON c.id = m.id_conversazione WHERE c.id_proprietario = $1 GROUP BY c.id, p.nome, p.cognome ORDER BY ultimo_messaggio DESC NULLS LAST;
SELECT id, id_mittente, tipo_mittente, testo, data_invio FROM messaggio WHERE id_conversazione = $1 ORDER BY data_invio;

-- DELETE: Cancellazione di un singolo messaggio
DELETE FROM messaggio WHERE id = $1 AND id_mittente = $2 AND tipo_mittente = $3 RETURNING id;