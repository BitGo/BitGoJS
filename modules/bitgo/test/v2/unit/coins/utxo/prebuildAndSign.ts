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
const webauthnWalletPassPhrase = 'just the gabagool';

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
    webauthnDevices: [
      {
        otpDeviceId: '123',
        authenticatorInfo: {
          credID: 'credID',
          fmt: 'packed',
          publicKey: 'some value',
        },
        prfSalt: '456',
        encryptedPrv: encryptKeychain(webauthnWalletPassPhrase, keychainsBase58[keyIdx]),
      },
    ],
    coinSpecific: {},
  };
});

function run(coin: AbstractUtxoCoin, inputScripts: ScriptType[], txFormat: TxFormat): void {
  function createPrebuildPsbt(inputs: Input[], outputs: { scriptType: 'p2sh'; value: bigint }[]) {
    const psbt = utxolib.testutil.constructPsbt(
      inputs as utxolib.testutil.Input[],
      outputs,
      coin.network,
      rootWalletKeys,
      'unsigned'
    );
    utxolib.bitgo.addXpubsToPsbt(psbt, rootWalletKeys);
    return psbt;
  }

  function createNocks(params: {
    bgUrl: string;
    wallet: Wallet;
    keyDocuments: KeyDoc[];
    prebuild: utxolib.bitgo.UtxoPsbt;
    recipient: { address: string; amount: string };
    addressInfo: Record<string, any>;
    rbfTxIds?: string[];
    feeMultiplier?: number;
    selfSend?: boolean;
    nockOutputAddresses?: boolean;
  }): nock.Scope[] {
    const nocks: nock.Scope[] = [];

    // Nock the prebuild route (/tx/build, blockheight)
    nocks.push(
      nock(params.bgUrl)
        .post(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/tx/build`, {
          recipients: [params.recipient],
          rbfTxIds: params.rbfTxIds,
          feeMultiplier: params.feeMultiplier,
        })
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
    if (params.nockOutputAddresses) {
      nocks.push(
        nock(params.bgUrl)
          .get(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/address/${params.addressInfo.address}`)
          .reply(200, params.addressInfo)
      );
    }

    if (params.rbfTxIds) {
      nocks.push(
        nock(params.bgUrl)
          .get(`/api/v2/${coin.getChain()}/wallet/${params.wallet.id()}/tx/${params.rbfTxIds[0]}?includeRbf=true`)
          .reply(200, {
            outputs: [
              {
                address: params.recipient.address,
                value: Number(params.recipient.amount),
                valueString: params.recipient.amount,
                wallet: params.selfSend ? params.wallet.id() : 'some-other-wallet-id', // external output if not a self send
              },
              // Dummy change output to test transfer entries filtering
              {
                address: params.recipient.address,
                value: Number(params.recipient.amount),
                valueString: params.recipient.amount,
                wallet: params.wallet.id(), // internal output
              },
            ],
          })
      );
    }

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

    [true, false].forEach((useWebauthn) => {
      it(`should succeed with ${useWebauthn ? 'webauthn encryptedPrv' : 'encryptedPrv'}`, async function () {
        const nocks = createNocks({
          bgUrl,
          wallet,
          keyDocuments: keyDocumentObjects,
          prebuild,
          recipient,
          addressInfo,
          nockOutputAddresses: txFormat !== 'psbt',
        });

        // call prebuild and sign, nocks should be consumed
        const res = (await wallet.prebuildAndSignTransaction({
          recipients: [recipient],
          walletPassphrase: useWebauthn ? webauthnWalletPassPhrase : walletPassphrase,
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

      it('should fail if the wallet passphrase is incorrect', async function () {
        createNocks({
          bgUrl,
          wallet,
          keyDocuments: keyDocumentObjects,
          prebuild,
          recipient,
          addressInfo,
          nockOutputAddresses: txFormat !== 'psbt',
        });

        await wallet
          .prebuildAndSignTransaction({
            recipients: [recipient],
            walletPassphrase: Math.random().toString(),
          })
          .should.be.rejectedWith('unable to decrypt keychain with the given wallet passphrase');
      });
    });

    [true, false].forEach((selfSend) => {
      it(`should be able to build, sign, & verify a replacement transaction with selfSend: ${selfSend}`, async function () {
        const rbfTxIds = ['tx-to-be-replaced'],
          feeMultiplier = 1.5;
        const nocks = createNocks({
          bgUrl,
          wallet,
          keyDocuments: keyDocumentObjects,
          prebuild,
          recipient,
          addressInfo,
          rbfTxIds,
          feeMultiplier,
          selfSend,
          nockOutputAddresses: txFormat !== 'psbt',
        });

        // call prebuild and sign, nocks should be consumed
        const res = (await wallet.prebuildAndSignTransaction({
          recipients: [recipient],
          walletPassphrase,
          rbfTxIds,
          feeMultiplier,
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
  });
}

utxoCoins
  .filter((coin) => utxolib.getMainnet(coin.network) !== utxolib.networks.bitcoinsv)
  .forEach((coin) => {
    scriptTypes
      // Don't iterate over p2shP2pk - in no scenario would a wallet spend two p2shP2pk inputs as these
      // are single signature inputs that are used for replay protection and are added to the transaction
      // by our system from a separate wallet. We do run tests below where one of the inputs is a p2shP2pk and
      // the other is an input spent by the user.
      .filter((scriptType) => scriptType !== 'p2shP2pk')
      .forEach((inputScript) => {
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
