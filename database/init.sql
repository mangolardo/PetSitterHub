-- Pulizia per riesecuzione script
DROP TABLE IF EXISTS messaggio CASCADE;
DROP TABLE IF EXISTS conversazione CASCADE;
DROP TABLE IF EXISTS pagamento CASCADE;
DROP TABLE IF EXISTS recensione CASCADE;
DROP TABLE IF EXISTS prenotazione CASCADE;
DROP TABLE IF EXISTS disponibilita CASCADE;
DROP TABLE IF EXISTS servizio CASCADE;
DROP TABLE IF EXISTS professionista CASCADE;
DROP TABLE IF EXISTS proprietari CASCADE;

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
                              id_servizio INTEGER NOT NULL REFERENCES servizio(id) ON DELETE CASCADE,
                              data_inizio TIMESTAMP NOT NULL,
                              data_fine TIMESTAMP NOT NULL,
                              stato VARCHAR(50) DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'confermata', 'rifiutata', 'completata', 'annullata')),
                              data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              CHECK (data_fine > data_inizio)
);

-- 6. Tabella Recensione
CREATE TABLE recensione (
                            id SERIAL PRIMARY KEY,
                            valutazione INTEGER NOT NULL CHECK (valutazione BETWEEN 1 AND 5),
                            commento TEXT,
                            id_prenotazione INTEGER UNIQUE NOT NULL REFERENCES prenotazione(id) ON DELETE CASCADE,
                            data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabella Pagamento
CREATE TABLE pagamento (
                           id SERIAL PRIMARY KEY,
                           metodo VARCHAR(50) NOT NULL,
                           importo DECIMAL(10, 2) NOT NULL CHECK (importo > 0),
                           id_prenotazione INTEGER UNIQUE NOT NULL REFERENCES prenotazione(id) ON DELETE CASCADE,
                           stato VARCHAR(50) DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'completato', 'fallito', 'rimborsato')),
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