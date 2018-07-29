/* eslint-disable no-logger,max-len */
const database = require('../services/database');
const authenticator = require('../services/auth');

const { Update: UpdateModel } = require('../models/Update');
const { Event: EventModel } = require('../models/Event');

const { sendNotification } = require('../services/functions');
const { logger } = require('../services/logging');

// TODO: Deprecated


/** ************** HELPER FUNCTIONS *************** */
module.exports = (io) => {
  const updates = io.of('/updates');
  const events = io.of('/events');

  /** ***************** SOCKET IO AUTHENTICATION MIDDLEWARE ********** */
  updates.use((socket, next) => {
    const { idtoken } = socket.handshake.headers;
    if (idtoken) {
      authenticator.checkAuthentication(idtoken)
        .then(() => next())
        .catch(next);
    } else {
      const error = new Error();
      error.body = { error: 'ID Token must be provided' };
      next(error);
    }
  });

  events.use((socket, next) => {
    const { idtoken } = socket.handshake.headers;
    if (idtoken) {
      authenticator.checkAuthentication(idtoken)
        .then(() => next())
        .catch(next);
    } else {
      const error = new Error();
      error.body = { error: 'ID Token must be provided' };
      next(error);
    }
  });


  /** ********************** LIVE UPDATE NAMESPACE ******************* */

  /**
   * On a new connection, the database will be queried and sent to the new connection
   */
  /**
   * @api {socket.io} /live/updates/:connection Get live updates
   * @apiVersion 0.3.1
   * @apiName Get live updates
   * @apiGroup Websocket
   * @apiPermission Hacker
   *
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} Array of live updates
   */
  updates.on('connection', (socket) => {
    database.getCurrentUpdates()
      .then((currentUpdates) => {
        socket.emit('update', currentUpdates);
      }).catch((err) => {
        socket.emit('error', err);
      });

    /**
     * @api {socket.io} /live/updates/:upstream-update Publish live update
     * @apiVersion 0.3.1
     * @apiName Publish live update
     * @apiGroup Websocket
     * @apiPermission Team Member
     *
     * @apiParam {string} title The title of the update
     * @apiParam {File} image The image to include with the update
     * @apiParam {string} message The message to send with the update
     * @apiParam {boolean} push_notification true if the live update should also be pushed to user devices
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Update} broadcasted on socket room 'update'
     */
    socket.on('upstream-update', (update) => {
      const { idtoken } = socket.handshake.headers;
      authenticator.checkAuthentication(idtoken)
        .then((decodedToken) => {
          if (decodedToken.admin && parseInt(decodedToken.privilege, 10) >= 2) {
            const mUpdate = new UpdateModel(update);
            if (mUpdate.title) {
              // Add to the database
              database.addNewUpdate(mUpdate.message, '', mUpdate.title)
                .then((result) => {
                  if (update.push_notification) {
                    sendNotification(update.title, update.message)
                      .catch(err1 => logger.error(err1));
                  }
                  socket.emit('upload-complete', 'Complete');
                  updates.emit('update', [result]);
                }).catch(errUpload => updates.emit('upload-error', errUpload));
            } else {
              socket.emit('upload-error', new Error('Title and image file must be provided'));
            }
          } else {
            socket.emit('error', new Error('Insufficient permissions'));
          }
        }).catch((err) => {
          socket.emit('error', err);
        });
    });

    /**
     *
     */
    socket.on('disconnect', () => {
    });
  });

  /** ******************** CALENDAR EVENTS NAMESPACE ****************** */
  /**
   * @api {socket.io} /live/events/:connection Get calendar events
   * @apiVersion 0.3.1
   * @apiName Get calendar events
   * @apiGroup Websocket
   * @apiPermission Hacker
   *
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} Array of calendar events
   */
  events.on('connection', (socket) => {
    database.getCurrentEvents()
      .then((allEvents) => {
        socket.emit('event', allEvents);
      }).catch(err => socket.emit('error', err));

    /**
     * @api {socket.io} /live/updates/:upstream-event Create new event
     * @apiVersion 0.3.1
     * @apiName Create new event
     * @apiGroup Websocket
     * @apiPermission Team Member
     *
     * @apiParam {string} eventLocation UID of the location that the event takes place at
     * @apiParam {number} eventStartTime The epoch start time of the event
     * @apiParam {number} eventEndTime The epoch end time of the event
     * @apiParam {string} eventTitle Title of the event
     * @apiParam {string} eventDescription Description of the event
     * @apiParam {enum} eventType The type of event. Possible types are: 'food', 'workshop', 'activity'
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Event} broadcasted on socket room 'event'
     *
     */
    socket.on('upstream-event', (message) => {
      const { idtoken } = socket.handshake.headers;
      authenticator.checkAuthentication(idtoken)
        .then((decodedToken) => {
          if (decodedToken.admin && parseInt(decodedToken.privilege, 10) >= 2) {
            const event = new EventModel(message);
            database.createEvent(event)
              .then((response) => {
                events.emit('event', Object.assign(event, response));
                events.emit('event-updated', Object.assign(event, response));
              })
              .catch(err => socket.emit('error', err));
          } else {
            events.emit('error', new Error('Insufficient permissions'));
          }
        }).catch(err => socket.emit('error', err));
    });


    /**
     * @api {socket.io} /live/updates/:update-event Update event
     * @apiVersion 0.3.1
     * @apiName Update event
     * @apiGroup Websocket
     * @apiPermission Team Member
     *
     * @apiParam {string} uid UID of the event to update
     * @apiParam {string} event_location UID of the location that the event takes place at
     * @apiParam {number} event_start_time The epoch start time of the event
     * @apiParam {number} event_end The epoch end time of the event
     * @apiParam {string} event_title Title of the event
     * @apiParam {string} event_description Description of the event
     * @apiParam {enum} event_type The type of event. Possible types are: 'food', 'workshop', 'activity'
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Event} broadcasted on socket room 'event-updated'
     */
    socket.on('update-event', (message) => {
      const { idtoken } = socket.handshake.headers;
      authenticator.checkAuthentication(idtoken)
        .then((decodedToken) => {
          if (decodedToken.admin && parseInt(decodedToken.privilege, 10) >= 2) {
            const event = new EventModel(message);
            const { uid } = event;
            event.uid = null;
            database.updateEvent(uid, event)
              .then(() => events.emit('event-updated', Object.assign(event, uid)))
              .catch(err => socket.emit('error', err));
          } else {
            socket.emit('error', new Error('Insufficient permissions'));
          }
        }).catch(err => socket.emit('error', err));
    });

    // socket.on('delete-event', (message) => {
    //   const { idtoken } = socket.handshake.headers;
    //   authenticator.checkAuthentication(idtoken)
    //     .then((decodedToken) => {
    //       if (decodedToken.admin && parseInt(decodedToken.privilege, 10) >= 2) {
    //         const uid = message;
    //         database.updateEvent(uid, event)
    //           .then(() => events.emit('event-updated', Object.assign(event, uid)))
    //           .catch(err => events.emit('error', err));
    //       } else {
    //         events.emit('error', new Error('Insufficient permissions'));
    //       }
    //     }).catch(err => events.emit('error', err));
    // });
  });
};

