import assert from 'assert';

import * as sinon from 'sinon';
import nock = require('nock');
import { SafeChildTriplet, SafeChildTripletPubs } from '@bitgo/sdk-lib-safes';

import { backupKeyRecovery, determineSafeWalletFunding, recoverSafeWallet, RecoveryProvider } from '../../../src';
import {
  createWasmWalletKeys,
  defaultBitGo,
  getDefaultWasmWalletKeys,
  getMinUtxoCoins,
  getUtxoCoin,
  getWalletAddress,
  keychainsBase58,
  toUnspentWithPrevTx,
} from '../util';

import { MockRecoveryProvider } from './mock';

nock.disableNetConnect();

const { walletKeys: wasmWalletKeys } = getDefaultWasmWalletKeys();

function tripletPubs(): SafeChildTripletPubs {
  return {
    user: { pub: keychainsBase58[0].pub },
    backup: { pub: keychainsBase58[1].pub },
    bitgo: { pub: keychainsBase58[2].pub },
  };
}

const throwingProvider: RecoveryProvider = {
  getUnspentsForAddresses: async () => {
    throw new Error('provider down');
  },
  getAddressInfo: async () => {
    throw new Error('provider down');
  },
  getTransactionHex: async () => {
    throw new Error('provider down');
  },
  getTransactionIO: async () => {
    throw new Error('provider down');
  },
};

describe('determineSafeWalletFunding', function () {
  it('returns funded when the wallet has unspents', async function () {
    const coin = getUtxoCoin('btc');
    const unspents = [toUnspentWithPrevTx({ scriptType: 'p2sh', value: BigInt(1e8) }, 0, coin.name, wasmWalletKeys)];
    const status = await determineSafeWalletFunding(coin, tripletPubs(), {
      recoveryProvider: new MockRecoveryProvider(unspents),
    });
    assert.strictEqual(status, 'funded');
  });

  getMinUtxoCoins().forEach((coin) => {
    it(`returns empty when the wallet has no unspents [${coin.getChain()}]`, async function () {
      const status = await determineSafeWalletFunding(coin, tripletPubs(), {
        recoveryProvider: new MockRecoveryProvider([]),
      });
      assert.strictEqual(status, 'empty');
    });

    it(`returns unknown when the provider fails [${coin.getChain()}]`, async function () {
      const status = await determineSafeWalletFunding(coin, tripletPubs(), {
        recoveryProvider: throwingProvider,
      });
      assert.strictEqual(status, 'unknown');
    });
  });

  it('returns unknown when the engine resolves without a valid txHex', async function () {
    const coin = getUtxoCoin('btc');
    type RecoverReturn = Awaited<ReturnType<typeof coin.recover>>;
    const malformedResult = {
      txHex: '',
      txInfo: {},
      feeInfo: {},
      coin: coin.getChain(),
    } as RecoverReturn;

    const stub = sinon.stub(coin, 'recover').resolves(malformedResult);
    try {
      const status = await determineSafeWalletFunding(coin, tripletPubs());
      assert.strictEqual(status, 'unknown');
    } finally {
      stub.restore();
    }
  });

  it('rejects scan: 0', async function () {
    const coin = getUtxoCoin('btc');
    await assert.rejects(
      () => determineSafeWalletFunding(coin, tripletPubs(), { scan: 0 }),
      /scan must be a positive integer/
    );
  });
});

describe('recoverSafeWallet', function () {
  const coin = getUtxoCoin('btc');
  const { walletKeys: externalWallet } = createWasmWalletKeys('external');
  const recoveryDestination = getWalletAddress(coin.name, externalWallet);
  const unspents = [toUnspentWithPrevTx({ scriptType: 'p2sh', value: BigInt(1e8) }, 0, coin.name, wasmWalletKeys)];

  function fullTriplet(): SafeChildTriplet {
    return {
      index: 0,
      user: { prv: keychainsBase58[0].prv, pub: keychainsBase58[0].pub },
      backup: { prv: keychainsBase58[1].prv, pub: keychainsBase58[1].pub },
      bitgo: { pub: keychainsBase58[2].pub },
    };
  }

  it('returns an unsigned transaction when mode is unsigned', async function () {
    const result = await recoverSafeWallet(coin, fullTriplet(), {
      mode: 'unsigned',
      recoveryDestination,
      feeRate: 100,
      recoveryProvider: new MockRecoveryProvider(unspents),
    });
    assert.ok('txHex' in result && typeof result.txHex === 'string' && result.txHex.length > 0);
    assert.ok('txInfo' in result && typeof result.txInfo === 'object');
    assert.ok('feeInfo' in result && typeof result.feeInfo === 'object');
    assert.strictEqual(result.coin, coin.getChain());
  });

  it('returns a signed transaction when mode is signed', async function () {
    const result = await recoverSafeWallet(coin, fullTriplet(), {
      mode: 'signed',
      recoveryDestination,
      feeRate: 100,
      recoveryProvider: new MockRecoveryProvider(unspents),
    });
    assert.ok(
      'transactionHex' in result && typeof result.transactionHex === 'string' && result.transactionHex.length > 0
    );
    assert.ok('inputs' in result && Array.isArray(result.inputs) && result.inputs.length > 0);
  });

  it('recovers signed transaction on tbtc with mainnet xprv/xpub child keys', async function () {
    const tbtcCoin = getUtxoCoin('tbtc');
    const tbtcDestination = getWalletAddress(tbtcCoin.name, externalWallet);
    const tbtcUnspents = [
      toUnspentWithPrevTx({ scriptType: 'p2sh', value: BigInt(1e8) }, 0, tbtcCoin.name, wasmWalletKeys),
    ];

    const result = await recoverSafeWallet(tbtcCoin, fullTriplet(), {
      mode: 'signed',
      recoveryDestination: tbtcDestination,
      feeRate: 100,
      recoveryProvider: new MockRecoveryProvider(tbtcUnspents),
    });
    assert.ok(
      'transactionHex' in result && typeof result.transactionHex === 'string' && result.transactionHex.length > 0
    );
    assert.ok('inputs' in result && Array.isArray(result.inputs) && result.inputs.length > 0);
  });

  it('produces a byte-identical result to backupKeyRecovery (signed)', async function () {
    const triplet = fullTriplet();
    const provider = new MockRecoveryProvider(unspents);

    const viaSafe = await recoverSafeWallet(coin, triplet, {
      mode: 'signed',
      recoveryDestination,
      feeRate: 100,
      recoveryProvider: provider,
    });

    const viaDirect = await backupKeyRecovery(coin, defaultBitGo, {
      userKey: triplet.user.prv,
      backupKey: triplet.backup.prv,
      bitgoKey: triplet.bitgo.pub,
      recoveryDestination,
      ignoreAddressTypes: [],
      feeRate: 100,
      recoveryProvider: provider,
    });

    assert.deepStrictEqual(viaSafe, viaDirect);
  });

  it('rejects scan: 0', async function () {
    await assert.rejects(
      () => recoverSafeWallet(coin, fullTriplet(), { mode: 'unsigned', recoveryDestination, scan: 0 }),
      /scan must be a positive integer/
    );
  });
});
