-- 1. Tabella Proprietari
CREATE TABLE proprietari (
                             id SERIAL PRIMARY KEY,
                             nome VARCHAR(100) NOT NULL,
                             cognome VARCHAR(100) NOT NULL,
                             zona VARCHAR(150),
                             email VARCHAR(255) UNIQUE NOT NULL,
                             password VARCHAR(255) NOT NULL,
                             data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabella Professionista
CREATE TABLE professionista (
                                id SERIAL PRIMARY KEY,
                                nome VARCHAR(100) NOT NULL,
                                cognome VARCHAR(100) NOT NULL,
                                email VARCHAR(255) UNIQUE NOT NULL,
                                password VARCHAR(255) NOT NULL,
                                data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabella Servizio
CREATE TABLE servizio (
                          id SERIAL PRIMARY KEY,
                          tipologia VARCHAR(100) NOT NULL,
                          tariffa DECIMAL(10, 2) NOT NULL CHECK (tariffa >= 0),
                          tipo_animale VARCHAR(100) NOT NULL,
                          zona VARCHAR(150) NOT NULL,
                          id_professionista INTEGER NOT NULL REFERENCES professionista(id) ON DELETE CASCADE
);

-- 4. Tabella Disponibilita
CREATE TABLE disponibilita (
                               id SERIAL PRIMARY KEY,
                               data_inizio TIMESTAMP NOT NULL,
                               data_fine TIMESTAMP NOT NULL,
                               is_disponibile BOOLEAN DEFAULT TRUE,
                               id_servizio INTEGER NOT NULL REFERENCES servizio(id) ON DELETE CASCADE,
                               CHECK (data_fine > data_inizio)
);

-- 5. Tabella Prenotazione
CREATE TABLE prenotazione (
                              id SERIAL PRIMARY KEY,
                              id_proprietario INTEGER NOT NULL REFERENCES proprietari(id) ON DELETE CASCADE,
                              id_disponibilita INTEGER NOT NULL REFERENCES disponibilita(id) ,
                              stato VARCHAR(50) DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'confermata','annullata')),
                              data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabella Recensione
CREATE TABLE recensione (
                            id SERIAL PRIMARY KEY,
                            valutazione INTEGER NOT NULL CHECK (valutazione BETWEEN 1 AND 5),
                            commento TEXT,
                            id_servizio INTEGER NOT NULL REFERENCES servizio(id) ON DELETE CASCADE,
                            id_proprietario INTEGER NOT NULL REFERENCES proprietari(id) ON DELETE CASCADE,
                            data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 7. Tabella Pagamento
CREATE TABLE pagamento (
                           id SERIAL PRIMARY KEY,
                           metodo VARCHAR(50) NOT NULL,
                           importo DECIMAL(10, 2) NOT NULL CHECK (importo > 0),
                           id_prenotazione INTEGER UNIQUE NOT NULL REFERENCES prenotazione(id) ON DELETE CASCADE,
                           stato VARCHAR(50) DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'completato', 'fallito')),
                           data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabella Conversazione
CREATE TABLE conversazione (
                               id SERIAL PRIMARY KEY,
                               id_proprietario INTEGER NOT NULL REFERENCES proprietari(id) ON DELETE CASCADE,
                               id_professionista INTEGER NOT NULL REFERENCES professionista(id) ON DELETE CASCADE,
                               data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT unica_conversazione UNIQUE (id_proprietario, id_professionista)
);

-- 9. Tabella Messaggio
CREATE TABLE messaggio (
                           id SERIAL PRIMARY KEY,
                           id_conversazione INTEGER NOT NULL REFERENCES conversazione(id) ON DELETE CASCADE,
                           id_mittente INTEGER NOT NULL,
                           tipo_mittente VARCHAR(20) NOT NULL CHECK (tipo_mittente IN ('proprietario', 'professionista')),
                           testo TEXT NOT NULL,
                           data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Proprietari
INSERT INTO proprietari ( nome, cognome, zona, email, password) VALUES
                                                                       ( 'Mario', 'Rossi', 'Milano', 'mario.rossi@email.it', '$2b$10$fakehashedpassword1'),
                                                                       ( 'Luca', 'Verdi', 'Roma', 'luca.verdi@email.it', '$2b$10$fakehashedpassword2');

-- 2. Professionista
INSERT INTO professionista ( nome, cognome, email, password) VALUES
                                                                    ( 'Giulia', 'Bianchi', 'giulia.bianchi@email.it', '$2b$10$fakehashedpassword3'),
                                                                    ( 'Marco', 'Neri', 'marco.neri@email.it', '$2b$10$fakehashedpassword4');

-- 3. Servizio
INSERT INTO servizio (tipologia, tariffa, tipo_animale, zona, id_professionista) VALUES
                                                                                         ( 'Passeggiata', 15.00, 'Cane', 'Roma', 1),
                                                                                         ( 'Pensione', 25.00, 'Gatto', 'Milano', 2);

-- 4. Disponibilita
INSERT INTO disponibilita ( data_inizio, data_fine, is_disponibile, id_servizio) VALUES
                                                                                        ('2026-10-15 10:00:00', '2026-10-15 11:30:00', TRUE, 1),
                                                                                        ( '2026-10-16 09:00:00', '2026-10-16 18:00:00', TRUE, 2);

-- 5. Prenotazione
INSERT INTO prenotazione ( id_proprietario, id_disponibilita, stato) VALUES
    ( 1, 1, 'confermata');

-- 6. Recensione
INSERT INTO recensione (valutazione, commento, id_servizio, id_proprietario) VALUES
    ( 5, 'Servizio fantastico! Yuki si è divertita tantissimo.', 1, 1);

-- 7. Pagamento
INSERT INTO pagamento ( metodo, importo, id_prenotazione, stato) VALUES
    ( 'Carta di Credito', 15.00, 1, 'completato');

-- 8. Conversazione
INSERT INTO conversazione ( id_proprietario, id_professionista) VALUES
    (1, 1);

-- 9. Messaggio
INSERT INTO messaggio ( id_conversazione, id_mittente, tipo_mittente, testo) VALUES

                                                                               ( 1, 1, 'proprietario', 'Salve, vorrei informazioni per il cane.'),
                                                                                    ( 1, 1, 'professionista', 'Buongiorno Mario, dimmi pure!');
