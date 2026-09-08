const db =  require('../../../database/config')
const queries = require('../../../database/queries');

exports.catalog = async (req, res) => {
    //aggiungi voto totale per ogni tipo maybe
  /*  try {
        let  rows  = []

        const animale = req.query.animale;
        const zona = req.query.zona;
        const servizio = req.query.servizio;
if(zona){
        if (animale&&servizio){
            rows = await db.query(queries.GET_CAT_PROF_AN_SERV,[zona,servizio,animale] )
        } else if(servizio) {
            rows = await db.query(queries.GET_CAT_PROF_SERVIZIO, [zona,servizio]);
        }
        else if(animale){
          rows = await db.query(queries.GET_CAT_PROF_ANIMALE, [zona,animale]);
        } else {
         rows =  await db.query(queries.GET_CAT_PROF, [zona]);
        }
        } else {
        return res.status(400).json({error: 'Specificare la zona'})
        }

       if (rows.length === 0) {
          return res.status(404).json({error: 'Non abbiamo trovato professionisti adatti'})
     }
        res.status(200).json(rows.rows);
    } catch (error) {
        console.error('Errore durante il recupero dei sitter:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }*/
    try {
        const { zona, servizio, animale } = req.query;

        let query = queries.GET_CAT;

        const params = [];
        let paramIndex = 1;

        if (zona) {
            query += ` AND s.zona ILIKE $${paramIndex++}`;
            params.push(`%${zona}%`);
        }
        if (servizio) {
            query += ` AND s.tipologia = $${paramIndex++}`;
            params.push(servizio);
        }
        if (animale) {
            query += ` AND s.tipo_animale = $${paramIndex++}`;
            params.push(animale);
        }

        // Raggruppa per ID del servizio specifico per calcolarne la media dedicata
        query += ` GROUP BY s.id, p.id, p.nome, p.cognome ORDER BY valutazione_media DESC`;

        const result = await db.query(query, params);
        const serviziList = result.rows || result;

        res.json(serviziList);
    } catch (error) {
        console.error('Errore nel recupero del catalogo:', error);
        res.status(500).json({ error: 'Errore durante il recupero dei dati del catalogo' });
    }
};

exports.getSitterById = async (req, res) => {
    try {
        const sitterId = req.params.id;

        const sitterInfo = await db.query(queries.GET_PROF_ID, [sitterId]);

        if (sitterInfo.rows.length === 0) {
            return res.status(404).json({ error: 'Professionista non trovato' });
        }

        res.status(200).json(sitterInfo.rows[0]);
    } catch (error) {
        console.error('Errore durante il recupero del singolo sitter:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

exports.best = async (req, res) => {
    try {
        const query = queries.GET_3_BEST;

        const result = await db.query(query);

        res.json(result.rows);
    } catch (error) {
        console.error('Errore nel recupero dei top sitter:', error);
        res.status(500).json({ error: 'Errore durante il recupero dei professionisti in evidenza' });
    }
};





