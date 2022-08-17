/**
 * @prettier
 */
import * as _ from 'lodash';
import * as assert from 'assert';
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import { bitgo } from '@bitgo/utxo-lib';

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
} from './util';

import {
  FullySignedTransaction,
  HalfSignedUtxoTransaction,
  Triple,
  WalletSignTransactionOptions,
} from '@bitgo/sdk-core';

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;
type WalletUnspent<TNumber extends number | bigint = number> = bitgo.WalletUnspent<TNumber>;

function run<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  inputScripts: InputScriptType[],
  amountType: 'number' | 'bigint' = 'number'
) {
  describe(`Transaction Stages ${coin.getChain()} (${amountType}) scripts=${inputScripts.join(',')}`, function () {
    const wallet = getUtxoWallet(coin);
    const walletKeys = getDefaultWalletKeys();
    const value = (amountType === 'bigint' ? BigInt('10999999800000001') : 1e8) as TNumber;
    const fullSign = !inputScripts.some((s) => s === 'replayProtection');

    function getUnspents(): Unspent<TNumber>[] {
      return inputScripts.map((type, i) => mockUnspent<TNumber>(coin.network, walletKeys, type, i, value));
    }

    function getOutputAddress(): string {
      return coin.generateAddress({
        keychains: walletKeys.triple.map((k) => ({ pub: k.neutered().toBase58() })),
      }).address;
    }

    function getSignParams(
      prebuildHex: string,
      signer: bip32.BIP32Interface,
      cosigner: bip32.BIP32Interface
    ): WalletSignTransactionOptions {
      const txInfo = {
        unspents: getUnspents(),
      };
      return {
        txPrebuild: {
          txHex: prebuildHex,
          txInfo,
        },
        prv: signer.toBase58(),
        pubs: walletKeys.triple.map((k) => k.neutered().toBase58()),
        cosignerPub: cosigner.neutered().toBase58(),
      };
    }

    function createHalfSignedTransaction(
      prebuild: utxolib.bitgo.UtxoTransaction<TNumber>,
      signer: bip32.BIP32Interface,
      cosigner: bip32.BIP32Interface
    ): Promise<HalfSignedUtxoTransaction> {
      // half-sign with the user key
      return wallet.signTransaction(
        getSignParams(prebuild.toBuffer().toString('hex'), signer, cosigner)
      ) as Promise<HalfSignedUtxoTransaction>;
    }

    async function createFullSignedTransaction(
      halfSigned: HalfSignedUtxoTransaction,
      signer: bip32.BIP32Interface,
      cosigner: bip32.BIP32Interface
    ): Promise<FullySignedTransaction> {
      return (await wallet.signTransaction({
        ...getSignParams(halfSigned.txHex, signer, cosigner),
        isLastSignature: true,
      })) as FullySignedTransaction;
    }

    type TransactionStages = {
      prebuild: utxolib.bitgo.UtxoTransaction<TNumber>;
      halfSignedUserBackup: HalfSignedUtxoTransaction;
      halfSignedUserBitGo: HalfSignedUtxoTransaction;
      fullSignedUserBackup?: FullySignedTransaction;
      fullSignedUserBitGo?: FullySignedTransaction;
    };

    type TransactionObjStages = Record<keyof TransactionStages, TransactionObj>;

    async function getTransactionStages(): Promise<TransactionStages> {
      const prebuild = createPrebuildTransaction<TNumber>(coin.network, getUnspents(), getOutputAddress());
      const halfSignedUserBackup = await createHalfSignedTransaction(prebuild, walletKeys.user, walletKeys.backup);
      const fullSignedUserBackup = fullSign
        ? await createFullSignedTransaction(halfSignedUserBackup, walletKeys.backup, walletKeys.user)
        : undefined;
      const halfSignedUserBitGo = await createHalfSignedTransaction(prebuild, walletKeys.user, walletKeys.bitgo);
      const fullSignedUserBitGo = fullSign
        ? await createFullSignedTransaction(halfSignedUserBitGo, walletKeys.bitgo, walletKeys.user)
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

    it('match fixtures', async function () {
      function toTransactionStagesObj(stages: TransactionStages): TransactionObjStages {
        return _.mapValues(stages, (v) =>
          v === undefined
            ? undefined
            : v instanceof utxolib.bitgo.UtxoTransaction
            ? transactionToObj<TNumber>(v)
            : transactionHexToObj(v.txHex, coin.network, amountType)
        ) as TransactionObjStages;
      }

      shouldEqualJSON(
        toTransactionStagesObj(transactionStages),
        await getFixture(coin, `transactions-${inputScripts.join('-')}`, toTransactionStagesObj(transactionStages))
      );
    });

    function testValidSignatures(
      tx: HalfSignedUtxoTransaction | FullySignedTransaction,
      signedBy: bip32.BIP32Interface[]
    ) {
      const unspents = getUnspents();
      const prevOutputs = unspents.map(
        (u): utxolib.TxOutput<TNumber> => ({
          script: utxolib.address.toOutputScript(u.address, coin.network),
          value: u.value,
        })
      );

      const transaction = utxolib.bitgo.createTransactionFromBuffer<TNumber>(
        Buffer.from(tx.txHex, 'hex'),
        coin.network,
        undefined,
        amountType
      );
      transaction.ins.forEach((input, index) => {
        if (inputScripts[index] === 'replayProtection') {
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
      unspents: utxolib.bitgo.Unspent<TNumber>[],
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
        inputScripts.map((type) => (type === 'replayProtection' ? 0 : expectedSignatureCount))
      );
      explanation.signatures.should.eql(expectedSignatureCount);
      explanation.changeAmount.should.eql('0'); // no change addresses given
      let expectedOutputAmount = BigInt(getUnspents().length) * BigInt(value);
      inputScripts.forEach((type) => {
        if (type === 'replayProtection') {
          // replayProtection unspents have value 1000
          expectedOutputAmount -= BigInt(value);
          expectedOutputAmount += BigInt(1000);
        }
      });
      expectedOutputAmount -= BigInt(1000); // fee of 1000
      explanation.outputAmount.should.eql(expectedOutputAmount.toString());
    }

    it('have valid signature for half-signed transaction', function () {
      testValidSignatures(transactionStages.halfSignedUserBackup, [walletKeys.user]);
      testValidSignatures(transactionStages.halfSignedUserBitGo, [walletKeys.user]);
    });

    it('have valid signatures for full-signed transaction', function () {
      if (!fullSign) {
        // @ts-expect-error - no implicit this
        return this.skip();
      }
      assert(transactionStages.fullSignedUserBackup && transactionStages.fullSignedUserBitGo);
      testValidSignatures(transactionStages.fullSignedUserBackup, [walletKeys.user, walletKeys.backup]);
      testValidSignatures(transactionStages.fullSignedUserBitGo, [walletKeys.user, walletKeys.bitgo]);
    });

    it('have correct results for explainTransaction', async function () {
      for (const [stageName, stageTx] of Object.entries(transactionStages)) {
        if (!stageTx) {
          continue;
        }

        let txHex;
        if (stageTx instanceof utxolib.bitgo.UtxoTransaction) {
          txHex = stageTx.toBuffer().toString('hex');
        } else {
          txHex = stageTx.txHex;
        }

        const pubs = walletKeys.triple.map((k) => k.neutered().toBase58()) as Triple<string>;
        const unspents = getUnspents();
        await testExplainTx(stageName, txHex, unspents, pubs);
        await testExplainTx(stageName, txHex, unspents);
      }
    });
  });
}

function runWithAmountType(coin: AbstractUtxoCoin, inputScripts: InputScriptType[]) {
  const amountType = coin.amountType;
  if (amountType === 'bigint') {
    run<bigint>(coin, inputScripts, amountType);
  } else {
    run(coin, inputScripts, amountType);
  }
}

utxoCoins.forEach((coin) =>
  utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((type) => {
    if (coin.supportsAddressType(type)) {
      runWithAmountType(coin, [type, type]);

      if (getReplayProtectionAddresses(coin.network).length) {
        runWithAmountType(coin, ['replayProtection', type]);
      }
    }
  })
);
