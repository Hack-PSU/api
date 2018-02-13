const express = require('express');
const router = express.Router();

/*************** HELPER FUNCTIONS ***************/



/*************** HELPER MIDDLEWARE **************/




/*************** ROUTES *************************/
router.ws('/', (ws, req) => {
    ws.on('message', (msg) => {
        console.log(msg);
        ws.send(msg);
    });
    console.log('socket', req.testing);
});

module.exports = router;