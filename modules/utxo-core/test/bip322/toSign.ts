import assert from 'assert';

import { payments, ECPair, Transaction } from '@bitgo/utxo-lib';

import * as bip322 from '../../src/bip322';

describe('BIP322 toSign', function () {
  describe('buildToSignPsbt', function () {
    const WIF = 'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k';
    const prv = ECPair.fromWIF(WIF);
    const scriptPubKey = payments.p2wpkh({
      address: 'bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l',
    }).output as Buffer;

    // Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#transaction-hashes
    const fixtures = [
      {
        message: '',
        txid: '1e9654e951a5ba44c8604c4de6c67fd78a27e81dcadcfe1edf638ba3aaebaed6',
      },
      {
        message: 'Hello World',
        txid: '88737ae86f2077145f93cc4b153ae9a1cb8d56afa511988c149c5c8c9d93bddf',
      },
    ];

    fixtures.forEach(({ message, txid }) => {
      it(`should build a to_sign PSBT for message "${message}"`, function () {
        const toSpendTx = bip322.buildToSpendTransaction(scriptPubKey, Buffer.from(message));
        const addressDetails = {
          witnessScript: scriptPubKey,
        };
        const result = bip322.buildToSignPsbt(toSpendTx, addressDetails);
        const computedTxid = result
          .signAllInputs(prv, [Transaction.SIGHASH_ALL])
          .finalizeAllInputs()
          .extractTransaction()
          .getId();
        assert.strictEqual(computedTxid, txid, `Transaction ID for message "${message}" does not match expected value`);
      });
    });
  });
});
