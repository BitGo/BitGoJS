import * as assert from 'assert';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { Keychain } from '@bitgo/sdk-core';

import { utxoCoins } from './util';

function describeWithCoin(coin: AbstractUtxoCoin) {
  describe(`verifyKeySignatures for ${coin.getChain()}`, function () {
    it('should verify key signature of ZEC', async () => {
      const userKeychain = await coin.keychains().create();
      const backupKeychain = await coin.keychains().create();
      const bitgoKeychain = await coin.keychains().create();

      const signatures = await coin.createKeySignatures(
        userKeychain.prv,
        { pub: backupKeychain.pub as string },
        { pub: bitgoKeychain.pub as string }
      );

      assert.ok(
        await coin.verifyKeySignature({
          userKeychain: userKeychain as unknown as Keychain,
          keychainToVerify: backupKeychain as unknown as Keychain,
          keySignature: signatures.backup,
        })
      );
    });
  });
}

utxoCoins.forEach((coin) => describeWithCoin(coin));
