/**
 * @prettier
 */
import 'should';
import { ECPair } from '@bitgo/utxo-lib';

import { getAddressP2PKH } from '../../../src/bitcoin';

describe('Bitcoin utils:', function () {
  it('should produce equivalent addresses when using getAddress() vs getAddressP2PKH() for an ECPair key', () => {
    const key = ECPair.makeRandom();

    const firstAddress = key.getAddress();
    const secondAddress = getAddressP2PKH(key);

    firstAddress.should.eql(secondAddress);
  });
});
