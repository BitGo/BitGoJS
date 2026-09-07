import assert from 'node:assert/strict';

import { deriveStacksAccount, STACKS_ACCOUNT_DERIVATION_PATH, toBip39Mnemonic } from './wallet';

describe('PoX-5 seed phrase account derivation', function () {
  it('derives the first Stacks testnet account with wasm-utxo BIP32', function () {
    const account = deriveStacksAccount('apart spin rich leader siren foil dish sausage fee pipe ethics bundle');

    assert.equal(account.address, 'ST3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFRS57TT6');
    assert.equal(account.derivationPath, STACKS_ACCOUNT_DERIVATION_PATH);
    assert.equal(account.mnemonicTranslated, false);
    assert.match(account.privateKey, /^[0-9a-f]{66}$/);
  });

  it('translates the dashboard placeholder into deterministic BIP39 entropy', function () {
    const translated = toBip39Mnemonic('too many secrets');
    assert.equal(
      translated.mnemonic,
      'girl laptop tag exchange over legend beach fatigue outside soap wheat veteran daughter skate donate adjust dragon tide crater van inhale slot pilot duty'
    );
    assert.equal(translated.translated, true);

    const account = deriveStacksAccount('too many secrets');
    assert.equal(account.address, 'ST3E4ZY276J33BNVTD0ZPBZEN3HRK05MHRFNX9NQS');
    assert.equal(account.mnemonicTranslated, true);
  });
});
