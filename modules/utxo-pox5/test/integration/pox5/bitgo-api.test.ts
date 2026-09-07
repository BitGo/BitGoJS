import assert from 'node:assert/strict';

import { Psbt } from '@bitgo/wasm-utxo';

import {
  isFixedScriptMainWallet,
  normalizeUnsignedTransactionHex,
  outpointFromUnspent,
  parseBitGoCoin,
  parseBitGoEnvironment,
  parseBitGoWalletType,
  parseNonNegativeInteger,
  parsePositiveSats,
  redactBitGoError,
  redactBitGoErrorStack,
  responseUnspents,
  selectBitGoEnterpriseId,
  summarizeUnspent,
  type BitGoWalletSummary,
} from './bitgo-api';

describe('BitGo API dashboard input validation', function () {
  it('allows only test/staging environments and PoX-5 test coins', function () {
    assert.equal(parseBitGoEnvironment('staging'), 'staging');
    assert.equal(parseBitGoEnvironment('test'), 'test');
    assert.equal(parseBitGoCoin('tbtcstx'), 'tbtcstx');
    assert.equal(parseBitGoCoin('tbtcstxprivate1'), 'tbtcstxprivate1');
    assert.equal(parseBitGoWalletType(undefined), 'hot');
    assert.equal(parseBitGoWalletType('custodial'), 'custodial');
    assert.throws(() => parseBitGoEnvironment('prod'), /must be test or staging/);
    assert.throws(() => parseBitGoCoin('btc'), /must be tbtcstx or tbtcstxprivate1/);
    assert.throws(() => parseBitGoWalletType('cold'), /must be hot or custodial/);
  });

  it('accepts positive integer satoshi values and rejects unsafe amounts', function () {
    assert.equal(parsePositiveSats('30000', 'Amount'), '30000');
    assert.equal(parsePositiveSats(30000, 'Amount'), '30000');
    assert.throws(() => parsePositiveSats('0', 'Amount'), /positive integer/);
    assert.throws(() => parsePositiveSats('1.5', 'Amount'), /positive integer/);
    assert.throws(() => parsePositiveSats('2100000000000001', 'Amount'), /maximum Bitcoin supply/);
    assert.equal(parseNonNegativeInteger('0', 'Bond index'), 0);
    assert.equal(parseNonNegativeInteger('12', 'Bond index'), 12);
    assert.throws(() => parseNonNegativeInteger('1e2', 'Bond index'), /non-negative integer/);
  });

  it('redacts passphrases and API tokens from surfaced errors', function () {
    assert.equal(
      redactBitGoError(new Error('request failed for secret-token with passphrase'), ['secret-token', 'passphrase']),
      'request failed for [redacted] with [redacted]'
    );

    const apiError = Object.assign(new Error('Upstream service error'), {
      status: 502,
      requestId: 'request-123',
      result: { error: 'Upstream failure for secret-token' },
    });
    assert.equal(
      redactBitGoError(apiError, ['secret-token']),
      'Upstream service error (HTTP 502; requestId request-123; detail Upstream failure for [redacted])'
    );
  });

  it('redacts secrets in error stacks while retaining stack frames', function () {
    const error = new Error('request failed for secret-token');
    error.stack = 'Error: request failed for secret-token\n    at buildTransaction (stakingWallet.ts:1:2)';

    assert.equal(
      redactBitGoErrorStack(error, ['secret-token']),
      'Error: request failed for [redacted]\n    at buildTransaction (stakingWallet.ts:1:2)'
    );
    assert.equal(redactBitGoErrorStack('not an Error', ['secret-token']), undefined);
  });

  it('identifies eligible fixed-script main wallets and parses wallet UTXOs', function () {
    const wallet: BitGoWalletSummary = {
      id: 'wallet-id',
      label: 'PoX-5 test wallet',
      coin: 'tbtcstxprivate1',
      type: 'hot',
      multisigType: 'onchain',
      balanceSats: '0',
      isStakingWallet: false,
    };
    const stakingWallet = { ...wallet, isStakingWallet: true };
    const custodialWallet = { ...wallet, type: 'custodial' };
    const unspent = {
      tx_hash: 'AB'.repeat(32),
      tx_output_n: '2',
      value: 50000,
      address: 'tb1qtest',
      confirmations: 1,
    };

    assert.equal(isFixedScriptMainWallet(wallet), true);
    assert.equal(isFixedScriptMainWallet(stakingWallet), false);
    assert.equal(isFixedScriptMainWallet(custodialWallet, 'custodial'), true);
    assert.equal(isFixedScriptMainWallet(custodialWallet), false);
    assert.equal(outpointFromUnspent(unspent), `${'ab'.repeat(32)}:2`);
    assert.deepEqual(responseUnspents({ unspents: [unspent, null] }), [unspent]);
    assert.deepEqual(summarizeUnspent(unspent), {
      outpoint: `${'ab'.repeat(32)}:2`,
      amountSats: '50000',
      address: 'tb1qtest',
      confirmations: 1,
    });
  });

  it('selects a sole enterprise automatically and requires an explicit choice when ambiguous', function () {
    assert.equal(selectBitGoEnterpriseId(['enterprise-1']), 'enterprise-1');
    assert.equal(selectBitGoEnterpriseId(['enterprise-1', 'enterprise-2'], ' enterprise-2 '), 'enterprise-2');
    assert.throws(() => selectBitGoEnterpriseId([]), /no accessible enterprises/);
    assert.throws(() => selectBitGoEnterpriseId(['enterprise-1', 'enterprise-2']), /specify one explicitly/);
  });

  it('compares PSBT transaction templates independently of input metadata', function () {
    const createPsbt = (lockTime: number, inputValue: bigint): Psbt => {
      const psbt = Psbt.create(2, lockTime);
      psbt.addInput('01'.repeat(32), 0, inputValue, Buffer.from([0x51]), 0xfffffffe);
      psbt.addOutput(Buffer.from([0x51]), 30000n);
      return psbt;
    };
    const first = createPsbt(100, 40000n);
    const sameTransaction = createPsbt(100, 41000n);
    const differentTransaction = createPsbt(101, 40000n);

    const hex = (psbt: Psbt): string => Buffer.from(psbt.serialize()).toString('hex');
    assert.equal(normalizeUnsignedTransactionHex(hex(first)), normalizeUnsignedTransactionHex(hex(sameTransaction)));
    assert.notEqual(
      normalizeUnsignedTransactionHex(hex(first)),
      normalizeUnsignedTransactionHex(hex(differentTransaction))
    );
  });
});
