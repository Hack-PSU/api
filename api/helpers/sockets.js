module.exports = function(io) {
    /******************* SOCKET IO AUTHENTICATION MIDDLEWARE ***********/
    // TODO: Socket IO auth middleware


    /************************ LIVE UPDATE NAMESPACE ********************/
    const updates = io.of('/updates');
    updates.on('connection', (socket) => {
        socket.emit('update', () => {
           // TODO: Send all current updates
        });

        socket.on('upstream-update', (message) => {
            // TODO: Store update in database
            io.emit('update', message);
        });
    });

    /********************** CALENDAR EVENTS NAMESPACE *******************/
    const events = io.of('/events');
    events.on('connection', (socket) => {
        socket.emit('event', () => {
            // TODO: Send all current updates
        });

        socket.on('upstream-event', (message) => {
            // TODO: Store update in database
            io.emit('event', message);
        });
    });
};