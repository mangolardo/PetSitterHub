const db = require("../../database/config");
const queries = require("../../database/queries");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.pay = async (req, res) => {
    let client;
    try {
        const { id_prenotazione, importo, metodo, numero_carta } = req.body;

        client = await db.connect();
        await client.query('BEGIN');
        const checkPrenotazione = await client.query(
            queries.GET_PRENOTAZIONE_STATO,
            [id_prenotazione]
        );

        if (checkPrenotazione.rows.length === 0 || checkPrenotazione.rows[0].stato !== 'in_attesa') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Prenotazione scaduta o già pagata. Riprova.' });
        }

        await sleep(2000);

        if (numero_carta.toString().endsWith('6767')) {
            await client.query(queries.CREATE_PAYMENT, [metodo || 'carta', importo, id_prenotazione, 'completato']);

            await client.query(queries.CONFIRM_BOOKING, [id_prenotazione]);
            await client.query('COMMIT');
            return res.status(200).json({ success: true, message: 'Pagamento e prenotazione confermati!' });
        } else {
            await client.query(queries.CREATE_PAYMENT, [metodo || 'carta', importo, id_prenotazione, 'fallito']);
            await client.query('COMMIT'); //

            return res.status(402).json({ success: false, error: 'Pagamento rifiutato dalla banca.' });
        }
    } catch (error) {
        console.log(error)
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ error: 'Errore interno' });
    } finally {
        if (client) client.release();
    }
};