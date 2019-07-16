import { BaseCoin } from '../baseCoin';
import { Eos } from './eos';

export class Teos extends Eos {

  static createInstance(bitgo: any): BaseCoin {
    return new Teos(bitgo);
  }

  getChainId() {
    return 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'; // testnet chain id
  }

  getChain() {
    return 'teos';
  }

  getFullName() {
    return 'Testnet EOS';
  }
}
