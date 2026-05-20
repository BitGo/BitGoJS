import * as assert from 'assert';

import { WalletUnspentSigner } from '../../../src/bitgo';
import { getDefaultWalletKeys } from '../../../src/testutil';

describe('WalletUnspentSigner', function () {
  it('derives expected keys', function () {
    const keys = getDefaultWalletKeys();
    const derivedWalletKeys = keys.deriveForChainAndIndex(1, 2);
    const signer = new WalletUnspentSigner(keys, keys.user, keys.bitgo);
    const derivedSigner = signer.deriveForChainAndIndex(1, 2);
    assert.deepStrictEqual(derivedSigner.walletKeys.publicKeys, derivedWalletKeys.publicKeys);
    assert.deepStrictEqual(derivedSigner.signer, derivedWalletKeys.user);
    assert.deepStrictEqual(derivedSigner.cosigner, derivedWalletKeys.bitgo);
  });
});
