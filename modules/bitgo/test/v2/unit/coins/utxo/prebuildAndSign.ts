/**
 * @prettier
 */
import * as assert from 'assert';

import { AbstractUtxoCoin, getReplayProtectionAddresses } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import * as nock from 'nock';

import { encryptKeychain, getDefaultWalletKeys, getUtxoWallet, keychainsBase58, utxoCoins } from './util';
import { common, HalfSignedUtxoTransaction, Wallet } from '@bitgo/sdk-core';
import { getSeed, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src';

const txFormats = ['legacy', 'psbt'] as const;
export type TxFormat = (typeof txFormats)[number];

type KeyDoc = {
  id: string;
  pub: string;
  source: string;
  encryptedPrv: string;
  coinSpecific: any;
};

const walletPassphrase = 'gabagool';

const scriptTypes = [...utxolib.bitgo.outputScripts.scriptTypes2Of3, 'taprootKeyPathSpend', 'p2shP2pk'] as const;
export type ScriptType = (typeof scriptTypes)[number];

type Input = {
  scriptType: ScriptType;
  value: bigint;
};

// Build the key objects
const rootWalletKeys = getDefaultWalletKeys();
const keyDocumentObjects = rootWalletKeys.triple.map((bip32, keyIdx) => {
  return {
    id: getSeed(keychainsBase58[keyIdx].pub).toString('hex'),
    pub: bip32.neutered().toBase58(),
    source: ['user', 'backup', 'bitgo'][keyIdx],
    encryptedPrv: encryptKeychain(walletPassphrase, keychainsBase58[keyIdx]),
    coinSpecific: {},
  };
});

function run(coin: AbstractUtxoCoin, inputScripts: ScriptType[], txFormat: TxFormat): void {
  function createPrebuildPsbt(inputs: Input[], outputs: { scriptType: 'p2sh'; value: bigint }[]) {
    return utxolib.testutil.constructPsbt(
      inputs as utxolib.testutil.Input[],
      outputs,
      coin.network,
      rootWalletKeys,
      'unsigned'
    );
  }

  function createNocks(params: {
    bgUrl: string;
    wallet: Wallet;
    keyDocuments: KeyDoc[];
    prebuild: utxolib.bitgo.UtxoPsbt;
    recipient: { address: string; amount: string };
    addressInfo: Record<string, any>;
  }): nock.Scope[] {
    const nocks: nock.Scope[] = [];

    // Nock the prebuild route (/tx/build, blockheight)
    nocks.push(
      nock(params.bgUrl)
        .post(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/tx/build`, { recipients: [params.recipient] })
        .reply(200, { txHex: params.prebuild.toHex(), txInfo: {} })
    );
    nocks.push(nock(params.bgUrl).get(`/api/v2/${coin.getChain()}/public/block/latest`).reply(200, { height: 1000 }));

    // nock the keychain fetch - 3 times (prebuildAndSign, verifyTransaction, and signTransaction)
    params.keyDocuments.forEach((keyDocument) => {
      nocks.push(
        nock(params.bgUrl).get(`/api/v2/${coin.getChain()}/key/${keyDocument.id}`).times(3).reply(200, keyDocument)
      );
    });

    // nock the address info fetch
    nocks.push(
      nock(params.bgUrl)
        .get(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/address/${params.addressInfo.address}`)
        .reply(200, params.addressInfo)
    );

    // nock the deterministic nonce response
    if (inputScripts.includes('taprootKeyPathSpend')) {
      const psbt = params.prebuild.clone();
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      nocks.push(
        nock(params.bgUrl)
          .post(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/tx/signpsbt`, (body) => body.psbt)
          .reply(200, { psbt: psbt.toHex() })
      );
    }

    return nocks;
  }

  describe(`${coin.getFullName()}-prebuildAndSign-txFormat=${txFormat}-inputScripts=${inputScripts.join(
    ','
  )}`, function () {
    const wallet = getUtxoWallet(coin, {
      coinSpecific: { addressVersion: 'base58' },
      keys: keyDocumentObjects.map((k) => k.id),
      id: 'walletId',
    });

    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    let prebuild: utxolib.bitgo.UtxoPsbt;
    let recipient: { address: string; amount: string };
    let addressInfo: Record<string, any>;
    const fee = BigInt(10000);
    before(async function () {
      // Make output address information
      const outputAmount = BigInt(inputScripts.length) * BigInt(1e8) - fee;
      const outputScriptType: utxolib.bitgo.outputScripts.ScriptType = 'p2sh';
      const outputChain = utxolib.bitgo.getExternalChainCode(outputScriptType);
      const outputAddress = utxolib.bitgo.getWalletAddress(rootWalletKeys, outputChain, 0, coin.network);

      recipient = {
        address: outputAddress,
        amount: outputAmount.toString(),
      };
      addressInfo = {
        address: outputAddress,
        chain: outputChain,
        index: 0,
        coin: coin.getChain(),
        wallet: wallet.id(),
        coinSpecific: {},
      };

      prebuild = createPrebuildPsbt(
        inputScripts.map((s) => ({ scriptType: s, value: BigInt(1e8) })),
        [{ scriptType: outputScriptType, value: outputAmount }]
      );
    });

    afterEach(nock.cleanAll);

    it('should succeed', async function () {
      const nocks = createNocks({ bgUrl, wallet, keyDocuments: keyDocumentObjects, prebuild, recipient, addressInfo });

      // call prebuild and sign, nocks should be consumed
      const res = (await wallet.prebuildAndSignTransaction({
        recipients: [recipient],
        walletPassphrase,
      })) as HalfSignedUtxoTransaction;

      // Can produce the right fee in explain transaction
      const explainedTransaction = await coin.explainTransaction(res);
      assert.strictEqual(explainedTransaction.fee, fee.toString());

      nocks.forEach((nock) => assert.ok(nock.isDone()));

      // Make sure that you can sign with bitgo key and extract the transaction
      const psbt = utxolib.bitgo.createPsbtFromHex(res.txHex, coin.network);

      // No signatures should be present if it's a p2shP2pk input
      if (!inputScripts.includes('p2shP2pk')) {
        const key = inputScripts.includes('p2trMusig2') ? rootWalletKeys.backup : rootWalletKeys.bitgo;
        psbt.signAllInputsHD(key, { deterministic: true });
        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        assert.ok(tx);
      }
    });
  });
}

utxoCoins
  .filter((coin) => utxolib.getMainnet(coin.network) !== utxolib.networks.bitcoinsv)
  .forEach((coin) => {
    scriptTypes.forEach((inputScript) => {
      const inputScriptCleaned = (
        inputScript === 'taprootKeyPathSpend' ? 'p2trMusig2' : inputScript
      ) as utxolib.bitgo.outputScripts.ScriptType2Of3;

      if (!coin.supportsAddressType(inputScriptCleaned)) {
        return;
      }

      run(coin, [inputScript, inputScript], 'psbt');
      if (getReplayProtectionAddresses(coin.network).length) {
        run(coin, ['p2shP2pk', inputScript], 'psbt');
      }
    });
  });
