const { Connector } = require('../backend/node_modules/@google-cloud/cloud-sql-connector');
const { Pool } = require('../backend/node_modules/pg');
require('../backend/node_modules/dotenv').config();
const connector = new Connector();

async function initPool() {

    const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
        ipType: 'PUBLIC',
    });

    // pool per eseguire query SQL
    return new Pool({
        ...clientOpts,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

// promessa che restituisce il pool di connessione
const poolPromise = initPool(); //avvia la connessione in background

module.exports = {
    //query personalizzata che aspetta il pool
    query: async (text, params) => {
        const pool = await poolPromise; //aspetta che la connessione sia pronta
        return pool.query(text, params);
    },
   connect : async (text, params) => {
       const pool = await poolPromise; //aspetta che la connessione sia pronta
       return pool.connect(text, params);
   }
};