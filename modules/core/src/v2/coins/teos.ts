import { BaseCoin } from '../baseCoin';
import { Eos } from './eos';

export class Teos extends Eos {

  static createInstance(bitgo: any): BaseCoin {
    return new Teos(bitgo);
  }

  getChain() {
    return 'teos';
  }

  getFullName() {
    return 'Testnet EOS';
  }
}
