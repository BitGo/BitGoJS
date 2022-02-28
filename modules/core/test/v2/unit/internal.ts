import 'should';

import { bip32 } from '../../../src/bip32util';
import { Util } from '../../../src/v2/internal/util';

describe('Internal:', () => {

  describe('Util', function () {
    it('has working xpubToEthAddress', function () {
      const xpub = bip32.fromSeed(Buffer.alloc(32)).neutered().toBase58();
      Util.xpubToEthAddress(xpub).should.eql('0xeb317b9f2e0891d66c061ddc3f5ee7ed42d70a44');
    });
  });
});
