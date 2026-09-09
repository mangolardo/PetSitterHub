# Documentazione di Deploy — PetSitterHub

## Panoramica dell'Infrastruttura
PetSitterHub è un'applicazione full-stack distribuita su **Google Cloud Platform (GCP)**, basata su servizi containerizzati tramite Docker ed eseguiti su **Google Cloud Run**. La persistenza dei dati è affidata a un database relazionale PostgreSQL gestito su **Google Cloud SQL**.

## Architettura dei Componenti
* **Backend (`petsitter-backend`)**: Servizio API basato su Node.js ed Express, preposto alla gestione della logica di business, dei moduli di autenticazione JWT, delle prenotazioni e della messaggistica in tempo reale.
* **Frontend (`petsitter-frontend`)**: Interfaccia utente sviluppata con Bootstrap 5, jQuery e AJAX, containerizzata e distribuita come applicazione web statica.
* **Database (`Cloud SQL`)**: Istanza PostgreSQL remota configurata per garantire la persistenza sicura di utenti, servizi, recensioni, chat e transazioni di pagamento.

## Pipeline CI/CD (GitHub Actions)
Il processo di integrazione e rilascio continuo è automatizzato tramite GitHub Actions, configurato per avviarsi automaticamente ad ogni `push` sul branch principale `main` oppure tramite attivazione manuale (`workflow_dispatch`).

### Fasi di Esecuzione della Pipeline
* **Esecuzione dei Test**: Configurazione dell'ambiente Node.js ed esecuzione automatica delle suite di test unitari e di integrazione per validare la stabilità del codice prima di procedere al rilascio.
* **Autenticazione GCP**: Accesso sicuro all'infrastruttura Google Cloud mediante l'utilizzo di una chiave JSON cifrata memorizzata nei GitHub Secrets (`GCP_CREDENTIALS`).
* **Iniezione Dinamica degli Endpoint**: Interrogazione di Cloud Run per recuperare l'URL pubblico del backend e aggiornamento automatico del file di configurazione frontend (`../backend/database/config.js`).
* **Build e Push dei Container**: Compilazione delle immagini Docker per backend e frontend, successivamente caricate nel registro centralizzato **Artifact Registry** (`europe-west6-docker.pkg.dev`).
* **Rilascio su Cloud Run**: Deploy finale dei servizi backend e frontend, con configurazione contestuale delle variabili d'ambiente necessarie alla connessione protetta.

## Variabili d'Ambiente e Sicurezza
Il corretto funzionamento del backend richiede la configurazione dei seguenti segreti all'interno dei repository secrets di GitHub, i quali vengono mappati in fase di deploy su Cloud Run:
* `DB_USER`: Identificativo utente per l'accesso al database PostgreSQL.
* `DB_PASSWORD`: Credenziale di autenticazione del database.
* `DB_NAME`: Nome del database di riferimento.
* `INSTANCE_CONNECTION_NAME`: Stringa identificativa univoca dell'istanza Cloud SQL.
* `GCP_CREDENTIALS`: Credenziali di servizio GCP con privilegi di scrittura su Cloud Run e Artifact Registry.