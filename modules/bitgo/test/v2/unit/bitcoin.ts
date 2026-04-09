/**
 * @prettier
 */
import 'should';
import { ECPair } from '@bitgo/utxo-lib';
import { getAddressP2PKH } from '@bitgo/sdk-core';

describe('Bitcoin utils:', function () {
  it('should produce equivalent addresses when using getAddress() vs getAddressP2PKH() for an ECPair key', () => {
    const key = ECPair.fromPrivateKey(Buffer.alloc(32, 1));
    getAddressP2PKH(key).should.eql('1C6Rc3w25VHud3dLDamutaqfKWqhrLRTaD');
  });
});
