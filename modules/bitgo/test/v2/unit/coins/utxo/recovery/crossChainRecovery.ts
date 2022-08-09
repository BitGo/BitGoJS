/**
 * @prettier
 */
import * as _ from 'lodash';
import * as assert from 'assert';
import * as should from 'should';
import * as nock from 'nock';
import * as utxolib from '@bitgo/utxo-lib';
import { Triple } from '@bitgo/sdk-core';
import {
  AbstractUtxoCoin,
  BitgoPublicApi,
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  getWallet,
  supportedCrossChainRecoveries,
} from '@bitgo/abstract-utxo';

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
import { nockBitGoPublicAddressUnspents, nockBitGoPublicTransaction } from '../util/nockIndexerAPI';
import { createFullSignedTransaction } from '../util/transaction';
import { getDefaultWalletUnspentSigner } from '../util/keychains';

type Unspent<TNumber extends number | bigint = number> = utxolib.bitgo.Unspent<TNumber>;
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

function nockAddressWithUnspents<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  address: string,
  unspents: Unspent<TNumber>[]
): nock.Scope {
  const payload = unspents.map((u) => {
    return {
      ...u,
      value: Number(u.value),
      valueString: coin.amountType === 'bigint' ? u.value.toString() : undefined,
    };
  });
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/addressUnspents/${address}`).reply(200, payload).persist();
}

function nockAddressWithoutUnspents(coin: AbstractUtxoCoin, address: string): nock.Scope {
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/addressUnspents/${address}`).reply(404).persist();
}

function nockBitGoPublicTransactionInfo<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  depositTx: utxolib.bitgo.UtxoTransaction<TNumber>,
  depositUnspents: Unspent<TNumber>[],
  depositAddress: string
): nock.Scope[] {
  return [
    nockBitGoPublicTransaction(coin, depositTx, depositUnspents).persist(),
    nockBitGoPublicAddressUnspents<TNumber>(coin, depositTx.getId(), depositAddress, depositTx.outs).persist(),
  ];
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

    function getDepositUnspents() {
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
      nocks.push(
        ...nockBitGoPublicTransactionInfo(sourceCoin, depositTx, getDepositUnspents(), depositAddressSourceCoin.address)
      );
    });

    after(function () {
      nocks.forEach((n) => n.done());
    });

    after(function () {
      nock.cleanAll();
    });

    let signedRecovery: CrossChainRecoverySigned<TNumber>;
    let unsignedRecovery: CrossChainRecoveryUnsigned<TNumber>;

    before('create recovery transaction', async function () {
      const params = {
        recoveryCoin,
        txid: depositTx.getId(),
        recoveryAddress,
        wallet: recoveryWalletId,
      };

      signedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        xprv: keychainsBase58[0].prv,
      })) as CrossChainRecoverySigned<TNumber>;

      unsignedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        signed: false,
      })) as CrossChainRecoveryUnsigned<TNumber>;
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

    testMatchFixture('signed', () => signedRecovery);
    testMatchFixture('unsigned', () => unsignedRecovery);

    function checkRecoveryTransactionSignature(tx: string | utxolib.bitgo.UtxoTransaction<TNumber>) {
      if (typeof tx === 'string') {
        tx = utxolib.bitgo.createTransactionFromBuffer<TNumber>(
          Buffer.from(tx, 'hex'),
          sourceCoin.network,
          undefined,
          sourceCoin.amountType
        );
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

    it('should have valid signatures for signed recovery', function () {
      checkRecoveryTransactionSignature(signedRecovery.txHex as string);
    });

    it('should be signable for unsigned recovery', async function () {
      const signedTx = await sourceCoin.signTransaction<TNumber>({
        txPrebuild: unsignedRecovery,
        prv: keychainsBase58[0].prv,
        pubs: keychainsBase58.map((k) => k.pub) as Triple<string>,
      });
      checkRecoveryTransactionSignature((signedTx as { txHex: string }).txHex);
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

describe(`Cross-Chain Recovery BitgoPublicApi.getUnspentInfo`, async function () {
  const coin = getUtxoCoin('btc');
  const bigintCoin = getUtxoCoin('doge');
  const numberValue = 1000;
  const bigintValue = '10999999800000001';

  const withUnspent1 = 'addresswithUnspent1';
  const unspent1: Unspent = {
    id: 'txid1',
    address: withUnspent1,
    value: numberValue,
  };
  const bigintUnspent1: Unspent<bigint> = _.assign(_.clone(unspent1), {
    value: BigInt(bigintValue),
    valueString: bigintValue,
  });
  const withUnspent2 = 'addresswithUnspent2';
  const unspent2: Unspent = {
    id: 'txid2',
    address: withUnspent2,
    value: numberValue,
  };
  const bigintUnspent2: Unspent<bigint> = _.assign(_.clone(unspent2), {
    value: BigInt(bigintValue),
    valueString: bigintValue,
  });
  const withoutUnspent = 'addressWithoutUnspent';
  const nocks: nock.Scope[] = [];

  afterEach(function () {
    nocks.forEach((n) => n.done());
    nock.cleanAll();
  });

  const api = new BitgoPublicApi(coin);
  const bigintApi = new BitgoPublicApi(bigintCoin);

  it('should first attempt a single batched address call to the addressUnspents api', async function () {
    const addresses = [withUnspent1, withUnspent2];
    nocks.push(nockAddressWithUnspents(coin, _.uniq(addresses).join(','), [unspent1, unspent2]));
    (await api.getUnspentInfo(addresses)).should.eql([unspent1, unspent2]);
  });

  it('[bigint] should first attempt a single batched address call to the addressUnspents api', async function () {
    const addresses = [withUnspent1, withUnspent2];
    nocks.push(nockAddressWithUnspents(bigintCoin, _.uniq(addresses).join(','), [bigintUnspent1, bigintUnspent2]));
    (await bigintApi.getUnspentInfo<bigint>(addresses, bigintCoin.amountType)).should.eql([
      bigintUnspent1,
      bigintUnspent2,
    ]);
  });

  it('should ignore duplicate addresses and those which have missing (already spent) unspents', async function () {
    const addresses = [withUnspent1, withUnspent1, withoutUnspent, withUnspent2];
    nocks.push(nockAddressWithoutUnspents(coin, _.uniq(addresses).join(',')));
    nocks.push(nockAddressWithUnspents(coin, withUnspent1, [unspent1]));
    nocks.push(nockAddressWithUnspents(coin, withUnspent2, [unspent2]));
    nocks.push(nockAddressWithoutUnspents(coin, withoutUnspent));
    (await api.getUnspentInfo(addresses)).should.eql([unspent1, unspent2]);
  });

  it('[bigint] should ignore duplicate addresses and those which have missing (already spent) unspents', async function () {
    const addresses = [withUnspent1, withUnspent1, withoutUnspent, withUnspent2];
    nocks.push(nockAddressWithoutUnspents(bigintCoin, _.uniq(addresses).join(',')));
    nocks.push(nockAddressWithUnspents(bigintCoin, withUnspent1, [bigintUnspent1]));
    nocks.push(nockAddressWithUnspents(bigintCoin, withUnspent2, [bigintUnspent2]));
    nocks.push(nockAddressWithoutUnspents(bigintCoin, withoutUnspent));
    (await bigintApi.getUnspentInfo<bigint>(addresses, bigintCoin.amountType)).should.eql([
      bigintUnspent1,
      bigintUnspent2,
    ]);
  });

  it('should throw an error if no unspents are found', async function () {
    const addresses = [withoutUnspent];
    nocks.push(nockAddressWithoutUnspents(coin, withoutUnspent));
    await api.getUnspentInfo(addresses).should.be.rejectedWith(`no unspents found for addresses: ${addresses}`);
  });
});
