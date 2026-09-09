# DOCUMENTAZIONE DIAGRAMMA-ER

## 1. Descrizione Generale del Sistema

Il sistema gestisce una piattaforma web che mette in contatto utenti proprietari di animali con professionisti del settore (pet sitter, addestratori, ecc.). La piattaforma consente ai professionisti di pubblicare servizi e disponibilità orarie, ai proprietari di prenotare tali servizi, procedere al pagamento, scambiarsi messaggi tramite una chat integrata e rilasciare recensioni al termine della prestazione.

## 2. Dettaglio delle Entità e Attributi

### proprietari

* **id** (PK): Identificativo univoco del proprietario.
* **nome, cognome**: Dati anagrafici.
* **email**: Indirizzo email (univoco per il login).
* **password**: Password di accesso cifrata.
* **zona**: Area geografica di residenza/interesse.
* **data_registrazione**: Data e ora di iscrizione alla piattaforma.

### professionista

* **id** (PK): Identificativo univoco del professionista.
* **nome, cognome**: Dati anagrafici.
* **email**: Indirizzo email (univoco per il login).
* **password**: Password di accesso cifrata.
* **data_registrazione**: Data e ora di iscrizione alla piattaforma.

### servizio

* **id** (PK): Identificativo univoco del servizio offerto.
* **tipologia**: Categoria del servizio (es. Passeggiata, Pensione, Addestramento).
* **tariffa**: Prezzo orario/giornaliero del servizio.
* **tipo_animale**: Specie o taglia dell'animale ammesso (es. Cane, Gatto).
* **zona**: Area geografica in cui viene erogato il servizio.

### disponibilita

* **id** (PK): Identificativo univoco dello slot orario.
* **data_inizio, data_fine**: Intervallo temporale di erogazione.
* **is_disponibile**: Flag booleano per indicare se lo slot è prenotabile.

### prenotazione

* **id** (PK): Identificativo univoco della richiesta di prenotazione.
* **stato**: Stato del ciclo di vita (`in_attesa`, `confermata`, `annullata`).
* **data_richiesta**: Timestamp in cui viene inoltrata la richiesta.

### pagamento

* **id** (PK): Identificativo univoco della transazione.
* **metodo**: Strumento di pagamento utilizzato (es. Carta di Credito, PayPal).
* **importo**: Somma totale versata.
* **stato**: Esito del pagamento (`in_attesa`, `completato`, `fallito`).
* **data_pagamento**: Timestamp dell'avvenuta transazione.

### messaggio

* **id** (PK): Identificativo univoco del singolo messaggio.
* **id_mittente**: Identificativo dell'utente che ha inviato il messaggio.
* **tipo_mittente**: Categoria dell'emittente (`proprietario` o `professionista`).
* **testo**: Contenuto testuale del messaggio.
* **data_invio**: Timestamp di spedizione.

## 3. Relazioni e Cardinalità

* **offre** (tra `professionista` e `servizio`)
* `professionista -> offre`: (0,N) — Un professionista può non aver ancora registrato alcun servizio oppure offrirne diversi.
* `servizio -> offre`: (1,1) — Ogni servizio deve essere offerto da un solo specifico professionista.


* **ha** (tra `servizio` e `disponibilita`)
* `servizio -> ha`: (0,N) — Un servizio può non avere slot temporali definiti o averne multipli.
* `disponibilita -> ha`: (1,1) — Ogni slot di disponibilità è associato a un solo specifico servizio.


* **possiede** (tra `disponibilita` e `prenotazione`)
* `disponibilita -> possiede`: (0,1) — Uno slot di disponibilità può non essere ancora prenotato oppure essere occupato da una sola prenotazione.
* `prenotazione -> possiede`: (1,1) — Ogni prenotazione si riferisce a un singolo slot di disponibilità.


* **compie** (tra `proprietari` e `prenotazione`)
* `proprietari -> compie`: (0,N) — Un proprietario può non aver ancora effettuato prenotazioni o averne effettuate più di una.
* `prenotazione -> compie`: (1,1) — Ogni prenotazione è effettuata da uno e un solo proprietario.


* **effettua** (tra `prenotazione` e `pagamento`)
* `prenotazione -> effettua`: (0,1) — Una prenotazione può non essere ancora stata saldata oppure possedere al massimo un pagamento associato.
* `pagamento -> effettua`: (1,1) — Ogni transazione di pagamento si riferisce a una singola prenotazione.


* **recensione** (tra `proprietari` e `servizio`)
* `proprietari -> recensione`: (0,N) — Un proprietario può scrivere zero o più recensioni nel corso del tempo.
* `servizio -> recensione`: (0,N) — Un servizio può non aver ancora ricevuto recensioni o averne ricevute molteplici.


* **conversazione** (tra `proprietari`, `professionista` e `messaggio`)
* `proprietari -> conversazione`: (0,N) — Un proprietario può avviare zero o più conversazioni.
* `professionista -> conversazione`: (0,N) — Un professionista può partecipare a zero o più conversazioni.
* `conversazione -> messaggio`: (0,N) — Una conversazione può non contenere ancora messaggi o raccoglierne diversi.
* `messaggio -> conversazione`: (1,1) — Ogni singolo messaggio inviato appartiene a una sola conversazione.