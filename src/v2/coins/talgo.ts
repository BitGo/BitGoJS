import Algo from './algo';

class Talgo extends Algo {
    constructor() {
      super();
    }

    getChain() {
      return 'talgo';
    }

    getFullName() {
      return 'Testnet Algorand';
    }
}

module.exports = Talgo;
