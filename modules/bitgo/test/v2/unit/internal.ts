import 'should';

import { bip32 } from '@bitgo-beta/utxo-lib';
import { Util } from '@bitgo-beta/sdk-core';

describe('Internal:', () => {
  describe('Util', function () {
    it('has working xpubToEthAddress', function () {
      const xpub = bip32.fromSeed(Buffer.alloc(32)).neutered().toBase58();
      Util.xpubToEthAddress(xpub).should.eql('0xeb317b9f2e0891d66c061ddc3f5ee7ed42d70a44');
    });
  });
});
