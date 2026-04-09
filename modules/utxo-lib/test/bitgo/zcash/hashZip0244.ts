import * as assert from 'assert';
import * as vectors from './fixtures/vectorsZip0244.json';
import { UnsupportedTransactionError, ZcashTransaction } from '../../../src/bitgo';
import { Transaction, networks } from '../../../src';

type Vector = [
  tx: string,
  txid: string,
  auth_digest: string,
  transparent_input: number,
  script_code: string,
  amount: number,
  sighash_all: string,
  sighash_none: string,
  sighash_single: string,
  sighash_all_anyone: string,
  sighash_none_anyone: string,
  sighash_single_anyone: string
];

function parseHashType(hashTypeStr: string): number {
  return hashTypeStr.split('|').reduce((v, str) => {
    if (str in Transaction) {
      return v | Transaction[str];
    }
    throw new Error(`invalid hashType ${str}`);
  }, 0);
}

function runVector(v: Vector, i: number) {
  const [
    txHex,
    txid,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authDigest,
    transparentInput,
    pubScriptHex,
    amount,
    ...sigHashHex /* sighash_all, sighash_none, sighash_single, sighash_all_anyone, sighash_none_anyone, sighash_single_anyone */
  ] = v;

  describe(`Vector ${i}, txid=${txid}`, function () {
    let tx: ZcashTransaction;
    before('parse', function () {
      try {
        tx = ZcashTransaction.fromBuffer(Buffer.from(txHex, 'hex'), false, 'number', networks.zcash);
      } catch (e) {
        if (e instanceof UnsupportedTransactionError) {
          this.skip();
        }
        throw e;
      }
    });

    it('has expected txid', function () {
      // getId() returns the reversed hash
      assert.strictEqual(tx.getHash().toString('hex'), txid);
    });

    [
      'SIGHASH_ALL',
      'SIGHASH_NONE',
      'SIGHASH_SINGLE',
      'SIGHASH_ALL|SIGHASH_ANYONECANPAY',
      'SIGHASH_NONE|SIGHASH_ANYONECANPAY',
      'SIGHASH_SINGLE|SIGHASH_ANYONECANPAY',
    ].forEach((hashTypeStr, i) => {
      if (sigHashHex[i] === null) {
        return;
      }
      const hashType = parseHashType(hashTypeStr);
      it(`has expected value for ${hashTypeStr} ${hashType}`, function () {
        assert.strictEqual(
          tx
            .hashForSignatureByNetwork(
              transparentInput ?? undefined,
              pubScriptHex ? Buffer.from(pubScriptHex, 'hex') : Buffer.of(),
              amount,
              hashType
            )
            .toString('hex'),
          sigHashHex[i]
        );
      });
    });
  });
}

describe('ZcashTransaction ZIP-0244', function () {
  vectors
    .filter((v) => v.length > 1)
    .forEach((v, i) => {
      runVector(v as Vector, i);
    });
});
