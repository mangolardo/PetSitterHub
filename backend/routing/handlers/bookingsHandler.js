const db = require("../../../database/config");
const queries = require("../../../database/queries");

exports.book = async (req, res) => {
    let client;

    try {

        const idProprietario = req.user.id;



        const id_disponibilita  = req.params.id_availability;
        if (!id_disponibilita) {
            return res.status(400).json({ error: 'ID disponibilità mancante' });
        }
        client = await db.connect();

        await client.query('BEGIN');

        const lockResult = await client.query(queries.LOCK_AVAILABILITY, [id_disponibilita]);

        if (lockResult.rowCount === 0) {
            await client.query('ROLLBACK'); // Annulliamo tutto
            return res.status(409).json({ error: 'Siamo spiacenti, questo orario è appena stato prenotato da un altro utente.' });
        }

        const { id_servizio, data_inizio, data_fine } = lockResult.rows[0];

        const bookingResult = await client.query(queries.CREATE_BOOKING, [
            idProprietario,
            id_servizio,
            data_inizio,
            data_fine
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Prenotazione confermata con successo!',
            prenotazione: bookingResult.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Errore durante la prenotazione dello slot:', error);
        res.status(500).json({ error: 'Errore interno del server durante la prenotazione' });

    } finally {
        if (client) {
            client.release();
        }
    }
};

exports.getBookings = async (req, res) => {
    try {
        const idUtente = req.user.id;
        let { rows } = []
        let userResult = await db.query(
            queries.FIND_PROP_ID,
            [req.user.id]
        );
        if (userResult.rows.length === 0) {
            userResult = await db.query(
                queries.FIND_PROF_ID,
                [req.user.id])
        } else { rows  = await db.query(queries.GET_PRENOTAZIONI_PROP, [idUtente]);}
        if (userResult.rows.length === 0) {
            return res.status(401).json({error: 'Utente non trovato'})
        } else  { rows  = await db.query(queries.GET_PRENOTAZIONI_PROF, [idUtente]);}
        res.status(200).json(rows.rows);

    } catch (error) {
        console.error('Errore durante il recupero delle prenotazioni:', error);
        res.status(500).json({ error: 'Errore interno del server durante la lettura delle prenotazioni' });
    }
};
exports.getBooking = async (req, res) => {
    try {
        const idUtente = req.user.id;
        const idBooking = req.params.id
        let { rows } = []
        let userResult = await db.query(
            queries.FIND_PROP_ID,
            [req.user.id]
        );
        if (userResult.rows.length === 0) {
            userResult = await db.query(
                queries.FIND_PROF_ID,
                [req.user.id])
        } else { rows  = await db.query(queries.GET_PRENOTAZIONE_PROP, [idUtente,idBooking]);}
        if (userResult.rows.length === 0) {
            return res.status(401).json({error: 'Utente non trovato'})
        } else  { rows  = await db.query(queries.GET_PRENOTAZIONE_PROF, [idUtente,idBooking]);}
        res.status(200).json(rows.rows);

    } catch (error) {
        console.error('Errore durante il recupero delle prenotazioni:', error);
        res.status(500).json({ error: 'Errore interno del server durante la lettura delle prenotazioni' });
    }
};