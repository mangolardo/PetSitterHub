const db =  require('../../../database/config')
const queries = require('../../../database/queries');
// ==========================================
// 1. ROTTE PUBBLICHE (Per i proprietari)
// ==========================================
// Handler per GET /api/sitters
exports.catalog = async (req, res) => {
    //aggiungi voto totale per ogni tipo maybe
    try {
        let  rows  = []
        // Parametri di query inviati dal frontend (es. ?citta=Milano)
        if (req.query.length>2){
            const {zona, servizio,animale} = req.query;
            rows = await db.query(queries.GET_CAT_PROF,[zona,servizio,animale] )
        } else {
            const { zona , servizio } = req.query;
            rows = await db.query(queries.GET_CAT_PROF, [zona,servizio]);
        }
        if (rows.length === 0) {
            return res.status(401).json({error: 'Utente non trovato'})
        }
        res.status(200).json(rows.rows);
    } catch (error) {
        console.error('Errore durante il recupero dei sitter:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

// Handler per GET /api/sitters/:id
exports.getSitterById = async (req, res) => {
    try {
        // req.params.id cattura il numero nell'URL (es. se l'URL è /api/sitters/5, id sarà 5)
        const sitterId = req.params.id;

        const sitterInfo = await db.query(queries.GET_PROF_ID, [sitterId]);

        // Se l'array rows è vuoto, significa che l'ID non esiste o non è un sitter
        if (sitterInfo.rows.length === 0) {
            return res.status(404).json({ error: 'Professionista non trovato' });
        }


        // Restituisce l'oggetto del singolo sitter (il primo elemento dell'array)
        res.status(200).json(sitterInfo.rows[0]);
    } catch (error) {
        console.error('Errore durante il recupero del singolo sitter:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};





