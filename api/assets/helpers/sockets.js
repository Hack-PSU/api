/* eslint-disable no-console */
const aws = require('aws-sdk');
const base64 = require('base64-stream');
const { Readable } = require('stream');

const constants = require('./constants');
const database = require('./database');
const authenticator = require('./auth');

const UpdateModel = require('../models/UpdateModel');

const { sendNotification } = require('./functions');

aws.config.update({
  accessKeyId: constants.s3Connection.accessKeyId,
  secretAccessKey: constants.s3Connection.secretAccessKey,
  region: constants.s3Connection.region,
});
const s3 = new aws.S3();


/** ************** HELPER FUNCTIONS *************** */
/**
 *
 * @param {String} dataString base64 encoded string
 * @return {NodeJS.WritableStream}
 */
function parseFile(dataString) {
  const readable = new Readable();
  readable.push(dataString.split(',')[1]);
  readable.push(null);
  return readable.pipe(base64.decode());
}

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
  updates.on('connection', (socket) => {
    database.getCurrentUpdates()
      .then((currentUpdates) => {
        socket.emit('update', currentUpdates);
      }).catch((err) => {
        socket.emit('error', err);
      });

    /**
     * @api {websocket} /live/update Get live updates
     * @apiVersion 0.2.2
     * @apiName Publish live update
     * @apiGroup Admin
     * @apiPermission Team Member
     *
     * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
     * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Array} Array of registered hackers
     */
    socket.on('upstream-update', (update) => {
      const { idtoken } = socket.handshake.headers;
      authenticator.checkAuthentication(idtoken)
        .then((decodedToken) => {
          if (decodedToken.admin && parseInt(decodedToken.privilege, 10) >= 2) {
            const mUpdate = new UpdateModel(update);
            if (mUpdate.title && mUpdate.image && mUpdate.image.type && mUpdate.image.type.match(/image\/.*/g)) {
              const listener = (image) => {
                socket.removeListener('image', listener);
                // S3 Parameters
                const params = {
                  ACL: 'public-read',
                  Body: parseFile(image),
                  Key: mUpdate.image.name,
                  Bucket: 'live-updates-s2018',
                  ServerSideEncryption: 'AES256',
                };

                // S3 concurrency
                const uploadRequest = s3.upload(params, {
                  partSize: 10 * 1024 * 1024, queueSize: 4,
                }, (err, data) => {
                  if (err) {
                    console.error(err);
                    updates.emit('upload-error', err);
                  } else {
                    // Add to the database
                    database.addNewUpdate(mUpdate.message, data.Location, mUpdate.title)
                      .then((result) => {
                        if (update.push_notification) {
                          sendNotification(update.title, update.message)
                            .catch(err1 => console.error(err1));
                        }
                        updates.emit('upload-complete', 'Complete');
                        updates.emit('update', [result]);
                      }).catch(errUpload => updates.emit('upload-error', errUpload));
                  }
                });
                uploadRequest.on('httpUploadProgress', (progress) => {
                  updates.emit('upload-progress', { uploaded: progress.loaded, total: progress.total });
                });
              };
              socket.on('image', listener);
            } else {
              updates.emit('upload-error', new Error('Title and image file must be provided'));
            }
          } else {
            updates.emit('error', new Error('Insufficient permissions'));
          }
        }).catch((err) => {
          updates.emit('error', err);
        });
    });

    /**
     *
     */
    socket.on('disconnect', () => {
    });
  });

  /** ******************** CALENDAR EVENTS NAMESPACE ****************** */
  events.on('connection', (socket) => {
    database.getCurrentEvents()
      .then((allEvents) => {
        socket.emit('event', allEvents);
      });

    socket.on('upstream-event', (message) => {
      // TODO: Store update in database
      io.emit('event', message);
    });
  });
};

