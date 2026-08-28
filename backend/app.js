
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carica le variabili d'ambiente (es. connessione al database)


const app = express();

app.use(cors());
app.use(express.json());



//Router generale
 const routes = require('./routing/router.js');
 app.use('/api', routes);

//Avvio del Server
//Cloud Run inietta automaticamente la variabile d'ambiente PORT. Fallback porta 3000 locale.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});