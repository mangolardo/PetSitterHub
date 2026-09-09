const db = require("../../database/config");
const queries = require("../../database/queries");

exports.getAvailabilities = async (req, res) => {
    try {

        const idServizio = req.params.id_service;

        const { rows } = await db.query(queries.GET_DISP, [idServizio]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Errore getSitterAvailability:', error);
        res.status(500).json({ error: 'Errore durante il recupero delle disponibilità' });
    }
};
exports.addAvailability = async (req, res) => {
    try {
        const professionistaId = req.user.id; // Dal token JWT
        const id_servizio = req.params.id_service
        const { data_inizio, data_fine } = req.body;

        if (new Date(data_inizio) >= new Date(data_fine)) {
            return res.status(400).json({ error: 'La data di fine deve essere successiva a quella di inizio' });
        }
        const ownershipCheck = await db.query(queries.CHECK_SERVICE_OWNERSHIP, [id_servizio, professionistaId]);

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Azione non consentita. Questo servizio non ti appartiene o non esiste.' });
        }

        const result = await db.query(queries.ADD_AVAILABILITY, [data_inizio, data_fine, id_servizio]);

        res.status(201).json({
            message: 'Disponibilità aggiunta con successo',
            disponibilita: result.rows[0]
        });

    } catch (error) {
        console.error('Errore addDisponibilita:', error);
        res.status(500).json({ error: 'Errore durante il salvataggio della disponibilità' });
    }
};

exports.deleteAvailability = async (req, res) => {
    try {
        const professionistaId = req.user.id; // Dal token JWT
        const idDisponibilita = req.params.id;

        const result = await db.query(queries.DELETE_AVAILABILITY, [idDisponibilita, professionistaId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Disponibilità non trovata o non sei autorizzato a rimuoverla' });
        }

        res.status(200).json({ message: 'Disponibilità rimossa con successo' });
    } catch (error) {
        console.error('Errore deleteDisponibilita:', error);
        res.status(500).json({ error: 'Errore durante la cancellazione' });
    }
};