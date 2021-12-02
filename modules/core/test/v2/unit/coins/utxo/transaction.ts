/**
 * @prettier
 */
import * as _ from 'lodash';
import * as assert from 'assert';
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin } from '../../../../../src/v2/coins';
import { Unspent, WalletUnspent } from '../../../../../src/v2/coins/utxo/unspent';
import { getReplayProtectionAddresses } from '../../../../../src/v2/coins/utxo/replayProtection';

import {
  utxoCoins,
  keychains,
  shouldEqualJSON,
  getFixture,
  getUtxoWallet,
  mockUnspent,
  InputScriptType,
  TransactionObj,
  transactionToObj,
  transactionHexToObj,
  createPrebuildTransaction,
} from './util';

import { FullySignedTransaction, HalfSignedUtxoTransaction, WalletSignTransactionOptions } from '../../../../../src';

import { deriveKey } from '../../../../../src/v2/coins/utxo/sign';

function run(coin: AbstractUtxoCoin, inputScripts: InputScriptType[]) {
  describe(`Transaction Stages ${coin.getChain()} scripts=${inputScripts.join(',')}`, function () {
    const wallet = getUtxoWallet(coin);
    const value = 1e8;
    const fullSign = !inputScripts.some((s) => s === 'replayProtection');

    function getUnspents(): Unspent[] {
      return inputScripts.map((type, i) => mockUnspent(coin.network, type, i, value));
    }

    function getOutputAddress(): string {
      return coin.generateAddress({
        keychains: keychains.map((k) => ({ pub: k.neutered().toBase58() })),
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
        pubs: keychains.map((k) => k.neutered().toBase58()),
        cosignerPub: cosigner.neutered().toBase58(),
      };
    }

    function createHalfSignedTransaction(
      prebuild: utxolib.bitgo.UtxoTransaction,
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
      prebuild: utxolib.bitgo.UtxoTransaction;
      halfSignedUserBackup: HalfSignedUtxoTransaction;
      halfSignedUserBitGo: HalfSignedUtxoTransaction;
      fullSignedUserBackup?: FullySignedTransaction;
      fullSignedUserBitGo?: FullySignedTransaction;
    };

    type TransactionObjStages = Record<keyof TransactionStages, TransactionObj>;

    async function getTransactionStages(): Promise<TransactionStages> {
      const prebuild = createPrebuildTransaction(coin.network, getUnspents(), getOutputAddress());
      const halfSignedUserBackup = await createHalfSignedTransaction(prebuild, keychains[0], keychains[1]);
      const fullSignedUserBackup = fullSign
        ? await createFullSignedTransaction(halfSignedUserBackup, keychains[1], keychains[0])
        : undefined;
      const halfSignedUserBitGo = await createHalfSignedTransaction(prebuild, keychains[0], keychains[2]);
      const fullSignedUserBitGo = fullSign
        ? await createFullSignedTransaction(halfSignedUserBitGo, keychains[2], keychains[0])
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
            ? transactionToObj(v)
            : transactionHexToObj(v.txHex, coin.network)
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
        (u): utxolib.TxOutput => ({
          script: utxolib.address.toOutputScript(u.address, coin.network),
          value: u.value,
        })
      );

      const transaction = utxolib.bitgo.createTransactionFromBuffer(Buffer.from(tx.txHex, 'hex'), coin.network);
      transaction.ins.forEach((input, index) => {
        if (inputScripts[index] === 'replayProtection') {
          assert(coin.isBitGoTaintedUnspent(unspents[index]));
          return;
        }

        const unspent = unspents[index] as WalletUnspent;
        const pubkeys = keychains.map((k) => deriveKey(k, unspent.chain, unspent.index).publicKey);

        pubkeys.forEach((pk, pkIndex) => {
          utxolib.bitgo
            .verifySignature(
              transaction,
              index,
              prevOutputs[index].value,
              {
                publicKey: pk,
              },
              prevOutputs
            )
            .should.eql(signedBy.includes(keychains[pkIndex]));
        });
      });
    }

    it('have valid signature for half-signed transaction', function () {
      testValidSignatures(transactionStages.halfSignedUserBackup, [keychains[0]]);
      testValidSignatures(transactionStages.halfSignedUserBitGo, [keychains[0]]);
    });

    it('have valid signatures for full-signed transaction', function () {
      if (!fullSign) {
        return this.skip();
      }
      assert(transactionStages.fullSignedUserBackup && transactionStages.fullSignedUserBitGo);
      testValidSignatures(transactionStages.fullSignedUserBackup, [keychains[0], keychains[1]]);
      testValidSignatures(transactionStages.fullSignedUserBitGo, [keychains[0], keychains[2]]);
    });

    it('have correct results for explainTransaction', function () {
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

        const explanation = coin.explainTransaction({
          txHex,
          txInfo: {
            unspents: getUnspents(),
          },
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
          stageName === 'prebuild'
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
      }
    });
  });
}

utxoCoins.forEach((coin) =>
  utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((type) => {
    if (coin.supportsAddressType(type)) {
      run(coin, [type, type]);

      if (getReplayProtectionAddresses(coin.network).length) {
        run(coin, ['replayProtection', type]);
      }
    }
  })
);
