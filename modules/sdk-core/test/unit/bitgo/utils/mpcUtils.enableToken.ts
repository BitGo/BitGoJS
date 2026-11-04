import assert from 'assert';
import * as sinon from 'sinon';
import { IBaseCoin, KeychainsTriplet } from '../../../../src/bitgo/baseCoin';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { MpcUtils } from '../../../../src/bitgo/utils/mpcUtils';
import { RequestTracer } from '../../../../src';

class TestMpcUtils extends MpcUtils {
  createKeychains(): Promise<KeychainsTriplet> {
    return Promise.reject(new Error('unused'));
  }
}

/**
 * enableToken's `configureAccount` opt-in (the Solana Token-2022 confidential-transfer lane)
 * must survive `populateIntent` for the generic (non-EVM) coin path. The generic tail used to
 * copy the flag only inside the `feeOptions !== undefined` branch, and the Solana enableToken
 * prebuild supplies no feeOptions — so `wallet.enableToken({ configureAccount: true })`
 * reached Wallet Platform with the flag silently dropped and routed to plain ATA-init.
 */
describe('populateIntent enableToken configureAccount', function () {
  const reqId = new RequestTracer();
  let mpcUtils: TestMpcUtils;
  let solCoin: IBaseCoin;

  beforeEach(function () {
    const mockBitgo = { getEnv: sinon.stub().returns('test') } as unknown as BitGoBase;
    solCoin = {
      getChain: () => 'tsol',
      getFamily: () => 'sol',
      isEVM: () => false,
      supportsTss: () => true,
      // The generic tail runs setCoinSpecificFieldsInIntent before returning; the Solana
      // coin adds nothing for enableToken, so a no-op is the faithful mock.
      setCoinSpecificFieldsInIntent: () => undefined,
    } as unknown as IBaseCoin;
    mpcUtils = new TestMpcUtils(mockBitgo, solCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('keeps the configureAccount opt-in on the generic path without feeOptions', function () {
    const intent = mpcUtils.populateIntent(solCoin, {
      reqId,
      intentType: 'enableToken',
      recipients: [],
      enableTokens: [{ name: 'tsol:t22mint' }],
      configureAccount: true,
    }) as { configureAccount?: boolean };

    assert.strictEqual(intent.configureAccount, true);
  });

  it('keeps the opt-out explicit when configureAccount is false', function () {
    const intent = mpcUtils.populateIntent(solCoin, {
      reqId,
      intentType: 'enableToken',
      recipients: [],
      enableTokens: [{ name: 'tsol:t22mint' }],
      configureAccount: false,
    }) as { configureAccount?: boolean };

    assert.strictEqual(intent.configureAccount, false);
  });

  it('still carries the flag when feeOptions are present', function () {
    const intent = mpcUtils.populateIntent(solCoin, {
      reqId,
      intentType: 'enableToken',
      recipients: [],
      enableTokens: [{ name: 'tsol:t22mint' }],
      configureAccount: true,
      feeOptions: { maxFeePerGas: 1000, maxPriorityFeePerGas: 1000 },
    }) as { configureAccount?: boolean };

    assert.strictEqual(intent.configureAccount, true);
  });

  it('does not add the field to non-enableToken intents', function () {
    const intent = mpcUtils.populateIntent(solCoin, {
      reqId,
      intentType: 'wrap-native',
      wrapParams: { tokenName: 'tsol', amount: '1000' },
    }) as unknown as Record<string, unknown>;

    assert.strictEqual('configureAccount' in intent, false);
  });
});
