import * as assert from 'assert';

import should = require('should');
import nock = require('nock');
import { Triple } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
import { address as wasmAddress, fixedScriptWallet } from '@bitgo/wasm-utxo';
import * as sinon from 'sinon';

import {
  AbstractUtxoCoin,
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  getWallet,
  supportedCrossChainRecoveries,
  generateAddress,
  convertLtcAddressToLegacyFormat,
} from '../../../src';
import { isMainnetCoin, isTestnetCoin } from '../../../src/names';
import type { WalletUnspent } from '../../../src/unspent';
import {
  getFixture,
  keychainsBase58,
  KeychainBase58,
  shouldEqualJSON,
  utxoCoins,
  getDefaultWasmWalletKeys,
  defaultBitGo,
  getUtxoCoin,
  createWasmWalletUnspent,
} from '../util';
import { nockBitGo } from '../util/nockBitGo';

import { WasmCrossChainRecoveryProvider } from './mock';

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
// Get wasm wallet keys for signature verification
const { walletKeys: wasmWalletKeys, xprivs } = getDefaultWasmWalletKeys();

function run<TNumber extends number | bigint = number>(sourceCoin: AbstractUtxoCoin, recoveryCoin: AbstractUtxoCoin) {
  describe(`Cross-Chain Recovery [sourceCoin=${sourceCoin.getChain()} recoveryCoin=${recoveryCoin.getChain()}]`, function () {
    const recoveryWalletId = '5abacebe28d72fbd07e0b8cbba0ff39e';
    // the address the accidental deposit went to, in both sourceCoin and addressCoin formats
    const [depositAddressSourceCoin, depositAddressRecoveryCoin] = [sourceCoin, recoveryCoin].map((coin) => ({
      address: generateAddress(coin.name, { keychains: keychainsBase58, chain: 0, index: 0 }),
      chain: 0,
      index: 0,
    }));
    const chain = 0;
    const index = 1;
    // the address where we want to recover our funds to
    const recoveryAddress = generateAddress(sourceCoin.name, {
      keychains: keychainsBase58,
      chain,
      index,
    });
    const nocks: nock.Scope[] = [];

    // Create recovery unspent using wasm-utxo (no utxolib dependency)
    function getRecoveryUnspents(): WalletUnspent<TNumber>[] {
      const depositValue = (sourceCoin.amountType === 'bigint' ? BigInt(1e8) : 1e8) as TNumber;
      return [
        createWasmWalletUnspent<TNumber>(depositAddressSourceCoin.address, chain, index, depositValue, sourceCoin.name),
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

    async function matchFixture(
      name: string,
      recovery: CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>
    ) {
      let recoveryObj: Record<string, unknown> = { ...recovery };
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
    }

    function checkRecoveryPsbtSignature(psbtHex: string) {
      // Parse using wasm-utxo for signature verification
      const wasmPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(Buffer.from(psbtHex, 'hex'), sourceCoin.name);
      const parsed = wasmPsbt.parseTransactionWithWalletKeys(wasmWalletKeys, { replayProtection: { publicKeys: [] } });
      const unspents = getRecoveryUnspents();
      should.equal(parsed.inputs.length, unspents.length);
      // Verify user key has signed each input (same pattern as backupKeyRecovery test)
      parsed.inputs.forEach((_, i) => {
        const userSigned = wasmPsbt.verifySignature(i, xprivs[0]);
        userSigned.should.eql(true, `Input ${i} should be signed by user key`);
      });
    }

    it('should test signed cross chain recovery', async () => {
      const depositUnspent = getRecoveryUnspents()[0];
      // Parse txid from the unspent id (format: txid:vout)
      const depositTxid = depositUnspent.id.split(':')[0];
      // Use the deposit address as the input address (simulating a p2sh input)
      const inputAddress = generateAddress(sourceCoin.name, { keychains: keychainsBase58, chain: 0, index: 2 });
      const getRecoveryProviderStub = sinon
        .stub(AbstractUtxoCoin.prototype, 'getRecoveryProvider')
        .returns(new WasmCrossChainRecoveryProvider<TNumber>(sourceCoin, depositUnspent, [inputAddress]));
      const params = {
        recoveryCoin,
        txid: depositTxid,
        recoveryAddress,
        wallet: recoveryWalletId,
      };
      const signedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        xprv: keychainsBase58[0].prv,
      })) as CrossChainRecoverySigned<TNumber>;
      should.equal(getRecoveryProviderStub.callCount, 1);

      // Verify fixture match
      await matchFixture('signed', signedRecovery);

      // Verify PSBT has valid signatures (user key signed)
      checkRecoveryPsbtSignature(signedRecovery.txHex as string);
    });

    it('should test unsigned cross chain recovery', async () => {
      const depositUnspent = getRecoveryUnspents()[0];
      // Parse txid from the unspent id (format: txid:vout)
      const depositTxid = depositUnspent.id.split(':')[0];
      // Use the deposit address as the input address (simulating a p2sh input)
      const inputAddress = generateAddress(sourceCoin.name, { keychains: keychainsBase58, chain: 0, index: 2 });
      const getRecoveryProviderStub = sinon
        .stub(AbstractUtxoCoin.prototype, 'getRecoveryProvider')
        .returns(new WasmCrossChainRecoveryProvider<TNumber>(sourceCoin, depositUnspent, [inputAddress]));
      const params = {
        recoveryCoin,
        txid: depositTxid,
        recoveryAddress,
        wallet: recoveryWalletId,
      };
      const unsignedRecovery = (await sourceCoin.recoverFromWrongChain<TNumber>({
        ...params,
        signed: false,
      })) as CrossChainRecoveryUnsigned<TNumber>;
      should.equal(getRecoveryProviderStub.callCount, 1);

      // Verify fixture match
      await matchFixture('unsigned', unsignedRecovery);

      // Verify the unsigned PSBT can be signed
      const signedTx = await sourceCoin.signTransaction<TNumber>({
        txPrebuild: unsignedRecovery,
        prv: keychainsBase58[0].prv,
        pubs: keychainsBase58.map((k) => k.pub) as Triple<string>,
      });
      checkRecoveryPsbtSignature((signedTx as { txHex: string }).txHex);
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
        ((isMainnetCoin(coin.name) && isMainnetCoin(otherCoin.name)) ||
          (isTestnetCoin(coin.name) && isTestnetCoin(otherCoin.name)))
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

describe('convertLtcAddressToLegacyFormat', function () {
  const scriptPubKey = Buffer.from('a9149f0bf51fab4d33ab21977e1b89f776f64161ef4287', 'hex');
  it('should convert M... P2SH address to 3... legacy format', function () {
    // These two addresses represent the same underlying script hash:
    // - MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE is the LTC format (scriptHash 0x32)
    // - 3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd is the BTC format (scriptHash 0x05)
    // const ltcAddress = 'MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE';
    const ltcAddress = wasmAddress.fromOutputScriptWithCoin(scriptPubKey, 'ltc');
    const tltcAddress = wasmAddress.fromOutputScriptWithCoin(scriptPubKey, 'tltc');
    assert.strictEqual(ltcAddress, 'MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE');
    assert.strictEqual(tltcAddress, 'Qb6wsd4fZ2C6fKzRMPyTG5KiE81W6QCxhU');

    const legacyAddress = convertLtcAddressToLegacyFormat(ltcAddress, 'ltc');
    const expectedLtcLegacyAddress = '3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd';
    assert.strictEqual(legacyAddress, expectedLtcLegacyAddress);

    const expectedTltcLegacyAddress = '2N7kBkcCRXv91X9ENjHwSBNtH5jZg8yye6r';
    const tltcLegacyAddress = convertLtcAddressToLegacyFormat(tltcAddress, 'tltc');
    assert.strictEqual(tltcLegacyAddress, expectedTltcLegacyAddress);
  });

  it('should convert MD68PsdheKxcYsrVLyZRXgoSDLnB1MdVtE to legacy format', function () {
    const address = 'MD68PsdheKxcYsrVLyZRXgoSDLnB1MdVtE';
    const legacyAddress = convertLtcAddressToLegacyFormat(address, 'ltc');

    // Should start with '3' (legacy BTC P2SH format)
    assert.ok(legacyAddress.startsWith('3'), `Expected address to start with '3', got: ${legacyAddress}`);
  });

  it('should not modify bech32 addresses', function () {
    const bech32Address = 'ltc1qgrl8zpndsklaa9swgd5vevyxmx5x63vcrl7dk4';
    const result = convertLtcAddressToLegacyFormat(bech32Address, 'ltc');
    assert.strictEqual(result, bech32Address);
  });
});
