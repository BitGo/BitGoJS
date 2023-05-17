/**
 * @prettier
 */
import * as assert from 'assert';

import { AbstractUtxoCoin, getReplayProtectionAddresses } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import * as nock from 'nock';

import { encryptKeychain, getDefaultWalletKeys, getUtxoWallet, keychainsBase58, utxoCoins } from './util';
import { common, Wallet } from '@bitgo/sdk-core';
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

  function createNocks(
    bgUrl: string,
    wallet: Wallet,
    keyDocuments: KeyDoc[],
    prebuild: string,
    recipient: { address: string; amount: string },
    addressInfo: Record<string, any>
  ): nock.Scope[] {
    const nocks: nock.Scope[] = [];

    // Nock the prebuild route (/tx/build, blockheight)
    nocks.push(
      nock(bgUrl)
        .post(`/api/v2/${coin.getChain()}/wallet/${wallet.id()}/tx/build`, { recipients: [recipient] })
        .reply(200, { txHex: prebuild })
    );
    nocks.push(nock(bgUrl).get(`/api/v2/${coin.getChain()}/public/block/latest`).reply(200, { height: 1000 }));

    // nock the keychain fetch - 3 times (prebuildAndSign, verifyTransaction, and signTransaction)
    keyDocuments.forEach((keyDocument) => {
      nocks.push(nock(bgUrl).get(`/api/v2/${coin.getChain()}/key/${keyDocument.id}`).times(3).reply(200, keyDocument));
    });

    // nock the address info fetch
    nocks.push(
      nock(bgUrl)
        .get(`/api/v2/${coin.getChain()}/wallet/${wallet.id()}/address/${addressInfo.address}`)
        .reply(200, addressInfo)
    );

    // Nock the previous transaction txids
    const psbt = utxolib.bitgo.createPsbtFromHex(prebuild, coin.network);
    psbt.getUnsignedTx().ins.forEach((input, inputIndex) => {
      const unspent = utxolib.testutil.toUnspent(
        {
          scriptType: inputScripts[inputIndex],
          value: BigInt(1e8),
        },
        inputIndex,
        coin.network,
        rootWalletKeys
      );
      // Only thing we care about is that the address and value is at the correct respective previous
      // output index
      const outputs = psbt.data.inputs.map((_, ii) =>
        ii === inputIndex
          ? {
              address: unspent.address,
              value: BigInt(unspent.value).toString(),
              valueString: BigInt(unspent.value).toString(),
            }
          : {}
      );
      const payload = { outputs };
      const txId = (Buffer.from(input.hash).reverse() as Buffer).toString('hex');

      nocks.push(nock(bgUrl).get(`/api/v2/${coin.getChain()}/public/tx/${txId}`).reply(200, payload));
    });

    if (inputScripts.includes('taprootKeyPathSpend')) {
      // nock the deterministic nonce response
      const psbt = utxolib.bitgo.createPsbtFromHex(prebuild, coin.network);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      nocks.push(
        nock(bgUrl)
          .post(`/api/v2/${coin.getChain()}/wallet/${wallet.id()}/tx/signpsbt`, (body) => body.psbt)
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
    // bitgo.initializeTestVars();
    const bgUrl = common.Environments[bitgo.getEnv()].uri;

    let prebuild: utxolib.bitgo.UtxoPsbt;
    let recipient: { address: string; amount: string };
    let addressInfo: Record<string, any>;
    before(async function () {
      // Make output address information
      const outputAmount = BigInt(inputScripts.length) * BigInt(1e8) - BigInt(10000);
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

    it('should succeed', async function () {
      const nocks = createNocks(bgUrl, wallet, keyDocumentObjects, prebuild.toHex(), recipient, addressInfo);

      // call prebuild and sign, nocks should be consumed
      await wallet.prebuildAndSignTransaction({ recipients: [recipient], walletPassphrase });

      nocks.forEach((nock) => assert.ok(nock.isDone()));

      // Make sure that you can sign with bitgo key and extract the transaction
    });
  });
}

utxoCoins.forEach((coin) => {
  scriptTypes.forEach((inputScriptType) => {
    const inputScript = (
      inputScriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : inputScriptType
    ) as utxolib.bitgo.outputScripts.ScriptType2Of3;

    if (!coin.supportsAddressType(inputScript)) {
      return;
    }
    txFormats.forEach((txFormat) => {
      // TODO BG-77799 should handle this case in the future
      if (txFormat === 'legacy' && inputScript === 'p2trMusig2') {
        return;
      }

      if (txFormat === 'legacy') {
        return;
      }

      run(coin, [inputScriptType, inputScriptType], txFormat);
      if (getReplayProtectionAddresses(coin.network).length) {
        run(coin, ['p2shP2pk', inputScript], txFormat);
      }
    });
  });
});
