const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db =  require('../../../database/config')
const queries = require('../../../database/queries');



    exports.register = async (req, res) => {
        try {

            //verifica se l'email esiste già
            const userExists = await db.query(queries.CHECK_EMAIL, [req.body.email]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({error: 'Email già in uso'});
            }

            //cripta la password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            //inserisce l'utente
            if(req.body.zona != null) {
                const {nome,cognome,zona, email} = req.body;
                await db.query(
                    queries.INSERT_PROP,
                    [nome, cognome,zona, email, hashedPassword]
                );
            } else {
                const {nome,cognome,email } = req.body;
                await db.query(
                    queries.INSERT_PROF,
                    [nome, cognome, email, hashedPassword]
                );
            }


            res.status(201).json({message: 'Utente registrato con successo'});
        } catch (error) {
            console.error('Errore in registrazione:', error);
            res.status(500).json({error: 'Errore interno del server'});
        }
    };


    exports.login = async (req, res) => {
        try {
            const {email, password} = req.body;
            let ruolo = 'proprietario'

            // Cerca l'utente
            let userResult = await db.query(queries.FIND_PROP_EMAIL, [email]);
            if (userResult.rows.length === 0) {
                ruolo = 'professionista'
                userResult = await db.query(queries.FIND_PROF_EMAIL, [email])
            }
            if (userResult.rows.length === 0) {
                return res.status(401).json({error: 'Credenziali non valide'})
            }

            const user = userResult.rows[0];

            // Compara le password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({error: 'Credenziali non valide'});
            }
            // genera il token
            const token = jwt.sign(
                {id: user.id, ruolo: ruolo},
                process.env.JWT_SECRET,
                {expiresIn: '24h'}
            );

            res.status(200).json({token, ruolo: ruolo});
        } catch (error) {
            console.error('Errore in login:', error);
            res.status(500).json({error: 'Errore interno del server'});
        }
    };


    exports.getMe = async (req, res) => {
        try {
            // req.user viene popolato dal middleware che verifica il token

            let userResult = await db.query(
                queries.FIND_PROP_ID,
                [req.user.id]
            );
            if (userResult.rows.length === 0) {
                 userResult = await db.query(
                    queries.FIND_PROF_ID,
                    [req.user.id])
            }
            if (userResult.rows.length === 0) {
                return res.status(401).json({error: 'Utente non trovato'})
            }


            res.status(200).json(userResult.rows[0]);

        } catch (error) {
            console.error('Errore nel recupero utente:', error);
            res.status(500).json({error: 'Errore interno del server'});
        }
    };
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.ruolo; // 'proprietario' o 'professionista'

        const { nome, cognome, zona, email } = req.body;

        let query = '';
        let queryParams = [];

        if (userRole === 'proprietario') {
            query = queries.UPDATE_PROFILO_PROP;

            queryParams = [nome || null, cognome || null, zona || null, email || null, userId];
        } else if (userRole === 'professionista') {
            query = queries.UPDATE_PROFILO_PROF;

            queryParams = [nome || null, cognome || null, email || null, userId];
        } else {
            return res.status(403).json({ error: 'Ruolo non autorizzato' });
        }

        const result = await db.query(query, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        res.status(200).json({
            message: 'Profilo aggiornato con successo',
            user: result.rows[0] // Restituisce i nuovi dati aggiornati
        });

    } catch (error) {
        // Gestione specifica per il vincolo UNIQUE sull'email (Errore Postgres 23505)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Questa email è già associata a un altro account.' });
        }

        console.error('Errore durante l\'aggiornamento del profilo:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        // Questi dati vengono dal token JWT
        const userId = req.user.id;
        const userRole = req.user.ruolo; // Assicurati che nel login tu abbia salvato il ruolo nel token!

        // Dati inviati dal form nel frontend
        const { vecchia_password, nuova_password } = req.body;

        if (!vecchia_password || !nuova_password) {
            return res.status(400).json({ error: 'Devi inserire sia la vecchia che la nuova password' });
        }

        if (nuova_password.length < 6) {
            return res.status(400).json({ error: 'La nuova password deve contenere almeno 6 caratteri' });
        }

        let queryGetPass = '';
        let queryUpdatePass = '';

        if (userRole === 'proprietario') {
            queryGetPass = queries.GET_PASSWORD_PROP;
            queryUpdatePass = queries.UPDATE_PASSWORD_PROP;
        } else if (userRole === 'professionista') {
            queryGetPass = queries.GET_PASSWORD_PROF;
            queryUpdatePass = queries.UPDATE_PASSWORD_PROF;
        } else {
            return res.status(403).json({ error: 'Ruolo utente non valido' });
        }


        const { rows } = await db.query(queryGetPass, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        const hashSalvato = rows[0].password;

        const isMatch = await bcrypt.compare(vecchia_password, hashSalvato);

        if (!isMatch) {
            return res.status(401).json({ error: 'La vecchia password inserita non è corretta' });
        }

        const saltRounds = 10;
        const nuovoHash = await bcrypt.hash(nuova_password, saltRounds);

        await db.query(queryUpdatePass, [nuovoHash, userId]);

        res.status(200).json({ message: 'Password aggiornata con successo!' });

    } catch (error) {
        console.error('Errore durante il cambio password:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};



