/**
 * @apiDefine IllegalArgumentError
 *
 * @apiError IllegalArgument The passed argument was not found or illegal
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 IllegalArgument
 *     {
 *       "error": "The passed argument was illegal"
 *     }
 */

/**
 * @apiDefine AuthArgumentRequired
 *
 * @apiHeader (Headers) {String} idtoken The Firebase IdToken
 */
/**
 * @apiDefine ApiKeyArgumentRequired
 *
 * @apiHeader (Headers) {String} apikey The Api Key
 * @apiHeader (Headers) {String} macaddr MAC address of the device
 */

/**
 * @apiDefine UserPermission Regular logged in user
 * A logged in user with or without firebase privilege
 */
/**
 * @apiDefine AdminPermission Administrator
 * A logged in administrator with privilege level 1 (Volunteer)
 */
/**
 * @apiDefine TeamMemberPermission Hackathon Team Member
 * A logged in administrator with privilege level 2 (Team Member)
 */
/**
 * @apiDefine DirectorPermission Hackathon Team Director
 * A logged in administrator with privilege level 3 (Director)
 */
/**
 * @apiDefine TechnologyAdminPermission Hackathon Technology Team Administrator
 * A logged in administrator with privilege level 4 (Full privilege)
 */
/**
 * @apiDefine ScannerPermission Hackathon Scanner
 * An authenticated scanner with a valid API key
 */
/**
 * @apiDefine ResponseBodyDescription
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *     {
 *        "api_response": "Success",
 *        "status": 200,
 *        "body": {
 *          "result": "Success",
 *          "data": {...}
 *        }
 *      }
 */
/**
 * @apiDefine RequestOpts
 * @apiParam {Boolean} [allHackathons] Get data for all hackathons. Defaults to false.
 * @apiParam {Boolean} [ignoreCache] Force a fresh query to retrieve data
 * @apiParam {Number} [count] Number of responses to return
 * @apiParam {String} [hackathon] Uid of hackathon to get results by. byHackathon must be true
 * @apiParam {Number} [startAt] Offset to paginate results
 */
/**
 * @apiDefine RequestOptsCount
 * @apiParam {Boolean} [allHackathons] Get data for all hackathons. Defaults to false.
 * @apiParam {Boolean} [ignoreCache]  Force a fresh query to retrieve data
 * @apiParam {String} [hackathon] Uid of hackathon to get results by. byHackathon must be true
 */
