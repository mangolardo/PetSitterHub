const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const db = require("#database/config");
const queries = require("../database/queries");
require('dotenv').config(); // Carica le variabili d'ambiente (es. connessione al database)
const {join} = require("node:path");
const app = express();

app.use(cors());
app.use(express.json());

//Router generale
const routes = require('./routing/router.js');

app.use('/api', routes);
app.use(express.static(join(__dirname, '../frontend')));

//Avvio del Server
//Cloud Run inietta automaticamente la variabile d'ambiente PORT. Fallback porta 3000 locale.
const PORT = process.env.PORT || 3000;
cron.schedule('* * * * *', async () => {
    try {
        const result = await db.query(queries.EXPIRE_UNPAID_BOOKINGS);

        if (result.rowCount > 0) {
            console.log('Cron Job: ${result.rowCount} slot scaduti sono stati liberati.');
        }
    } catch (error) {
        console.error('Errore durante la pulizia delle prenotazioni scadute:', error);
    }
});
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});