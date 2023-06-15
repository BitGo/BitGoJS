/**
 * @prettier
 */
import 'mocha';
import * as _ from 'lodash';
import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import * as nock from 'nock';
import { BIP32Interface, bitgo, testutil } from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, getReplayProtectionAddresses } from '@bitgo/abstract-utxo';

import {
  utxoCoins,
  shouldEqualJSON,
  getFixture,
  getUtxoWallet,
  mockUnspent,
  InputScriptType,
  TransactionObj,
  transactionToObj,
  transactionHexToObj,
  createPrebuildTransaction,
  getDefaultWalletKeys,
  getUtxoCoin,
  keychainsBase58,
} from './util';

import {
  common,
  FullySignedTransaction,
  HalfSignedUtxoTransaction,
  Triple,
  WalletSignTransactionOptions,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src';

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;
type WalletUnspent<TNumber extends number | bigint = number> = bitgo.WalletUnspent<TNumber>;

function getScriptTypes2Of3() {
  return [...bitgo.outputScripts.scriptTypes2Of3, 'taprootKeyPathSpend'] as const;
}

describe(`UTXO coin signTransaction`, async function () {
  const bgUrl = common.Environments[TestBitGo.decorate(BitGo, { env: 'mock' }).getEnv()].uri;

  const coin = getUtxoCoin('btc');
  const wallet = getUtxoWallet(coin, { id: '5b34252f1bf349930e34020a00000000', coin: coin.getChain() });
  const rootWalletKeys = getDefaultWalletKeys();
  const userPrv = rootWalletKeys.user.toBase58();
  const pubs = keychainsBase58.map((v) => v.pub) as Triple<string>;

  async function signTransaction(
    tx: utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint>,
    unspents?: Unspent<bigint>[]
  ) {
    const isPsbt = tx instanceof utxolib.bitgo.UtxoPsbt;
    const isTxWithTaprootKeyPathSpend = isPsbt && utxolib.bitgo.isTransactionWithKeyPathSpendInput(tx);
    const txHex = tx.toHex();

    const signerNoncePsbt = await coin.signTransaction({
      txPrebuild: { txHex, txInfo: {} },
      prv: isTxWithTaprootKeyPathSpend ? userPrv : undefined,
      signingStep: 'signerNonce',
    });
    assert.ok('txHex' in signerNoncePsbt);
    const cosignerNoncePsbt = await coin.signTransaction({
      txPrebuild: { ...signerNoncePsbt, txInfo: {}, walletId: isTxWithTaprootKeyPathSpend ? wallet.id() : undefined },
      signingStep: 'cosignerNonce',
    });
    assert.ok('txHex' in cosignerNoncePsbt);
    await coin.signTransaction({
      txPrebuild: { ...cosignerNoncePsbt, txInfo: { unspents: isPsbt ? undefined : unspents } },
      prv: userPrv,
      pubs: isPsbt ? undefined : pubs,
      signingStep: 'signerSignature',
    });
  }

  it('success when called like customSigningFunction flow - PSBT with taprootKeyPathSpend inputs', async function () {
    const inputs: testutil.Input[] = testutil.inputScriptTypes.map((scriptType) => ({
      scriptType,
      value: BigInt(1000),
    }));
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];

    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');

    const scope = nock(bgUrl)
      .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/signpsbt`, (body) => body.psbt)
      .reply(200, { psbt: psbt.clone().setAllInputsMusig2NonceHD(rootWalletKeys.bitgo).toHex() });

    await signTransaction(psbt);
    assert.strictEqual(scope.isDone(), true);
  });

  it('success when called like customSigningFunction flow - PSBT without taprootKeyPathSpend inputs', async function () {
    const inputs: testutil.Input[] = testutil.inputScriptTypes
      .filter((v) => v !== 'taprootKeyPathSpend')
      .map((scriptType) => ({
        scriptType,
        value: BigInt(1000),
      }));
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');

    await signTransaction(psbt);
  });

  it('success when called like customSigningFunction flow - Network Tx', async function () {
    const inputs: testutil.TxnInput<bigint>[] = testutil.txnInputScriptTypes
      .filter((v) => v !== 'p2shP2pk')
      .map((scriptType) => ({
        scriptType,
        value: BigInt(1000),
      }));
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.TxnOutput<bigint>[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const txBuilder = testutil.constructTxnBuilder(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');
    const unspents = inputs.map((v, i) => testutil.toTxnUnspent(v, i, coin.network, rootWalletKeys));

    await signTransaction(txBuilder.buildIncomplete(), unspents);
  });
});

function run<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  inputScripts: testutil.InputScriptType[],
  txFormat: 'legacy' | 'psbt',
  amountType: 'number' | 'bigint' = 'number'
) {
  describe(`Transaction Stages ${coin.getChain()} (${amountType}) scripts=${inputScripts.join(
    ','
  )} txFormat=${txFormat}`, function () {
    const bgUrl = common.Environments[TestBitGo.decorate(BitGo, { env: 'mock' }).getEnv()].uri;

    const isTransactionWithKeyPathSpend = inputScripts.some((s) => s === 'taprootKeyPathSpend');
    const isTransactionWithReplayProtection = inputScripts.some((s) => s === 'p2shP2pk');
    const isTransactionWithP2tr = inputScripts.some((s) => s === 'p2tr');
    const isTransactionWithP2trMusig2 = inputScripts.some((s) => s === 'p2trMusig2');

    const value = (amountType === 'bigint' ? BigInt('10999999800000001') : 1e8) as TNumber;
    const wallet = getUtxoWallet(coin, { id: '5b34252f1bf349930e34020a00000000', coin: coin.getChain() });
    const walletKeys = getDefaultWalletKeys();

    const fullSign = !(isTransactionWithReplayProtection || isTransactionWithKeyPathSpend);

    function getUnspentsForPsbt(): Unspent<bigint>[] {
      return inputScripts.map((t, index) => {
        return testutil.toUnspent(
          { scriptType: t, value: t === 'p2shP2pk' ? BigInt(1000) : BigInt(value) },
          index,
          coin.network,
          walletKeys
        );
      });
    }

    function toTxnInputScriptType(type: testutil.InputScriptType): InputScriptType {
      return type === 'p2shP2pk' ? 'replayProtection' : type === 'taprootKeyPathSpend' ? 'p2trMusig2' : type;
    }

    function getUnspents(): Unspent<TNumber>[] {
      return inputScripts.map((type, i) =>
        mockUnspent<TNumber>(coin.network, walletKeys, toTxnInputScriptType(type), i, value)
      );
    }

    function getOutputAddress(): string {
      return coin.generateAddress({
        keychains: walletKeys.triple.map((k) => ({ pub: k.neutered().toBase58() })),
      }).address;
    }

    function getSignParams(
      prebuildHex: string,
      signer: BIP32Interface,
      cosigner: BIP32Interface
    ): WalletSignTransactionOptions {
      const txInfo = {
        unspents: txFormat === 'psbt' ? undefined : getUnspents(),
      };
      return {
        txPrebuild: {
          walletId: isTransactionWithKeyPathSpend ? wallet.id() : undefined,
          txHex: prebuildHex,
          txInfo,
        },
        prv: signer.toBase58(),
        pubs: walletKeys.triple.map((k) => k.neutered().toBase58()),
        cosignerPub: cosigner.neutered().toBase58(),
      } as WalletSignTransactionOptions;
    }

    async function createHalfSignedTransaction(
      prebuild: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt,
      signer: BIP32Interface,
      cosigner: BIP32Interface
    ): Promise<HalfSignedUtxoTransaction> {
      let scope: nock.Scope | undefined;
      if (prebuild instanceof utxolib.bitgo.UtxoPsbt && isTransactionWithKeyPathSpend) {
        const psbt = prebuild.clone().setAllInputsMusig2NonceHD(cosigner);
        scope = nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/signpsbt`, (body) => body.psbt)
          .reply(200, { psbt: psbt.toHex() });
      }

      // half-sign with the user key
      const result = (await wallet.signTransaction(
        getSignParams(prebuild.toBuffer().toString('hex'), signer, cosigner)
      )) as Promise<HalfSignedUtxoTransaction>;

      if (scope) {
        assert.strictEqual(scope.isDone(), true);
      }

      return result;
    }

    async function createFullSignedTransaction(
      halfSigned: HalfSignedUtxoTransaction,
      signer: BIP32Interface,
      cosigner: BIP32Interface
    ): Promise<FullySignedTransaction> {
      return (await wallet.signTransaction({
        ...getSignParams(halfSigned.txHex, signer, cosigner),
        isLastSignature: true,
      })) as FullySignedTransaction;
    }

    type TransactionStages = {
      prebuild: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt;
      halfSignedUserBackup?: HalfSignedUtxoTransaction;
      halfSignedUserBitGo: HalfSignedUtxoTransaction;
      fullSignedUserBackup?: FullySignedTransaction;
      fullSignedUserBitGo?: FullySignedTransaction;
    };

    type TransactionObjStages = Record<keyof TransactionStages, TransactionObj>;

    function createPrebuildPsbt() {
      const inputs = inputScripts.map(
        (t): testutil.Input => ({
          scriptType: t,
          value: t === 'p2shP2pk' ? BigInt(1000) : BigInt(value),
        })
      );
      const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
      const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
      return testutil.constructPsbt(inputs, outputs, coin.network, walletKeys, 'unsigned');
    }

    async function getTransactionStages(): Promise<TransactionStages> {
      const prebuild =
        txFormat === 'psbt'
          ? createPrebuildPsbt()
          : createPrebuildTransaction<TNumber>(coin.network, getUnspents(), getOutputAddress());

      const halfSignedUserBitGo = await createHalfSignedTransaction(prebuild, walletKeys.user, walletKeys.bitgo);
      const fullSignedUserBitGo =
        fullSign && !isTransactionWithP2trMusig2
          ? await createFullSignedTransaction(halfSignedUserBitGo, walletKeys.bitgo, walletKeys.user)
          : undefined;

      const halfSignedUserBackup =
        !isTransactionWithKeyPathSpend && !(txFormat === 'psbt' && isTransactionWithP2tr)
          ? await createHalfSignedTransaction(prebuild, walletKeys.user, walletKeys.backup)
          : undefined;
      const fullSignedUserBackup =
        fullSign && halfSignedUserBackup
          ? await createFullSignedTransaction(halfSignedUserBackup, walletKeys.backup, walletKeys.user)
          : undefined;

      return {
        prebuild,
        halfSignedUserBackup,
        halfSignedUserBitGo,
        fullSignedUserBackup,
        fullSignedUserBitGo,
      };
    }

    let transactionStages: TransactionStages;

    before('prepare', async function () {
      transactionStages = await getTransactionStages();
    });

    afterEach(nock.cleanAll);

    it('match fixtures', async function (this: Mocha.Context) {
      if (txFormat === 'psbt') {
        // TODO (maybe) - once full PSBT support is added to abstract-utxo module, custom JSON representation of PSBT can be created and tested here.
        // signatures of taprootKeyPathSpends are random since random nature of MuSig2 nonce, so psbt hex comparison also wont work.

        return this.skip();
      }

      function toTransactionStagesObj(stages: TransactionStages): TransactionObjStages {
        return _.mapValues(stages, (v) =>
          v === undefined || v instanceof utxolib.bitgo.UtxoPsbt
            ? undefined
            : v instanceof utxolib.bitgo.UtxoTransaction
            ? transactionToObj<TNumber>(v)
            : transactionHexToObj(v.txHex, coin.network, amountType)
        ) as TransactionObjStages;
      }

      shouldEqualJSON(
        toTransactionStagesObj(transactionStages),
        await getFixture(
          coin,
          `transactions-${inputScripts.map((t) => toTxnInputScriptType(t)).join('-')}`,
          toTransactionStagesObj(transactionStages)
        )
      );
    });

    function testPsbtValidSignatures(tx: HalfSignedUtxoTransaction, signedBy: BIP32Interface[]) {
      const psbt = utxolib.bitgo.createPsbtFromHex(tx.txHex, coin.network);
      const unspents = getUnspentsForPsbt();
      psbt.data.inputs.forEach((input, index) => {
        const unspent = unspents[index];
        if (!utxolib.bitgo.isWalletUnspent(unspent)) {
          assert.ok(utxolib.bitgo.getPsbtInputScriptType(input), 'p2shP2pk');
          return;
        }
        const pubkeys = walletKeys.deriveForChainAndIndex(unspent.chain, unspent.index).publicKeys;
        pubkeys.forEach((pk, pkIndex) => {
          psbt.validateSignaturesOfInputCommon(index, pk).should.eql(signedBy.includes(walletKeys.triple[pkIndex]));
        });
      });
    }

    function testValidSignatures(
      tx: HalfSignedUtxoTransaction | FullySignedTransaction,
      signedBy: BIP32Interface[],
      sign: 'halfsigned' | 'fullsigned'
    ) {
      if (txFormat === 'psbt' && sign === 'halfsigned') {
        testPsbtValidSignatures(tx, signedBy);
        return;
      }
      const unspents =
        txFormat === 'psbt'
          ? getUnspentsForPsbt().map((u) => ({ ...u, value: bitgo.toTNumber(u.value, amountType) as TNumber }))
          : getUnspents();
      const prevOutputs = unspents.map(
        (u): utxolib.TxOutput<TNumber> => ({
          script: utxolib.address.toOutputScript(u.address, coin.network),
          value: u.value,
        })
      );

      const transaction = utxolib.bitgo.createTransactionFromBuffer<TNumber>(
        Buffer.from(tx.txHex, 'hex'),
        coin.network,
        { amountType }
      );
      transaction.ins.forEach((input, index) => {
        if (inputScripts[index] === 'p2shP2pk') {
          assert(coin.isBitGoTaintedUnspent(unspents[index]));
          return;
        }

        const unspent = unspents[index] as WalletUnspent<TNumber>;
        const pubkeys = walletKeys.deriveForChainAndIndex(unspent.chain, unspent.index).publicKeys;

        pubkeys.forEach((pk, pkIndex) => {
          utxolib.bitgo
            .verifySignature<TNumber>(
              transaction,
              index,
              prevOutputs[index].value,
              {
                publicKey: pk,
              },
              prevOutputs
            )
            .should.eql(signedBy.includes(walletKeys.triple[pkIndex]));
        });
      });
    }

    async function testExplainTx(
      stageName: string,
      txHex: string,
      unspents?: utxolib.bitgo.Unspent<TNumber>[],
      pubs?: Triple<string>
    ): Promise<void> {
      const explanation = await coin.explainTransaction<TNumber>({
        txHex,
        txInfo: {
          unspents,
        },
        pubs,
      });

      explanation.should.have.properties(
        'displayOrder',
        'id',
        'outputs',
        'changeOutputs',
        'changeAmount',
        'outputAmount',
        'inputSignatures',
        'signatures'
      );

      const expectedSignatureCount =
        stageName === 'prebuild' || pubs === undefined
          ? 0
          : stageName.startsWith('halfSigned')
          ? 1
          : stageName.startsWith('fullSigned')
          ? 2
          : undefined;

      explanation.inputSignatures.should.eql(
        // FIXME(BG-35154): implement signature verification for replay protection inputs
        inputScripts.map((type) => (type === 'p2shP2pk' ? 0 : expectedSignatureCount))
      );
      explanation.signatures.should.eql(expectedSignatureCount);
      explanation.changeAmount.should.eql('0'); // no change addresses given
      let expectedOutputAmount =
        BigInt((txFormat === 'psbt' ? getUnspentsForPsbt() : getUnspents()).length) * BigInt(value);
      inputScripts.forEach((type) => {
        if (type === 'p2shP2pk') {
          // replayProtection unspents have value 1000
          expectedOutputAmount -= BigInt(value);
          expectedOutputAmount += BigInt(1000);
        }
      });
      expectedOutputAmount -= BigInt(1000); // fee of 1000
      explanation.outputAmount.should.eql(expectedOutputAmount.toString());
    }

    it('have valid signature for half-signed transaction', function () {
      if (transactionStages.halfSignedUserBackup) {
        testValidSignatures(transactionStages.halfSignedUserBackup, [walletKeys.user], 'halfsigned');
      }
      testValidSignatures(transactionStages.halfSignedUserBitGo, [walletKeys.user], 'halfsigned');
    });

    it('have valid signatures for full-signed transaction', function () {
      if (!fullSign) {
        return this.skip();
      }
      if (transactionStages.fullSignedUserBackup) {
        testValidSignatures(transactionStages.fullSignedUserBackup, [walletKeys.user, walletKeys.backup], 'fullsigned');
      }
      if (transactionStages.fullSignedUserBitGo) {
        testValidSignatures(transactionStages.fullSignedUserBitGo, [walletKeys.user, walletKeys.bitgo], 'fullsigned');
      }
    });

    it('have correct results for explainTransaction', async function () {
      for (const [stageName, stageTx] of Object.entries(transactionStages)) {
        if (!stageTx) {
          continue;
        }

        const txHex =
          stageTx instanceof utxolib.bitgo.UtxoPsbt || stageTx instanceof utxolib.bitgo.UtxoTransaction
            ? stageTx.toBuffer().toString('hex')
            : stageTx.txHex;

        const pubs = walletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
        const unspents =
          txFormat === 'psbt'
            ? getUnspentsForPsbt().map((u) => ({ ...u, value: bitgo.toTNumber(u.value, amountType) as TNumber }))
            : getUnspents();
        await testExplainTx(stageName, txHex, unspents, pubs);
        await testExplainTx(stageName, txHex, unspents);
      }
    });
  });
}

function runWithAmountType(
  coin: AbstractUtxoCoin,
  inputScripts: testutil.InputScriptType[],
  txFormat: 'legacy' | 'psbt'
) {
  const amountType = coin.amountType;
  if (amountType === 'bigint') {
    run<bigint>(coin, inputScripts, txFormat, amountType);
  } else {
    run(coin, inputScripts, txFormat, amountType);
  }
}

utxoCoins.forEach((coin) =>
  getScriptTypes2Of3().forEach((type) => {
    (['legacy', 'psbt'] as const).forEach((txFormat) => {
      if ((type === 'taprootKeyPathSpend' || type === 'p2trMusig2') && txFormat !== 'psbt') {
        return;
      }
      if (coin.supportsAddressType(type === 'taprootKeyPathSpend' ? 'p2trMusig2' : type)) {
        runWithAmountType(coin, [type, type], txFormat);

        if (getReplayProtectionAddresses(coin.network).length) {
          runWithAmountType(coin, ['p2shP2pk', type], txFormat);
        }
      }
    });
  })
);
