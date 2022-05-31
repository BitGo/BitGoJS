/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { FiatEur } from './fiateur';

export class TfiatEur extends FiatEur {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new TfiatEur(bitgo);
  }

  getChain() {
    return 'tfiateur';
  }

  getFullName() {
    return 'Testnet European Union Euro';
  }
}
