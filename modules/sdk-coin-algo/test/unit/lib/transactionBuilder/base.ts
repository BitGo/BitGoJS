import crypto from 'crypto';
import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import algosdk from 'algosdk';
import assert from 'assert';
import should from 'should';
import sinon, { assert as SinonAssert } from 'sinon';
import {
  AddressValidationError,
  InsufficientFeeError,
  KeyPair,
  TransactionBuilder,
  algoUtils,
} from '../../../../src/lib';
import { Transaction } from '../../../../src/lib/transaction';

import * as AlgoResources from '../../../fixtures/resources';
import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { EncodedTx } from '../../../../src/lib/ifaces';

const STANDARD_REQUIRED_NUMBER_OF_SIGNERS = 2;

class StubTransactionBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  getFee(): number {
    return this._fee;
  }

  getSender(): string {
    return this._sender;
  }

  getGenesisHash(): string {
    return this._genesisHash;
  }

  getGenesisId(): string {
    return this._genesisId;
  }

  getFirstRound(): number {
    return this._firstRound;
  }

  getLastRound(): number {
    return this._lastRound;
  }

  getLease(): Uint8Array | undefined {
    return this._lease;
  }

  getNote(): Uint8Array | undefined {
    return this._note;
  }

  getReKeyTo(): string | undefined {
    return this._reKeyTo;
  }

  getKeyPairs(): KeyPair[] {
    return this._keyPairs;
  }

  getTransaction(): Transaction {
    return this._transaction;
  }

  buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  getSuggestedParams(): algosdk.SuggestedParams {
    return this.suggestedParams;
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    throw new Error('Method not implemented.');
  }
  protected get transactionType(): TransactionType {
    throw new Error('Method not implemented.');
  }
}

describe('Algo Transaction Builder', () => {
  let txnBuilder: StubTransactionBuilder;
  const {
    accounts: { account1, account2, account3 },
    networks: { testnet },
  } = AlgoResources;

  beforeEach(() => {
    const config = coins.get('algo');
    txnBuilder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate fee is not lt 1000 microalgos if flat fee is set to true', () => {
      txnBuilder.isFlatFee(true);

      assert.throws(
        () => txnBuilder.fee({ fee: '999' }),
        (e: Error) => e.name === InsufficientFeeError.name
      );
      should.doesNotThrow(() => txnBuilder.fee({ fee: '1000' }));
    });

    it('should validate sender address is a valid algo address', () => {
      const spy = sinon.spy(txnBuilder, 'validateAddress');
      assert.throws(
        () => txnBuilder.sender({ address: 'asdf' }),
        (e: Error) => e.name === AddressValidationError.name
      );
      should.doesNotThrow(() => txnBuilder.sender({ address: account1.address }));
      SinonAssert.calledTwice(spy);
    });

    it('should validate number of signers is not less than 0', () => {
      assert.throws(() => txnBuilder.numberOfRequiredSigners(-1), /Number of signers: '-1' cannot be negative/);

      for (let i = 0; i < STANDARD_REQUIRED_NUMBER_OF_SIGNERS; i++) {
        should.doesNotThrow(() => txnBuilder.numberOfRequiredSigners(i));
      }
    });
  });

  describe('suggested params verification', () => {
    it('should retrieve the suggested parameters as they have been set', () => {
      const isFlatFee = true;
      const fee = 1000;
      const firstRound = 1;
      const lastRound = 10;
      const genesisId = 'testnet-v1.0';
      const genesisHash = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

      txnBuilder
        .isFlatFee(isFlatFee)
        .fee({ fee: fee.toString() })
        .firstRound(firstRound)
        .lastRound(lastRound)
        .genesisId(genesisId)
        .genesisHash(genesisHash);

      const suggestedParams = txnBuilder.getSuggestedParams();
      should.equal(isFlatFee, suggestedParams.flatFee);
      should.equal(fee, suggestedParams.fee);
      should.equal(firstRound, suggestedParams.firstRound);
      should.equal(lastRound, suggestedParams.lastRound);
      should.equal(genesisId, suggestedParams.genesisID);
      should.equal(genesisHash, suggestedParams.genesisHash);
    });
  });

  describe('private key validation', () => {
    it('validates byte arrays', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey }));
    });

    it('validates hex encoded strings', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey.toString('hex') }));
    });

    it('validates base64 encoded strings', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey.toString('base64') }));
    });
  });

  describe('implementation functions', () => {
    const to = account1.address;
    const from = account2.address;
    const reKeyTo = account3.address;
    const amount = 1000;
    const firstRound = 1;
    const lastRound = 10;
    const closeRemainderTo = account3.address;

    // Uint8array conversion required because algosdk checks if the constructor
    // is Uint8Array.
    const lease = new Uint8Array(crypto.randomBytes(32));
    const note = new Uint8Array(Buffer.from('note', 'utf-8'));

    const fee = 1000;

    const algoTxn = algosdk.makePaymentTxnWithSuggestedParams(
      from,
      to,
      amount,
      closeRemainderTo,
      note,
      {
        fee,
        flatFee: true,
        firstRound,
        lastRound,
        genesisID: testnet.genesisID,
        genesisHash: testnet.genesisHash,
      },
      reKeyTo
    );
    algoTxn.fee = fee;
    algoTxn.flatFee = true;
    algoTxn.addLease(lease);

    it('should assign all decoded fields into transaction builder', () => {
      txnBuilder.fromImplementation(algosdk.encodeUnsignedTransaction(algoTxn));

      should(txnBuilder.getFee()).equal(fee);
      should(txnBuilder.getSender()).equal(from);
      should(txnBuilder.getGenesisHash()).equal(testnet.genesisHash);
      should(txnBuilder.getGenesisId()).equal(testnet.genesisID);
      should(txnBuilder.getFirstRound()).equal(firstRound);
      should(txnBuilder.getLastRound()).equal(lastRound);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      should(Buffer.from(txnBuilder.getLease()!).toString('hex')).equal(Buffer.from(lease).toString('hex'));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      should(Buffer.from(txnBuilder.getNote()!).toString('hex')).equal(Buffer.from(note).toString('hex'));
      should(txnBuilder.getReKeyTo()).equal(reKeyTo);

      should(txnBuilder.getTransaction().getAlgoTransaction()).not.be.undefined();
    });

    it('should assign signers into transaction builder', () => {
      sinon.stub(algoUtils, 'decodeAlgoTxn').callsFake((txnBytes: Uint8Array | string): EncodedTx => {
        return {
          rawTransaction: Buffer.from([]),
          signed: true,
          signers: [
            '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
            '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
          ],
          txn: algoTxn,
        };
      });
      txnBuilder.fromImplementation(algosdk.encodeUnsignedTransaction(algoTxn));
      should(txnBuilder.getTransaction().signers).deepEqual([
        '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
        '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
      ]);
      sinon.restore();
    });

    it('transaction builder should fail when signers are incorrect', () => {
      sinon.stub(algoUtils, 'decodeAlgoTxn').callsFake((txnBytes: Uint8Array | string): EncodedTx => {
        return {
          rawTransaction: Buffer.from([]),
          signed: true,
          signers: [
            '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5AAA',
            '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
          ],
          txn: algoTxn,
        };
      });
      should(() => txnBuilder.fromImplementation(algosdk.encodeUnsignedTransaction(algoTxn))).throw(
        "The address '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5AAA' is not a well-formed algorand address"
      );
      sinon.restore();
    });

    it('should not sign the transaction', () => {
      const txn = txnBuilder.getTransaction();
      txn.setAlgoTransaction(algoTxn);
      txn.setNumberOfRequiredSigners(1);

      assert.throws(
        () => txnBuilder.signImplementation({ key: Buffer.from(account1.prvKey).toString('hex') }),
        new RegExp('Invalid base32 characters')
      );
    });

    it('should sign the transaction', () => {
      const { prv, pub } = new KeyPair().recordKeysFromPrivateKeyInProtocolFormat(account1.prvKey);
      const prvKey = algoUtils.encodeSeed(Buffer.from(prv + pub));
      const txn = txnBuilder.getTransaction();
      txn.setAlgoTransaction(algoTxn);
      txn.setNumberOfRequiredSigners(1);

      should.doesNotThrow(() => txnBuilder.signImplementation({ key: prvKey }));
    });
  });

  describe('transaction validation', () => {
    it('should validate a normal transaction', () => {
      txnBuilder
        .fee({ fee: '1000' })
        .isFlatFee(true)
        .firstRound(1)
        .lastRound(10)
        .sender({ address: account1.address })
        .genesisId(testnet.genesisID)
        .genesisHash(testnet.genesisHash);

      should.doesNotThrow(() => txnBuilder.validateTransaction(txnBuilder.getTransaction()));
    });

    it('should validate last round is after first round', () => {
      txnBuilder
        .fee({ fee: '1000' })
        .isFlatFee(true)
        .firstRound(10)
        .lastRound(1)
        .sender({ address: account1.address })
        .genesisId(testnet.genesisID)
        .genesisHash(testnet.genesisHash);

      assert.throws(
        () => txnBuilder.validateTransaction(txnBuilder.getTransaction()),
        new RegExp(
          'Transaction validation failed: "value" failed custom validation because lastRound cannot be greater than or equal to firstRound'
        )
      );
    });

    it('should build a normal transaction with correct signers', () => {
      txnBuilder
        .fee({ fee: '1000' })
        .isFlatFee(true)
        .firstRound(1)
        .lastRound(10)
        .sender({ address: account1.address })
        .setSigners([
          '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
          '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
        ])
        .genesisId(testnet.genesisID)
        .genesisHash(testnet.genesisHash);
      should(txnBuilder.getTransaction().signers).deepEqual([
        '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
        '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
      ]);
    });

    it('should not build a normal transaction with incorrect signers', () => {
      should(() =>
        txnBuilder
          .fee({ fee: '1000' })
          .isFlatFee(true)
          .firstRound(1)
          .lastRound(10)
          .sender({ address: account1.address })
          .setSigners([
            '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5AAA',
            '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
          ])
          .genesisId(testnet.genesisID)
          .genesisHash(testnet.genesisHash)
      ).throw(
        "The address '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5AAA' is not a well-formed algorand address"
      );
    });
  });
});
