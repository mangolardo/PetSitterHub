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
            if(req.body.contains('zona')) {
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
            };

            const user = userResult.rows[0];

            // Compara le password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({error: 'Credenziali non valide'});
            }
            //test
console.log(user)
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


