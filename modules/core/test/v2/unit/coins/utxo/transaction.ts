/**
 * @prettier
 */
import * as _ from 'lodash';
import * as assert from 'assert';
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import { Codes } from '@bitgo/unspents';

import { AbstractUtxoCoin } from '../../../../../src/v2/coins';
import { Unspent, WalletUnspent } from '../../../../../src/v2/coins/abstractUtxoCoin';
import { getReplayProtectionAddresses } from '../../../../../src/v2/coins/utxo/replayProtection';

import {
  utxoCoins,
  keychains,
  shouldEqualJSON,
  getFixture,
  getUtxoWallet,
  mockUnspent,
  mockUnspentReplayProtection,
  InputScriptType,
  TransactionObj,
  transactionToObj,
  transactionHexToObj,
  deriveKey,
} from './util';

import {
  FullySignedTransaction,
  HalfSignedUtxoTransaction,
  Keychain,
  WalletSignTransactionOptions,
} from '../../../../../src';

function run(coin: AbstractUtxoCoin, inputScripts: InputScriptType[]) {
  describe(`Transaction Stages ${coin.getChain()} scripts=${inputScripts.join(',')}`, function () {
    const wallet = getUtxoWallet(coin);
    const value = 1e8;
    const fullSign = !inputScripts.some((s) => s === 'replayProtection');

    function getUnspent(scriptType: InputScriptType, index: number): Unspent {
      if (scriptType === 'replayProtection') {
        return mockUnspentReplayProtection(coin.network);
      } else {
        const chain = Codes.forType(scriptType as any).internal;
        return mockUnspent(coin.network, { chain, value, index }, keychains);
      }
    }

    function getUnspents(): Unspent[] {
      return inputScripts.map((type, i) => getUnspent(type, i));
    }

    function getSignParams(
      prebuildHex: string,
      privateKey: bip32.BIP32Interface,
      cosigner: bip32.BIP32Interface
    ): WalletSignTransactionOptions {
      const txInfo = {
        unspents: getUnspents(),
      };
      const [userKeychain, backupKeychain, bitgoKeychain] = keychains.map((k) => ({
        pub: k.neutered().toBase58(),
      })) as Keychain[];

      const taprootRedeemIndex = cosigner === keychains[1] ? 1 : cosigner === keychains[2] ? 0 : undefined;

      if (taprootRedeemIndex === undefined) {
        throw new Error(`could not determine taprootRedeemIndex`);
      }

      return {
        txPrebuild: {
          txHex: prebuildHex,
          txInfo,
        },
        prv: privateKey.toBase58(),
        userKeychain,
        backupKeychain,
        bitgoKeychain,
        taprootRedeemIndex,
      };
    }

    function createPrebuildTransaction(): utxolib.bitgo.UtxoTransaction {
      const unspents = getUnspents();
      const txb = utxolib.bitgo.createTransactionBuilderForNetwork(coin.network);
      unspents.forEach((u) => {
        const [txid, vin] = u.id.split(':');
        txb.addInput(txid, Number(vin));
      });
      const unspentSum = Math.round(unspents.reduce((sum, u) => sum + u.value, 0));
      const output = coin.generateAddress({ keychains: keychains.map((k) => ({ pub: k.neutered().toBase58() })) });
      txb.addOutput(output.address, unspentSum - 1000);
      return txb.buildIncomplete();
    }

    function createHalfSignedTransaction(
      prebuild: utxolib.bitgo.UtxoTransaction,
      cosigner: bip32.BIP32Interface
    ): Promise<HalfSignedUtxoTransaction> {
      // half-sign with the user key
      return wallet.signTransaction(
        getSignParams(prebuild.toBuffer().toString('hex'), keychains[0], cosigner)
      ) as Promise<HalfSignedUtxoTransaction>;
    }

    async function createFullSignedTransaction(
      halfSigned: HalfSignedUtxoTransaction,
      privateKey: bip32.BIP32Interface
    ): Promise<FullySignedTransaction> {
      return (await wallet.signTransaction({
        ...getSignParams(halfSigned.txHex, privateKey, privateKey),
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
      const prebuild = createPrebuildTransaction();
      const halfSignedUserBackup = await createHalfSignedTransaction(prebuild, keychains[1]);
      const halfSignedUserBitGo = await createHalfSignedTransaction(prebuild, keychains[2]);
      const fullSignedUserBackup = fullSign
        ? await createFullSignedTransaction(halfSignedUserBackup, keychains[1])
        : undefined;
      const fullSignedUserBitGo = fullSign
        ? await createFullSignedTransaction(halfSignedUserBitGo, keychains[2])
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

        const explanation = await coin.explainTransaction({
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

        if (inputScripts.some((t) => t === 'p2tr')) {
          // FIXME(BG-38946): explainTransaction does not work for p2tr yet
          return;
        }

        switch (coin.getChain()) {
          case 'bch':
          case 'tbch':
          case 'bsv':
          case 'tbsv':
          case 'btg':
          case 'zec':
          case 'tzec':
            // FIXME(BG-38946): explainTransaction signature check not implemented correctly
            if (inputScripts.some((s) => s === 'p2sh')) {
              return;
            }
        }

        const expectedSignatureCount =
          stageName === 'prebuild'
            ? 0
            : stageName.startsWith('halfSigned')
            ? 1
            : stageName.startsWith('fullSigned')
            ? 2
            : undefined;

        explanation.inputSignatures.should.eql(inputScripts.map(() => expectedSignatureCount));
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
