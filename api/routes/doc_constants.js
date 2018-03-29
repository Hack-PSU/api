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