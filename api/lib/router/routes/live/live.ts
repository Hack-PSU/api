/* eslint-disable consistent-return */
import express from 'express';
import { IExpressController } from '../..';
import { Event } from '../../../models/event/Event';
import { ParentRouter } from '../../router-types';

const router = express.Router();

export class LiveController extends ParentRouter implements IExpressController {
  public router: express.Router;
  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    LiveController.registeredRoutes.forEach((subrouter, key) => {
      app.use(key, subrouter.router);
    });
  }
}

/** *********** HELPER FUNCTIONS ************* */

/** *********** UNAUTHENTICATED ROUTES ******* */

router.get('/events', (req, res, next) => {
  Event.getAll(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /live/updates/reference Get the db reference for updates
 * @apiVersion 1.0.0
 * @apiName Get Update reference
 * @apiGroup Updates
 *
 * @apiSuccess {String} The database reference to the current updates.
 */
router.get('/updates/reference', (req, res, next) => {
  Update.getReference(req.rtdb, req.uow)
    .then(reference => res.status(200).send({ reference }))
    .catch(err => errorHandler500(err, next));
});

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
router.get('/updates', (req, res, next) => {
  Update.getAll(req.rtdb, req.uow)
    .then(stream => streamHandler(stream, res, next))
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
