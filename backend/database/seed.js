const fs = require('fs');
const path = require('path');
const db = require('./config'); // Inserisci il percorso corretto al tuo config.js

async function resetAndSeed() {
    let client;
    try {
        console.log('Connessione al database tramite Cloud SQL Connector...');
        // Sfrutta il metodo connect esportato dal tuo config.js esistente
        client = await db.connect();

        console.log('Pulizia del database in corso...');
        await client.query('BEGIN');

        // Elimina tutte le tabelle rispettando i vincoli di integrità
        await client.query(`
            DROP TABLE IF EXISTS conversazione, messaggio, pagamento, recensione, prenotazione, disponibilita, servizio, professionista, proprietari CASCADE;
        `);

        console.log('Applicazione del file SQL personalizzato...');
        const filePath =  '../database/init.sql';
        const sqlScript = fs.readFileSync(filePath, 'utf8');

        await client.query(sqlScript);
        await client.query('COMMIT');

        console.log('Database svuotato e popolato con successo!');
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Errore durante il reset del database:', error);
    } finally {
        if (client) {
            client.release();
        }
        // Necessario per terminare lo script, poiché il connettore Cloud SQL tiene aperte le attività di background
        process.exit(0);
    }
}

resetAndSeed();