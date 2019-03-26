const Susd = require('./susd');

class Tsusd extends Susd {

  constructor() {
    super();
  }

  getChain() {
    return 'tsusd';
  }

  getFullName() {
    return 'Test Silvergate USD';
  }
}

module.exports = Tsusd;
