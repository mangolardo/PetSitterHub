const db = require("../../database/config");
const queries = require("../../database/queries");

exports.getReviews = async (req, res) => {
    try {
        const idProfessionista = req.params.id_professionista;
        const { rows } = await db.query(queries.GET_RECENSIONI_PROFESSIONISTA, [idProfessionista]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Errore getRecensioni:', error);
        res.status(500).json({ error: 'Errore durante il recupero delle recensioni' });
    }
};
exports.createReview= async (req, res) => {
    try {
        const idProprietario = req.user.id;
        const { valutazione, commento, id_servizio } = req.body;
        //checks da togliere forse
        if (!valutazione || !id_servizio) {
            return res.status(400).json({ error: 'Valutazione e ID servizio sono obbligatori' });
        }
        if (valutazione < 1 || valutazione > 5) {
            return res.status(400).json({ error: 'La valutazione deve essere compresa tra 1 e 5' });
        }

        const checkPrenotazione = await db.query(queries.CHECK_PRENOTAZIONE_CONFERMATA, [
            idProprietario,
            id_servizio
        ]);

        if (checkPrenotazione.rowCount === 0) {
            return res.status(403).json({
                error: 'Azione non consentita. Puoi recensire solo i servizi di cui hai usufruito.'
            });
        }

        const { rows } = await db.query(queries.CREATE_RECENSIONE, [
            valutazione,
            commento || null,
            id_servizio,
            idProprietario
        ]);

        res.status(201).json({
            message: 'Recensione pubblicata con successo',
            recensione: rows[0]
        });

    } catch (error) {
        console.error('Errore createRecensione:', error);
        res.status(500).json({ error: 'Errore interno durante il salvataggio della recensione' });
    }
};
exports.deleteReview = async (req, res) => {
    try {
        const idProprietario = req.user.id;
        const idRecensione = req.params.id;

        const { rowCount } = await db.query(queries.DELETE_RECENSIONE, [idRecensione, idProprietario]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Recensione non trovata o non autorizzato' });
        }

        res.status(200).json({ message: 'Recensione eliminata con successo' });
    } catch (error) {
        console.error('Errore deleteRecensione:', error);
        res.status(500).json({ error: 'Errore durante la cancellazione della recensione' });
    }
};

exports.getServiceReviews = async (req, res) => {
    try {
        const idServizio = req.params.id_service;
        const { rows } = await db.query(queries.GET_RECENSIONI_SERVIZIO, [idServizio]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Errore getRecensioni:', error);
        res.status(500).json({ error: 'Errore durante il recupero delle recensioni' });
    }
};