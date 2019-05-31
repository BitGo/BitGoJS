import BaseCoin = require('../baseCoin');

class Algo extends BaseCoin {

    constructor() {
      super();
    }

    getChain() {
        return 'algo';
    }

    getFamily() {
        return 'algo';
    }

    getFullName() {
        return 'Algorand';
    }

    getBaseFactor() {
        return 1e6;
    }

    /**
     * Flag for sending value of 0
     * @returns {boolean} True if okay to send 0 value, false otherwise
     */
    valuelessTransferAllowed(): boolean {
        // TODO: this sounds like its true with the staking txes - confirm before launch
        return false;
    }
}

export default Algo;
