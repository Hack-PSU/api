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
