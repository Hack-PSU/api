const express = require('express');
const authenticator = require("../helpers/auth");

const database = require('../helpers/database');

const router = express.Router();

/************* HELPER FUNCTIONS **************/
/**
 * User authentication middleware
 */
router.use((req, res, next) => {
    if (req.headers.idtoken) {
        authenticator.checkAuthentication(req.headers.idtoken)
            .then((decodedToken) => {
                res.locals.user = decodedToken;
                next();
            }).catch((err) => {
            const error = new Error();
            error.status = 401;
            error.body = err.message;
            next(error);
        });
    } else {
        const error = new Error();
        error.status = 401;
        error.body = {error: 'ID Token must be provided'};
        next(error);
    }
});

/************** ROUTING MIDDLEWARE ***********************/




module.exports = router;