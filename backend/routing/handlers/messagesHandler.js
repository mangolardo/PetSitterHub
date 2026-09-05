const db = require("../../../database/config");
const queries = require("../../../database/queries");

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.ruolo;

        let query = '';
        if (userRole === 'proprietario') {
            query = queries.GET_CONVERSATIONS_PROPRIETARIO;
        } else if (userRole === 'professionista') {
            query = queries.GET_CONVERSATIONS_PROFESSIONISTA;
        }

        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Errore getConversations:', error);
        res.status(500).json({ error: 'Errore nel recupero delle conversazioni' });
    }
};
exports.initConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.ruolo;

        let idProprietario, idProfessionista;

        if (userRole === 'proprietario') {
            idProprietario = userId;
            idProfessionista = req.body.id_destinatario; // Inviato dal frontend
        } else if (userRole === 'professionista') {
            idProfessionista = userId;
            idProprietario = req.body.id_destinatario;
        } else {
            return res.status(403).json({ error: 'Ruolo non valido' });
        }

        if (!idProprietario || !idProfessionista) {
            return res.status(400).json({ error: 'ID destinatario mancante' });
        }

        const { rows } = await db.query(queries.INITIATE_CONVERSATION, [idProprietario, idProfessionista]);

        res.status(200).json({
            id_conversazione: rows[0].id
        });

    } catch (error) {
        console.error('Errore initiateConversation:', error);
        res.status(500).json({ error: 'Errore durante l\'apertura della chat' });
    }
};
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const idConversazione = req.params.id_conversazione;

        const checkAccess = await db.query(queries.CHECK_CONVERSATION_ACCESS, [idConversazione, userId]);

        if (checkAccess.rowCount === 0) {
            return res.status(403).json({ error: 'Accesso negato a questa conversazione' });
        }

        const { rows } = await db.query(queries.GET_MESSAGES, [idConversazione]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Errore getMessages:', error);
        res.status(500).json({ error: 'Errore durante la lettura dei messaggi' });
    }
};
exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.ruolo;
        const idConversazione = req.params.id_conversazione;
        const { testo } = req.body;

        if (!testo || testo.trim() === '') {
            return res.status(400).json({ error: 'Il testo del messaggio non può essere vuoto' });
        }

        const checkAccess = await db.query(queries.CHECK_CONVERSATION_ACCESS, [idConversazione, userId]);
        if (checkAccess.rowCount === 0) {
            return res.status(403).json({ error: 'Accesso negato' });
        }

        const { rows } = await db.query(queries.INSERT_MESSAGE, [
            idConversazione,
            userId,
            userRole,
            testo
        ]);

        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Errore sendMessage:', error);
        res.status(500).json({ error: 'Errore durante l\'invio del messaggio' });
    }
};
exports.deleteMessage = async (req, res) => {
    try {
        const idMessaggio = req.params.id_messaggio;

        const userId = req.user.id;
        const userRole = req.user.ruolo;

        const { rowCount } = await db.query(queries.DELETE_MESSAGE, [
            idMessaggio,
            userId,
            userRole
        ]);

        if (rowCount === 0) {
            return res.status(403).json({
                error: 'Messaggio non trovato o non sei autorizzato a cancellarlo'
            });
        }

        res.status(200).json({ message: 'Messaggio eliminato con successo' });

    } catch (error) {
        console.error('Errore deleteMessage:', error);
        res.status(500).json({ error: 'Errore interno durante la cancellazione del messaggio' });
    }
};
