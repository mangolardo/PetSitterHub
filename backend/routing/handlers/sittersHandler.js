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
        if (req.query.contains('tipo_animale')){
            const {zona, servizio,animale} = req.query;
            rows = await db.query(queries.GET_CAT_PROF,[zona,servizio,animale] )
        } else {
            const { zona , servizio } = req.query;
            rows = await db.query(queries.GET_CAT_PROF, [zona,servizio]);
        }
        if (rows.length === 0) {
            return res.status(401).json({error: 'Utente non trovato'})
        }
        res.status(200).json(rows);
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
exports.reviews = async (req, res) => {
    try {
        const sitterId = req.params.id;

        const { rows } = await db.query(queries.GET_RECENSIONI, [sitterId]);

        // REST Best Practice: Se non ci sono recensioni, non restituiamo un errore 404,
        // ma un array vuoto (200 OK). Così il frontend sa che la richiesta
        // è andata a buon fine, ma semplicemente non ci sono dati da mostrare.
        res.status(200).json(rows);

    } catch (error) {
        console.error('Errore durante il recupero delle recensioni:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

exports.services = async (req, res) => {
        try {
            const idSitter= req.params.id;

            const { rows } = await db.query(queries.GET_SERVIZI, [idSitter]);

            // Se l'array è vuoto, significa che il sitter non ha ancora configurato i suoi servizi
            // Restituiamo comunque 200 OK con un array vuoto, è la best practice.
            res.status(200).json(rows);

        } catch (error) {
            console.error('Errore durante il recupero dei servizi:', error);
            res.status(500).json({ error: 'Errore interno del server' });
        }
    };
exports.addService = async (req, res) => {
    try {
        const professionistaId = req.user.id; // Estratto dal token JWT
        const { tipologia, tariffa, tipo_animale, zona } = req.body;

        // Validazione base dei campi obbligatori
        if (!tipologia || !tariffa || !tipo_animale || !zona) {
            return res.status(400).json({ error: 'Tutti i campi (tipologia, tariffa, tipo_animale, zona) sono obbligatori' });
        }

        // Validazione sul prezzo (come richiesto dal CHECK nel DB)
        if (tariffa < 0) {
            return res.status(400).json({ error: 'La tariffa non può essere negativa' });
        }

        const result = await db.query(queries.ADD_SERVICE, [
            tipologia,
            tariffa,
            tipo_animale,
            zona,
            professionistaId
        ]);

        res.status(201).json({
            message: 'Servizio creato con successo',
            servizio: result.rows[0]
        });

    } catch (error) {
        console.error('Errore addService:', error);
        res.status(500).json({ error: 'Errore interno durante la creazione del servizio' });
    }
};
exports.deleteService = async (req, res) => {
    try {
        const professionistaId = req.user.id; // Estratto dal token JWT
        const idServizio = req.params.id;     // L'ID del servizio da eliminare, preso dall'URL

        const result = await db.query(queries.DELETE_SERVICE, [idServizio, professionistaId]);

        // Se rowCount è 0, significa che l'ID del servizio non esiste
        // OPPURE che il servizio esiste ma appartiene a un altro professionista (sicurezza!)
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Servizio non trovato o non sei autorizzato a rimuoverlo' });
        }

        res.status(200).json({
            message: 'Servizio eliminato con successo. Tutte le relative disponibilità sono state rimosse.'
        });

    } catch (error) {
        console.error('Errore deleteService:', error);
        res.status(500).json({ error: 'Errore interno durante la cancellazione del servizio' });
    }
};


