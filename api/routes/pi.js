const express = require('express');
const router = express.Router();
const database = require('../helpers/database');

/*************** HELPER FUNCTIONS ***************/



/*************** HELPER MIDDLEWARE **************/




/*************** ROUTES *************************/
router.ws('/', (ws) => {
    ws.on('message', (msg) => {
        console.log(msg);
        ws.send(msg);
    });
});

router.ws('/sql', (ws, req) => {
   ws.on('message', (msg) => {
       console.log(msg);
       database.writePiMessage(msg)
           .then((msg) => {
               ws.send(msg);
           }).catch((err) => {
               ws.send(err);
       });
   })
});

module.exports = router;