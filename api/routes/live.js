/* eslint-disable consistent-return */
const express = require('express');
const { verifyAuthMiddleware, verifyACL } = require('../services/auth');
const { errorHandler500, streamHandler, sendNotification } = require('../services/functions');
const { Update } = require('../models/Update');
const { Event } = require('../models/Event');
const HttpError = require('../JSCommon/HttpError');
const { logger } = require('../services/logging');

const router = express.Router();

/** *********** HELPER FUNCTIONS ************* */


/** ************ ROUTING MIDDLEWARE ********************** */

router.use(verifyAuthMiddleware);

/** ********* UPDATES ******** */
/**
 * @api {get} /live/updates/ Get all the updates
 * @apiVersion 1.0.0
 * @apiName Get Updates
 * @apiGroup Updates
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of current updates.
 */
// TODO: Add test
router.get('/updates', (req, res, next) => {
  Update.getAll(req.rtdb, req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /live/updates/reference Get the db reference for updates
 * @apiVersion 1.0.0
 * @apiName Get Update reference
 * @apiPermission UserPermission
 * @apiGroup Updates
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {String} The database reference to the current updates.
 */
router.get('/updates/reference', (req, res, next) => {
  Update.getReference(req.rtdb, req.uow)
    .then(reference => res.status(200).send({ reference }))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /live/updates/ Add a new update
 * @apiVersion 1.0.0
 * @apiName New update
 * @apiGroup Updates
 * @apiPermission TeamMemberPermission
 *
 * @apiParam {String} updateTitle - The title of the update
 * @apiParam {String} updateText - The text of the update
 * @apiParam {String} [updateImage] - The url of the image part of the update.
 * @apiParam {Boolean} [pushNotification] - Whether to send out a push notification with this update.
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
// TODO: Add test
router.post('/updates', verifyACL(2), (req, res, next) => {
  if (!req.body || !req.body.updateTitle) {
    return next(new HttpError('Update title must be provided', 400));
  }
  if (!req.body.updateText) {
    return next(new HttpError('Update message must be provided', 400));
  }
  if (!req.body.updateImage) {
    req.body.updateImage = 'https://app.hackpsu.org/assets/images/logo.svg';
  }
  const generatedUpdate = new Update(req.body, req.rtdb, req.uow);
  generatedUpdate
    .add()
    .then((update) => {
      // Send out push notification and pass along stream
      if (!generatedUpdate.push_notification) {
        return Promise.resolve(update);
      }
      return sendNotification(generatedUpdate.update_title, generatedUpdate.update_text)
        .then(() => update)
        .catch((error) => {
          logger.error(error);
          return update;
        });
    })
    .then(update => res.status(200).send(update))
    .catch(err => errorHandler500(err, next));
});

/** ********** EVENTS ******** */
/**
 * @api {get} /live/events/ Get all the events.
 * @apiVersion 1.0.0
 * @apiName Get events
 * @apiGroup Events
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of current events.
 */
// TODO: Add test
router.get('/events', (req, res, next) => {
  Event.getAll(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /live/event/ Add a new event.
 * @apiVersion 1.0.0
 * @apiName New Event
 * @apiGroup Events
 * @apiPermission TeamMemberPermission
 *
 * @apiParam {String} eventLocation - The uid of the location for the event.
 * @apiParam {String} eventStartTime - The unix time for the start of the event.
 * @apiParam {String} eventEndTime - The unix time for the start of the event.
 * @apiParam {String} eventTitle - The title of the event.
 * @apiParam {String} eventDescription - The description of the event.
 * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
// TODO: Add test
router.post('/event', verifyACL(2), (req, res, next) => {
  if (!req.body || !req.body.eventLocation) {
    return next(new HttpError('Event location must be provided', 400));
  }
  if (!req.body.eventStartTime) {
    return next(new HttpError('Event start time must be provided', 400));
  }
  if (!req.body.eventEndTime) {
    return next(new HttpError('Event end time must be provided', 400));
  }
  if (!req.body.eventTitle) {
    return next(new HttpError('Event title must be provided', 400));
  }
  if (!req.body.eventDescription) {
    return next(new HttpError('Event description must be provided', 400));
  }
  if (!req.body.eventType) {
    return next(new HttpError('Event type must be provided', 400));
  }
  const event = new Event(req.body, req.uow);
  event
    .add()
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {put} /live/event/ Update an existing event.
 * @apiVersion 1.0.0
 * @apiName Update Event
 * @apiGroup Events
 * @apiPermission TeamMemberPermission
 *
 * @apiParam {String} uid - The uid of the event.
 * @apiParam {String} eventLocation - The uid of the location for the event.
 * @apiParam {String} eventStartTime - The unix time for the start of the event.
 * @apiParam {String} eventEndTime - The unix time for the start of the event.
 * @apiParam {String} eventTitle - The title of the event.
 * @apiParam {String} eventDescription - The description of the event.
 * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
// TODO: Add test
router.put('/event', verifyACL(2), (req, res, next) => {
  if (!req.body || !req.body.event) {
    return next(new HttpError('No event provided to update', 400));
  }
  const event = new Event(req.body.event, req.uow);
  event.update()
    .then(() => res.status(200).send({ message: 'Success' }))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /live/event/delete Delete an existing event.
 * @apiVersion 1.0.0
 * @apiName Update Event
 * @apiGroup Events
 * @apiPermission TeamMemberPermission
 *
 * @apiParam {String} uid - The uid of the event.

 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
// TODO: Add test
router.post('/event/delete', verifyACL(2), (req, res, next) => {
  if (!req.body || !req.body.uid) {
    return next(new HttpError('Event uid must be provided'), 400);
  }
  const event = new Event({ uid: req.body.uid }, req.uow);
  event.delete()
    .then(() => res.status(200).send({ message: 'Success' }))
    .catch(err => errorHandler500(err, next));
});

module.exports = router;
