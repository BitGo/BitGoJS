// User webhook handler for v2 coins and tokens

const common = require('../common');
const _ = require('lodash');

const Webhooks = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
};

/**
 * Fetch list of user webhooks
 *
 * @param callback
 * @returns {*}
 */
Webhooks.prototype.list = function(callback) {
  return this.bitgo.get(this.baseCoin.url('/webhooks'))
  .result()
  .nodeify(callback);
};

/**
 * Add new user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Webhooks.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.post(this.baseCoin.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Remove user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Webhooks.prototype.remove = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.del(this.baseCoin.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Fetch list of webhook notifications for the user
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Webhooks.prototype.listNotifications = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};
  if (params.prevId) {
    if (!_.isString(params.prevId)) {
      throw new Error('invalid prevId argument, expecting string');
    }
    query.prevId = params.prevId;
  }
  if (params.limit) {
    if (!_.isNumber(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    query.limit = params.limit;
  }

  return this.bitgo.get(this.baseCoin.url('/webhooks/notifications'))
  .query(query)
  .result()
  .nodeify(callback);
};

/**
 * Simulate a user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Webhooks.prototype.simulate = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['webhookId', 'blockId'], [], callback);

  const webhookId = params.webhookId;
  return this.bitgo.post(this.baseCoin.url('/webhooks/' + webhookId + '/simulate'))
  .send(params)
  .result()
  .nodeify(callback);
};

module.exports = Webhooks;
