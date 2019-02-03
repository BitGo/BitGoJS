const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const Enterprise = require('./enterprise');

class Enterprises {

  constructor(bitgo, baseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  list(params, callback) {
    return co(function *() {

      const response = yield this.bitgo.get(this.bitgo.url('/enterprise')).result();
      return response.enterprises.map((e) => {
        // instantiate a new object for each enterprise
        return new Enterprise(this.bitgo, this.baseCoin, e);
      });

    }).call(this).asCallback(callback);
  }

  get(params, callback) {
    return co(function *() {

      const enterpriseId = params.id;
      if (_.isUndefined(enterpriseId)) {
        throw new Error('id must not be empty');
      }
      if (!_.isString(enterpriseId)) {
        throw new Error('id must be hexadecimal enterprise ID');
      }

      const enterpriseData = yield this.bitgo.get(this.bitgo.url(`/enterprise/${enterpriseId}`)).result();
      return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);

    }).call(this).asCallback(callback);
  }

  create(params, callback) {
    return co(function *() {

      const enterpriseData = yield this.bitgo.post(this.bitgo.url(`/enterprise`))
      .send(params)
      .result();
      return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);

    }).call(this).asCallback(callback);
  }

}

module.exports = Enterprises;
