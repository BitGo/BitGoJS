/**
 * @prettier
 */
import * as assert from 'assert';
import * as should from 'should';
import * as nock from 'nock';
import * as utxolib from '@bitgo/utxo-lib';
import { Triple } from '@bitgo/sdk-core';
import {
  getFixture,
  keychainsBase58,
  KeychainBase58,
  mockUnspent,
  shouldEqualJSON,
  utxoCoins,
  transactionHexToObj,
  getDefaultWalletKeys,
  defaultBitGo,
  getUtxoCoin,
} from '../util';
import { getSeed } from '@bitgo/sdk-test';
import { nockBitGo } from '../util/nockBitGo';
import { createFullSignedTransaction } from '../util/transaction';
import { getDefaultWalletUnspentSigner } from '../util/keychains';
import { MockCrossChainRecoveryProvider } from './mock';
import {
  AbstractUtxoCoin,
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  getWallet,
  supportedCrossChainRecoveries,
} from '@bitgo/abstract-utxo';
import * as sinon from 'sinon';

type WalletUnspent<TNumber extends number | bigint = number> = utxolib.bitgo.WalletUnspent<TNumber>;

function getKeyId(k: KeychainBase58): string {
  return getSeed(k.pub).toString('hex');
}

function nockWallet(coin: AbstractUtxoCoin, walletId: string, walletKeys: Triple<KeychainBase58>): nock.Scope[] {
  return [
    nockBitGo()
      .get(`/api/v2/${coin.getChain()}/wallet/${walletId}`)
      .reply(200, {
        id: walletId,
        coin: coin.getChain(),
        label: 'crossChainRecovery',
        keys: walletKeys.map((k) => getKeyId(k)),
      })
      .persist(),
    ...walletKeys.map((k) =>
      nockBitGo()
        .get(`/api/v2/${coin.getChain()}/key/${getKeyId(k)}`)
        .reply(200, k)
        .persist()
    ),
  ];
}

type Address = {
  address: string;
  chain: number;
  index: number;
  coinSpecific: unknown;
};

function nockWalletAddress(coin: AbstractUtxoCoin, walletId: string, address: Address): nock.Scope {
  return nockBitGo()
    .get(`/api/v2/${coin.getChain()}/wallet/${walletId}/address/${address.address}`)
    .reply(200, {
      address: address.address,
      chain: address.chain,
      index: address.index,
      coin: coin.getChain(),
      wallet: walletId,
      coinSpecific: address.coinSpecific,
    })
    .persist();
}

/**
 * Setup test for cross-chain recovery.
 *
 * Users can receive deposits on wallet addresses that are on a different chain.
 *
 * For instance, a user can receive litecoin on a bitcoin wallet.
 * This means that the litecoin blockchain has a transaction with outputs that are spendable
 * with keys that were originally created for a BitGo BTC wallet.
 * In this example, LTC is the "source coin" and BTC is the "recovery coin"
 * In cases like these we must use construct a transaction for litecoin network using keys of the
 * bitcoin wallet.
 *
 * @param sourceCoin - the coin to construct the transaction for
 * @param recoveryCoin - the coin the receiving wallet was set up for
 */
function run<TNumber extends number | bigint = number>(sourceCoin: AbstractUtxoCoin, recoveryCoin: AbstractUtxoCoin) {
  describe(`Cross-Chain Recovery [sourceCoin=${sourceCoin.getChain()} recoveryCoin=${recoveryCoin.getChain()}]`, function () {
    const walletKeys = getDefaultWalletKeys();
    const recoveryWalletId = '5abacebe28d72fbd07e0b8cbba0ff39e';
    // the address the accidental deposit went to, in both sourceCoin and addressCoin formats
    const [depositAddressSourceCoin, depositAddressRecoveryCoin] = [sourceCoin, recoveryCoin].map((coin) =>
      coin.generateAddress({ keychains: keychainsBase58, index: 0 })
    );
    // the address where we want to recover our funds to
    const recoveryAddress = sourceCoin.generateAddress({ keychains: keychainsBase58, index: 1 }).address;
    const nocks: nock.Scope[] = [];

    let depositTx: utxolib.bitgo.UtxoTransaction<TNumber>;

    function getDepositUnspents(): utxolib.bitgo.Unspent<TNumber>[] {
      return [
        mockUnspent<TNumber>(
          sourceCoin.network,
          walletKeys,
          'p2sh',
          0,
          (sourceCoin.amountType === 'bigint' ? BigInt('10999999800000001') : 1e8) as TNumber
        ),
      ];
    }

    function getDepositTransaction(): utxolib.bitgo.UtxoTransaction<TNumber> {
      return createFullSignedTransaction<TNumber>(
        sourceCoin.network,
        getDepositUnspents(),
        depositAddressSourceCoin.address,
        getDefaultWalletUnspentSigner()
      );
    }

    before('prepare deposit tx', function () {
      depositTx = getDepositTransaction();
    });

    function getRecoveryUnspents(): WalletUnspent<TNumber>[] {
      return [
        {
          id: depositTx.getId(),
          address: depositAddressSourceCoin.address,
          chain: depositAddressSourceCoin.chain as utxolib.bitgo.ChainCode,
          index: depositAddressSourceCoin.index,
          value: depositTx.outs[0].value,
        },
      ];
    }

    before('setup nocks', function () {
      nocks.push(...nockWallet(recoveryCoin, recoveryWalletId, keychainsBase58));
      nocks.push(nockWalletAddress(recoveryCoin, recoveryWalletId, depositAddressRecoveryCoin));
    });

    after(function () {
      nocks.forEach((n) => n.done());
    });

    after(function () {
      nock.cleanAll();
    });

    afterEach(function () {
      sinon.restore();
    });

    function testMatchFixture(
      name: string,
      getRecoveryResult: () => CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>
    ) {
      it(`should match fixture (${name})`, async function () {
        const recovery = getRecoveryResult();
        let recoveryObj = {
          ...recovery,
          tx: transactionHexToObj(recovery.txHex as string, sourceCoin.network, sourceCoin.amountType),
        };
        if (sourceCoin.amountType === 'bigint') {
          recoveryObj = JSON.parse(
            JSON.stringify(recoveryObj, (k, v) => {
              if (typeof v === 'bigint') {
                return v.toString();
              } else {
                return v;
              }
            })
          );
        }
        shouldEqualJSON(
          recoveryObj,
          await getFixture(sourceCoin, `recovery/crossChainRecovery-${recoveryCoin.getChain()}-${name}`, recoveryObj)
        );
      });
    }

    function checkRecoveryTransactionSignature(tx: string | utxolib.bitgo.UtxoTransaction<TNumber>) {
      if (typeof tx === 'string') {
        tx = utxolib.bitgo.createTransactionFromBuffer<TNumber>(Buffer.from(tx, 'hex'), sourceCoin.network, {
          amountType: sourceCoin.amountType,
        });
      }
      const unspents = getRecoveryUnspents();
      should.equal(tx.ins.length, unspents.length);
      tx.ins.forEach((input, i) => {
        assert(typeof tx !== 'string');
        utxolib.bitgo
          .verifySignatureWithUnspent<TNumber>(tx, i, getRecoveryUnspents(), walletKeys)
          .should.eql([true, false, false]);
      });
    }

    it('should test signed cross chain recovery', async () => {
      const getRecoveryProviderStub = sinon
        .stub(AbstractUtxoCoin.prototype, 'getRecoveryProvider')
        .returns(new MockCrossChainRecoveryProvider<TNumber>(sourceCoin, getDepositUnspents(), depositTx));
      const params = {
        recoveryCoin,
        txid: depositTx.getId(),
        recoveryAddress,
        wallet: recoveryWalletId,
      };
      const signedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        xprv: keychainsBase58[0].prv,
      })) as CrossChainRecoverySigned<TNumber>;
      should.equal(getRecoveryProviderStub.callCount, 1);

      testMatchFixture('signed', () => signedRecovery);

      it('should have valid signatures for signed recovery', function () {
        checkRecoveryTransactionSignature(signedRecovery.txHex as string);
      });
    });

    it('should test unsigned cross chain recovery', async () => {
      const getRecoveryProviderStub = sinon
        .stub(AbstractUtxoCoin.prototype, 'getRecoveryProvider')
        .returns(new MockCrossChainRecoveryProvider<TNumber>(sourceCoin, getDepositUnspents(), depositTx));
      const params = {
        recoveryCoin,
        txid: depositTx.getId(),
        recoveryAddress,
        wallet: recoveryWalletId,
      };
      const unsignedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        signed: false,
      })) as CrossChainRecoveryUnsigned<TNumber>;
      should.equal(getRecoveryProviderStub.callCount, 1);

      testMatchFixture('unsigned', () => unsignedRecovery);

      it('should be signable for unsigned recovery', async function () {
        const signedTx = await sourceCoin.signTransaction<TNumber>({
          txPrebuild: unsignedRecovery,
          prv: keychainsBase58[0].prv,
          pubs: keychainsBase58.map((k) => k.pub) as Triple<string>,
        });
        checkRecoveryTransactionSignature((signedTx as { txHex: string }).txHex);
      });
    });
  });
}

function isSupportedCrossChainRecovery(sourceCoin: AbstractUtxoCoin, recoveryCoin: AbstractUtxoCoin): boolean {
  return supportedCrossChainRecoveries[sourceCoin.getFamily()]?.includes(recoveryCoin.getFamily());
}

utxoCoins.forEach((coin) => {
  utxoCoins
    .filter(
      (otherCoin) =>
        coin !== otherCoin &&
        isSupportedCrossChainRecovery(coin, otherCoin) &&
        ((utxolib.isMainnet(coin.network) && utxolib.isMainnet(otherCoin.network)) ||
          (utxolib.isTestnet(coin.network) && utxolib.isTestnet(otherCoin.network)))
    )
    .forEach((otherCoin) => {
      if (coin.amountType === 'bigint') {
        run<bigint>(coin, otherCoin);
      } else {
        run(coin, otherCoin);
      }
    });
});

describe(`Cross-Chain Recovery getWallet`, async function () {
  const bitgo = defaultBitGo;
  const recoveryCoin = getUtxoCoin('btc');
  const recoveryWalletId = '5abacebe28d72fbd07e0b8cbba0ff39e';

  it('should search v1 wallets if the v2 endpoint responds with a 4xx error', async function () {
    const errorResponses = [400, 404];

    for (const error of errorResponses) {
      const nockV2Wallet = nockBitGo(bitgo)
        .get(`/api/v2/${recoveryCoin.getChain()}/wallet/${recoveryWalletId}`)
        .reply(error);
      const nockV1Wallet = nockBitGo(bitgo).get(`/api/v1/wallet/${recoveryWalletId}`).reply(error);
      await assert.rejects(
        () => getWallet(bitgo, recoveryCoin, recoveryWalletId),
        Error(`could not get wallet ${recoveryWalletId} from v1 or v2: ApiResponseError: ${error}`)
      );
      nockV2Wallet.done();
      nockV1Wallet.done();
    }
  });

  it('should throw an error if the v2 endpoint responds with a 5xx error', async function () {
    const errorResponses = [500];
    for (const error of errorResponses) {
      const nockV2Wallet = nockBitGo(bitgo)
        .get(`/api/v2/${recoveryCoin.getChain()}/wallet/${recoveryWalletId}`)
        .reply(error);
      await assert.rejects(() => getWallet(bitgo, recoveryCoin, recoveryWalletId), {
        name: 'ApiResponseError',
        status: 500,
        result: {},
        invalidToken: false,
        needsOTP: false,
      });
      nockV2Wallet.done();
    }
  });
});
