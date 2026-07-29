/**
 * TransactionBuilder build and rebuild tests for DecryptionDelegation transaction type.
 *
 * Verifies three delegation flows end-to-end through build → serialize → deserialize:
 *   Flow 1 — root wallet multicall (outer selector 0xac9650d8 → ContractCall)
 *   Flow 2 — explicit DecryptionDelegation type set by caller
 *   Flow 3 — forwarder callFromParent (outer selector 0x77e60b35 → ContractCall)
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { TransactionBuilder } from '../../../src';
import {
  buildMulticallDelegationCalldata,
  wrapInCallFromParent,
  aclMulticallMethodId,
  callFromParentMethodId,
} from '../../../src/lib/zamaUtils';
import { classifyTransaction } from '../../../src/lib/utils';

const ACL_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const TOKEN_ADDRESS_2 = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
const FORWARDER_ADDRESS = '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF';
const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

export function runDecryptionDelegationTests(coinName: string, getBuilder: (coin: string) => TransactionBuilder): void {
  describe(`${coinName} transaction builder — DecryptionDelegation flows`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    // -------------------------------------------------------------------------
    // classifyTransaction — verify selector → type mapping
    // -------------------------------------------------------------------------
    describe('classifyTransaction', () => {
      it('multicall selector (0xac9650d8) should classify as ContractCall', () => {
        const result = classifyTransaction(aclMulticallMethodId + '00'.repeat(28));
        should.equal(result, TransactionType.ContractCall);
      });

      it('callFromParent selector (0x77e60b35) should classify as ContractCall', () => {
        const result = classifyTransaction(callFromParentMethodId + '00'.repeat(28));
        should.equal(result, TransactionType.ContractCall);
      });

      it('delegateForUserDecryption selector (0x04f61a95) should classify as DecryptionDelegation', () => {
        const result = classifyTransaction('0x04f61a95' + '00'.repeat(28));
        should.equal(result, TransactionType.DecryptionDelegation);
      });

      it('unknown selector should classify as ContractCall (fallback)', () => {
        const result = classifyTransaction('0xdeadbeef' + '00'.repeat(28));
        should.equal(result, TransactionType.ContractCall);
      });
    });

    // -------------------------------------------------------------------------
    // Flow 1 — root wallet multicall (outer selector = multicall → ContractCall)
    // -------------------------------------------------------------------------
    describe('Flow 1: root wallet multicall delegation (ContractCall type)', () => {
      it('should build a tx with multicall delegation data', async () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.contract(ACL_ADDRESS);
        txBuilder.data(calldata);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.ContractCall);
        json.to.should.equal(ACL_ADDRESS);
        json.data.should.startWith(aclMulticallMethodId);
        json.value.should.equal('0');
      });

      it('should serialize and deserialize correctly (rebuild from hex)', async () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.contract(ACL_ADDRESS);
        txBuilder.data(calldata);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
      });
    });

    // -------------------------------------------------------------------------
    // Flow 2 — explicit DecryptionDelegation type (WP sets this for TSS path)
    // -------------------------------------------------------------------------
    describe('Flow 2: explicit DecryptionDelegation type', () => {
      it('should build a DecryptionDelegation tx', async () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        txBuilder.type(TransactionType.DecryptionDelegation);
        txBuilder.contract(ACL_ADDRESS);
        txBuilder.data(calldata);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.DecryptionDelegation);
        json.to.should.equal(ACL_ADDRESS);
        json.data.should.startWith(aclMulticallMethodId);
      });

      it('should serialize and deserialize correctly (rebuild from hex)', async () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        txBuilder.type(TransactionType.DecryptionDelegation);
        txBuilder.contract(ACL_ADDRESS);
        txBuilder.data(calldata);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        // from() classifies via outer selector (multicall → ContractCall) and rebuilds correctly
        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
      });
    });

    // -------------------------------------------------------------------------
    // Flow 3 — forwarder callFromParent (outer selector = callFromParent → ContractCall)
    // -------------------------------------------------------------------------
    describe('Flow 3: forwarder callFromParent delegation (ContractCall type)', () => {
      it('should build a tx targeting the forwarder with callFromParent data', async () => {
        const innerCalldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        const outerCalldata = wrapInCallFromParent(ACL_ADDRESS, innerCalldata);

        txBuilder.type(TransactionType.ContractCall);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.data(outerCalldata);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.ContractCall);
        // outer tx targets the forwarder, not the ACL
        json.to.should.equal(FORWARDER_ADDRESS);
        json.data.should.startWith(callFromParentMethodId);
      });

      it('should serialize and deserialize correctly (rebuild from hex)', async () => {
        const innerCalldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        const outerCalldata = wrapInCallFromParent(ACL_ADDRESS, innerCalldata);

        txBuilder.type(TransactionType.ContractCall);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.data(outerCalldata);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
      });
    });

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    describe('validation', () => {
      it('should throw if contract address is missing for DecryptionDelegation', async () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        txBuilder.type(TransactionType.DecryptionDelegation);
        txBuilder.data(calldata);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
      });

      it('should throw if data is missing for DecryptionDelegation', async () => {
        txBuilder.type(TransactionType.DecryptionDelegation);
        txBuilder.contract(ACL_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract call data field');
      });
    });
  });
}
