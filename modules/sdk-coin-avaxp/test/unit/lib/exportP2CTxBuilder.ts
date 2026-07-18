import assert from 'assert';
import 'should';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('AvaxP Export P2C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e: any) => e.message === errorMessage.ERROR_AMOUNT
      );
    });
    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID));
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_LENGTH
      );
    });

    it('should fail target chain id not a vaild base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_NOT_BASE58
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e: any) => e.message === errorMessage.ERROR_CHAIN_ID_INVALID_CHECKSUM
      );
    });

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  signFlowTest({
    transactionType: 'Export P2C with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C.threshold)
        .locktime(testData.EXPORT_P_2_C.locktime)
        .fromPubKey(testData.EXPORT_P_2_C.pAddresses)
        .amount(testData.EXPORT_P_2_C.amount)
        .externalChainId(testData.EXPORT_P_2_C.targetChainId)
        .utxos(testData.EXPORT_P_2_C.outputs),
    unsignedTxHex: testData.EXPORT_P_2_C.unsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C.halfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C.fullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C.privKey.prv1,
      prv2: testData.EXPORT_P_2_C.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C recovery with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C.threshold)
        .locktime(testData.EXPORT_P_2_C.locktime)
        .fromPubKey(testData.EXPORT_P_2_C.pAddresses)
        .amount(testData.EXPORT_P_2_C.amount)
        .externalChainId(testData.EXPORT_P_2_C.targetChainId)
        .utxos(testData.EXPORT_P_2_C.outputs)
        .recoverMode(),
    unsignedTxHex: testData.EXPORT_P_2_C.rUnsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C.rHalfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C.rFullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C.privKey.prv3,
      prv2: testData.EXPORT_P_2_C.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C without changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.threshold)
        .locktime(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.locktime)
        .fromPubKey(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.pAddresses)
        .amount(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.amount)
        .externalChainId(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.targetChainId)
        .utxos(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.outputs),
    unsignedTxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.unsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.halfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.fullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv1,
      prv2: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv2,
    },
  });

  signFlowTest({
    transactionType: 'Export P2C recovery without changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tavaxp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tavaxp'))
        .getExportBuilder()
        .threshold(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.threshold)
        .locktime(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.locktime)
        .fromPubKey(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.pAddresses)
        .amount(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.amount)
        .externalChainId(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.targetChainId)
        .utxos(testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.outputs)
        .recoverMode(),
    unsignedTxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rUnsignedTxHex,
    halfsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rHalfsigntxHex,
    fullsigntxHex: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.rFullsigntxHex,
    privKey: {
      prv1: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv3,
      prv2: testData.EXPORT_P_2_C_WITHOUT_CHANGEOUTPUT.privKey.prv2,
    },
  });

  describe('Credential guard bypass regression (CECHO-1697)', () => {
    // Regression for production incident 2026-07-16:
    // tx 8xbiLpsKDKkJrN3YUqcZpFcxApLCwmQkpKUuvmHU1GL9RmAyu was broadcast
    // with sig[1] still an address placeholder (r=0) because hasCredentials([])
    // returned false, causing buildAvaxTransaction() to wipe Signer 1's ECDSA.
    const data = testData.EXPORT_P_2_C;

    it('hasCredentials returns true for credentials=[] preventing credential wipe', async () => {
      // Signer 1 half-signs
      const signer1Builder = factory.from(data.unsignedTxHex);
      signer1Builder.sign({ key: data.privKey.prv1 });
      const halfSignedTx = await signer1Builder.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();

      // Simulate the bug trigger: credentials=[] on the parsed tx
      const signer2Builder = factory.from(halfSignedHex) as any;
      const internalTx = signer2Builder.transaction;

      // Force credentials to [] as happens in production deserialization edge case
      (internalTx._avaxTransaction as any).credentials = [];

      // Before fix: hasCredentials was false → buildAvaxTransaction() would regenerate
      // After fix: hasCredentials is true → guard fires → credentials preserved
      internalTx.hasCredentials.should.be.true(
        'hasCredentials must return true for credentials=[] to block credential regeneration'
      );
    });

    it('credential regeneration is blocked when credentials=[] preventing Signer 1 ECDSA wipe', async () => {
      // Signer 1 half-signs
      const signer1Builder = factory.from(data.unsignedTxHex);
      signer1Builder.sign({ key: data.privKey.prv1 });
      const halfSignedTx = await signer1Builder.build();
      const halfSignedHex = halfSignedTx.toBroadcastFormat();

      // Simulate bug: force credentials=[] before Signer 2 calls build()
      const signer2Builder = factory.from(halfSignedHex) as any;
      const internalTx = signer2Builder.transaction;
      (internalTx._avaxTransaction as any).credentials = [];

      // build() must NOT regenerate fresh placeholder credentials
      const rebuilt = await signer2Builder.build();
      const rebuiltCreds = (rebuilt as any).credentials;

      // After fix: credentials stay as [] (guard fired, no regeneration)
      // Before fix: credentials would be regenerated to N×[PLACEHOLDER, PLACEHOLDER]
      rebuiltCreds.length.should.equal(
        0,
        'build() must not regenerate credentials when credentials=[] — guard must fire'
      );
    });

    it('signature getter exposes incomplete signing across all credentials', async () => {
      // Signer 1 half-signs only
      const signer1Builder = factory.from(data.unsignedTxHex);
      signer1Builder.sign({ key: data.privKey.prv1 });
      const halfSignedTx = await signer1Builder.build();

      // After Signer 1: signature getter must show exactly 1 real ECDSA
      halfSignedTx.signature.length.should.equal(
        1,
        'should expose exactly 1 real ECDSA after first signer — Signer 2 slot is still empty'
      );

      // Simulate the corrupt state the PR targets: fully sign the tx, then corrupt
      // one credential so that credentials[0] has both ECDSAs but credentials[1]
      // only has one.  A union would still return 2 (masking the corruption).
      // The intersection must return 1 because the second signer's ECDSA is absent
      // from credentials[1].
      const fullBuilder = factory.from(data.halfsigntxHex);
      fullBuilder.sign({ key: data.privKey.prv2 });
      const fullTx = await fullBuilder.build();
      fullTx.signature.length.should.equal(2, 'sanity: fully signed tx should have 2 signatures');

      // 90 hex chars of leading zeros is the empty-signature prefix used by isEmptySignature().
      const EMPTY_SIG_ZERO_PREFIX = ''.padStart(90, '0');

      // Corrupt credentials[1]: zero out Signer 2's slot so the intersection drops to 1.
      // Use assertions instead of guards so the test fails loudly if the tx shape changes.
      const creds = (fullTx as any).credentials;
      assert.ok(creds && creds.length >= 2, 'fully signed tx must have at least 2 credentials');
      const cred1: any = creds[1];
      const cs1: any = cred1.serialize();
      const targetIdx = cs1.sigArray.findIndex(
        (s: any, i: number) => i > 0 && !s.bytes.startsWith(EMPTY_SIG_ZERO_PREFIX)
      );
      assert.ok(targetIdx !== -1, 'credentials[1] must have a non-empty slot beyond index 0 (Signer 2 slot)');
      cs1.sigArray[targetIdx].bytes = ''.padStart(cs1.sigArray[targetIdx].bytes.length, '0');
      cred1.deserialize(cs1);

      // With intersection, removing ECDSA2 from credentials[1] must reduce the count to 1.
      fullTx.signature.length.should.equal(
        1,
        'intersection must detect that credentials[1] is missing ECDSA2 — incomplete signing visible'
      );
    });

    it('full sign from half-signed hex produces 2 real ECDSAs and correct tx', async () => {
      // This is the exact flow that MUST work in production after the fix:
      // Signer 2 takes Signer 1's half-signed hex and fills the remaining slot.
      const txBuilder = factory.from(data.halfsigntxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      const tx = await txBuilder.build();
      tx.toBroadcastFormat().should.equal(data.fullsigntxHex);
      tx.signature.length.should.equal(2, 'both HSM signer slots must be filled with real ECDSAs');
    });

    it('sign() throws on empty credentials rather than silently producing bad tx', async () => {
      // Signer 1 half-signs
      const signer1Builder = factory.from(data.unsignedTxHex);
      signer1Builder.sign({ key: data.privKey.prv1 });
      const halfTx = await signer1Builder.build();

      // Simulate bug: credentials wiped to [] before Signer 2 signs
      const signer2Builder = factory.from(halfTx.toBroadcastFormat()) as any;
      signer2Builder.sign({ key: data.privKey.prv2 });
      (signer2Builder.transaction._avaxTransaction as any).credentials = [];

      // build() calls transaction.sign() which must throw — not silently produce a bad tx
      await signer2Builder
        .build()
        .then(() => assert.fail('Expected sign to throw on empty credentials'))
        .catch((e: any) => {
          e.message.should.equal('empty credentials to sign');
        });
    });

    it('toBroadcastFormat() throws when real ECDSA coexists with address placeholder (production failure shape)', async () => {
      // Reproduce the exact credential layout from the Jul 16 production failure:
      // slot[0] = real ECDSA (Signer 2 filled wrong slot due to MODE 1 mismatch)
      // slot[1] = ADDR_PLACEHOLDER (r=0, 90 zero hex chars + HSM1 address)
      // This is the shape that AvalancheGo rejected with "failed verifySpend: invalid signature".
      const EMPTY_SIG_ZERO_PREFIX = ''.padStart(90, '0');
      const signer1Builder = factory.from(data.unsignedTxHex);
      signer1Builder.sign({ key: data.privKey.prv1 });
      const halfTx = await signer1Builder.build();
      const fullBuilder = factory.from(halfTx.toBroadcastFormat());
      fullBuilder.sign({ key: data.privKey.prv2 });
      const fullTx = (await fullBuilder.build()) as any;

      // Corrupt credentials: swap slot[0] (realECDSA1) with an addr placeholder,
      // leaving slot[1] = realECDSA2. This mimics the bug output where a real ECDSA
      // coexists with an addr placeholder in the same credential.
      const creds = fullTx.credentials;
      if (creds && creds.length > 0) {
        const cred0: any = creds[0];
        const cs: any = cred0.serialize();
        // Build a fake addr placeholder: 90 zeros + 40 hex chars of a mock address
        const fakeAddrPlaceholder = EMPTY_SIG_ZERO_PREFIX + 'df32717bd7b7a2d50a715202795940250c7ba9e4';
        cs.sigArray[0].bytes = fakeAddrPlaceholder;
        cred0.deserialize(cs);
      }

      assert.throws(
        () => fullTx.toBroadcastFormat(),
        (e: any) =>
          e.message ===
          'transaction has a real ECDSA alongside an address placeholder (r=0): incomplete signing detected, refusing broadcast'
      );
    });
  });

  describe('Key cannot sign the transaction ', () => {
    const data = testData.EXPORT_P_2_C;
    it('Should full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.unsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv2 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a export tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(data.rUnsignedTxHex);
      txBuilder.sign({ key: data.privKey.prv1 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
