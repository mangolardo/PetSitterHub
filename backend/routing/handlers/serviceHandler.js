const db = require("../../../database/config");
const queries = require("../../../database/queries");

exports.getService = async (req, res) => {
    try {
        const idServizio = req.params.id_service; //

        const {rows} = await db.query(queries.GET_SERVICE_BY_ID, [idServizio]);
        if (rows.length === 0) {
            return res.status(404).json({error: 'Servizio non trovato'});
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Errore getServiceById:', error);
        res.status(500).json({error: 'Errore interno durante il recupero del servizio'});
    }
}
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