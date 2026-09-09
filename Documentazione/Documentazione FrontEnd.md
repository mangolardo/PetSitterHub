# Documentazione UI

## Documentazione del 1° Modulo

### 1. Panoramica

Il primo blocco dell'applicazione costituisce l'interfaccia di ingresso e sicurezza del sistema PetSitterHub. Gestisce la presentazione del servizio, l'accesso degli utenti, la registrazione differenziata per ruolo e l'aggiornamento dei dati del profilo utente.

### 2. Tecnologie e Componenti UI Utilizzati

* **Layout & Style**: Bootstrap 5.3.3 (Griglia responsive, form controlli, componenti elastici).
* **Iconografia**: Bootstrap Icons v1.11.3.
* **Tipografia**: Google Font Work Sans (ponderazioni da 400 a 800).
* **Logica Client-Side**: jQuery 3.7.1 per la manipolazione del DOM e le chiamate asincrone AJAX.
* **Autenticazione**: JSON Web Token (JWT) con memorizzazione in `localStorage`.

### 3. Struttura delle Pagine HTML

* **`index.html`**: Contiene la barra di ricerca rapida con autocompletamento delle zone, la guida ai servizi e l'esposizione dinamica delle schede dei 3 migliori pet-sitter in evidenza.
* **`login.html`**: Permette l'autenticazione tramite email e password con funzionalità di visualizzazione/occultamento della password (`toggle-password`).
* **`registrazione.html`**: Consente la registrazione profilata come Proprietario o Pet Sitter, mostrando/nascondendo i campi in maniera condizionale (es. il campo Zona/Città).

### 4. Architettura della Logica JavaScript

#### 4.1. Gestione Sicurezza e Sessione (`auth.js`)

* **Header Authorization Automatico**: Tutte le chiamate AJAX includono automaticamente il token JWT nell'header `Authorization: Bearer <token>`.
* **Validazione Password**: Controllo lato client tramite Espressione Regolare (Regex) che impone l'uso di almeno una lettera maiuscola, un numero e un carattere speciale.
* **Routing Condizionale**: Reindirizzamento automatico degli utenti in base al ruolo (`professionista` = `dashboard.html`, `proprietario` = `index.html` / `profilo.html`).

#### 4.2. Dinamismo della Home Page (`index.js`)

* **Navbar Dinamica**: Inverte i pulsanti tra "Accedi" e "Area Personale/Logout" a seconda dello stato di autenticazione.
* **Autocompletamento Località**: Interroga l'API backend per recuperare le zone attive e fornisce un menu a tendina filtrato in tempo reale durante la digitazione.
* **Protezione XSS**: Tutti i dati testuali iniettati dinamicamente nel DOM (nomi, servizi, recensioni) vengono igienizzati tramite la funzione `escapeHtml()`.

---

## Documentazione del 2° Modulo

### 1. Catalogo Professionisti e Ricerca

* **`catalogo.html`**: Interfaccia di ricerca avanzata. Offre una barra di filtraggio (zona/città con completamento automatico, tipo di servizio e tipo di animale) e una griglia dinamica per mostrare i risultati reperiti dal server.
* **`catalogo.js`**: Gestisce le chiamate AJAX all'endpoint `/sitters/` per filtrare la lista dei professionisti in tempo reale. Carica i suggerimenti dinamici per le zone, formatta le schede con valutazioni e tariffe, e mappa ciascuna tipologia di servizio con un'icona dedicata.

### 2. Dettaglio Servizio e Recensioni

* **`dettaglio-servizio.html`**: Pagina dedicata alla scheda singola di un servizio. Mostra le informazioni sul pet sitter, la tariffa oraria, una colonna per avviare la prenotazione e il blocco recensioni con relativo pulsante per aprire la modale d'inserimento.
* **`dettaglio-servizio.js`**: Recupera i dati del servizio via AJAX dall'endpoint `/services/service/:id`. Gestisce il calcolo dinamico della media dei voti, il sistema interattivo a stelle (1-5) per l'invio/pubblicazione di nuove recensioni (`/reviews/`) e l'eliminazione dei commenti propri.

### 3. Calendario e Gestione Disponibilità

* **`disponibilita.js`**: Gestisce l'integrazione con FullCalendar per l'inserimento e la rimozione degli slot orari del pet sitter. Supporta la pianificazione di disponibilità singole o ricorsive (ripetizione settimanale) tramite chiamate POST/DELETE verso l'endpoint `/availabilities/`.

### 4. Flusso di Prenotazione e Pagamento

* **`prenotazione.html`**: Interfaccia con riepilogo dati e modulo di richiesta servizio.
* **`prenotazione.js`**: Inizializza FullCalendar in vista settimanale evidenziando in verde gli slot liberi e in rosso quelli già occupati. Permette all'utente di selezionare uno slot disponibile e confermare l'operazione (`POST /bookings/book/:id`) prima di passare al check-out.
* **`pagamento.html`**: Form di checkout sicuro con supporto a Carte di Credito e PayPal, affiancato da un box con il calcolo dettagliato del totale (tariffa servizio + commissioni).
* **`pagamento.js`**: Recupera i dettagli della prenotazione (`/bookings/:id`), applica la formattazione con maschere agli input della carta e invia il pagamento al backend (`POST /payment`).

### 5. Storico e Dashboard

* **`prenotazioni.js`**: Recupera lo storico delle prenotazioni dell'utente autenticato (`GET /bookings/`) valorizzando la tabella di riepilogo con date, controparte, importo e badge di stato (`in_attesa`, `confermata`, `completata`, ecc.).

---

## Documentazione del 3° Modulo

### 1. Dashboard del Pet Sitter

* **`dashboard.html`**: Interfaccia riservata ai professionisti. Organizzata a schede (tab), permette di gestire i dati del profilo, visualizzare/aggiungere i propri servizi, gestire le disponibilità sul calendario, consultare le prenotazioni ricevute, accedere ai messaggi, leggere le recensioni e aggiornare le credenziali. Include modali per l'inserimento di nuovi servizi e slot orari.
* **`dashboard.js`**: Gestisce le interazioni della dashboard previa verifica del ruolo utente (`professionista`). Esegue chiamate AJAX per:
* Caricare e aggiungere servizi (`GET/POST /services/`) ed eliminarli (`DELETE /services/:id`).
* Recuperare le prenotazioni ricevute (`GET /bookings`) formattando date, dati del cliente e badge di stato (`confermata`, `in_attesa`, ecc.).
* Caricare e mostrare le recensioni ricevute dai clienti con valutazione a stelle (`GET /reviews/:id_professionista`).



### 2. Profilo Pubblico del Pet Sitter

* **`profilo-sitter.html`**: Pagina pubblica di presentazione del singolo professionista. Mostra l'intestazione con nome, badge di verifica, media voti, lista dei servizi offerti con pulsante per prenotare e l'elenco delle recensioni lasciate dagli utenti.
* **`profilo-sitter.js`**: Estrae l'id del sitter dall'URL (`?id=...`) ed esegue chiamate AJAX in parallelo (`$.when`) verso `/sitters/:id`, `/services/:id` e `/reviews/:id`. Popola la pagina con i dettagli biografici, calcola la media dinamica del punteggio e reindirizza alla chat privata tramite il pulsante "Contatta".

### 3. Area Personale Cliente / Utente

* **`profilo.html`**: Pannello di controllo dedicato al proprietario d'animale. Include sezioni per il riepilogo e la modifica dei dati personali, il cambio password, lo storico delle prenotazioni effettuate e la sezione messaggi/chat.

### 4. Sistema di Messaggistica e Chat

* **`messaggi.js`**: Gestisce l'interazione in tempo reale per le conversazioni tra utenti e pet sitter (`/messages`). Permette di:
* Recuperare ed elencare le chat attive.
* Avviare una nuova conversazione (`POST /messages/`) o selezionarne una esistente per caricarne la cronologia (`GET /messages/:id`).
* Inviare nuovi messaggi di testo e rimuovere i propri messaggi inviati (`DELETE /messages/message/:id`).