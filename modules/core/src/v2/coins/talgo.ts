import Algo from './algo';

class Talgo extends Algo {
  constructor() {
    super();
  }

  getChain(): string {
    return 'talgo';
  }

  getFullName(): string {
    return 'Testnet Algorand';
  }
}

module.exports = Talgo;
