/**
 * TransactionBuilder build and rebuild tests for Zama ERC-7984 decryption delegation.
 *
 * Pattern mirrors contractCall.ts: imports TransactionType from @bitgo/sdk-core and
 * TransactionBuilder from '../../../src'. These are subject to the same pre-existing
 * io-ts crash (sdk-core/src/bitgo/utils/tss/eddsa/typesEddsaMPCv2) that affects ALL
 * TransactionBuilder tests in this monorepo. They run in the full CI test suite.
 *
 * Three flows verified:
 *   Flow 1 — root wallet: ContractCall + multicall data → build → from(hex) → rebuild
 *   Flow 2 — explicit DecryptionDelegation type → build → from(hex) → rebuild
 *   Flow 3 — forwarder: ContractCall + callFromParent data → build → from(hex) → rebuild
 */
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import {
  buildMulticallDelegationCalldata,
  wrapInCallFromParent,
  aclMulticallMethodId,
  callFromParentMethodId,
} from '@bitgo/abstract-eth';
import { getBuilder } from '../getBuilder';

const ACL_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const TOKEN_ADDRESS_2 = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
const FORWARDER_ADDRESS = '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF';
const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

describe('DecryptionDelegation TransactionBuilder', () => {
  let txBuilder: TransactionBuilder;

  beforeEach(() => {
    txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
    txBuilder.counter(1);
  });

  // ---- Flow 1: root wallet, ContractCall type --------------------------------

  it('Flow 1: should build a ContractCall tx with multicall delegation data', async () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(ACL_ADDRESS);
    txBuilder.data(calldata);

    const tx = await txBuilder.build();
    const json = tx.toJson();

    should.equal(tx.type, TransactionType.ContractCall);
    json.to.should.equal(ACL_ADDRESS.toLowerCase());
    json.data.should.startWith(aclMulticallMethodId);
    json.value.should.equal('0');
  });

  it('Flow 1: should rebuild from hex — multicall delegation round-trip', async () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(ACL_ADDRESS);
    txBuilder.data(calldata);

    const originalTx = await txBuilder.build();
    const rawHex = originalTx.toBroadcastFormat();

    const rebuiltBuilder = getBuilder('hteth') as TransactionBuilder;
    rebuiltBuilder.from(rawHex);
    const rebuiltTx = await rebuiltBuilder.build();

    should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
    rebuiltTx.toJson().to.should.equal(ACL_ADDRESS.toLowerCase());
    rebuiltTx.toJson().data.should.startWith(aclMulticallMethodId);
  });

  // ---- Flow 2: explicit DecryptionDelegation type ---------------------------

  it('Flow 2: should build with explicit DecryptionDelegation type', async () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    txBuilder.type(TransactionType.DecryptionDelegation);
    txBuilder.contract(ACL_ADDRESS);
    txBuilder.data(calldata);

    const tx = await txBuilder.build();
    const json = tx.toJson();

    should.equal(tx.type, TransactionType.ContractCall);
    json.to.should.equal(ACL_ADDRESS.toLowerCase());
    json.data.should.startWith(aclMulticallMethodId);
    json.value.should.equal('0');
  });

  it('Flow 2: should rebuild from hex — DecryptionDelegation type round-trip', async () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    txBuilder.type(TransactionType.DecryptionDelegation);
    txBuilder.contract(ACL_ADDRESS);
    txBuilder.data(calldata);

    const originalTx = await txBuilder.build();
    const rawHex = originalTx.toBroadcastFormat();

    // classifyTransaction sees 0xac9650d8 → ContractCall (multicall not mapped)
    // ContractCall rebuild path handles it identically to DecryptionDelegation
    const rebuiltBuilder = getBuilder('hteth') as TransactionBuilder;
    rebuiltBuilder.from(rawHex);
    const rebuiltTx = await rebuiltBuilder.build();

    should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
  });

  // ---- Flow 3: forwarder callFromParent path --------------------------------

  it('Flow 3: should build a forwarder delegation tx targeting the forwarder', async () => {
    const innerCalldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    const outerCalldata = wrapInCallFromParent(ACL_ADDRESS, innerCalldata);

    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(FORWARDER_ADDRESS);
    txBuilder.data(outerCalldata);

    const tx = await txBuilder.build();
    const json = tx.toJson();

    should.equal(tx.type, TransactionType.ContractCall);
    json.to.should.equal(FORWARDER_ADDRESS.toLowerCase());
    json.data.should.startWith(callFromParentMethodId);
    json.value.should.equal('0');
  });

  it('Flow 3: should rebuild from hex — forwarder delegation round-trip', async () => {
    const innerCalldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    const outerCalldata = wrapInCallFromParent(ACL_ADDRESS, innerCalldata);

    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(FORWARDER_ADDRESS);
    txBuilder.data(outerCalldata);

    const originalTx = await txBuilder.build();
    const rawHex = originalTx.toBroadcastFormat();

    const rebuiltBuilder = getBuilder('hteth') as TransactionBuilder;
    rebuiltBuilder.from(rawHex);
    const rebuiltTx = await rebuiltBuilder.build();

    should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
    rebuiltTx.toJson().to.should.equal(FORWARDER_ADDRESS.toLowerCase());
    rebuiltTx.toJson().data.should.startWith(callFromParentMethodId);
  });

  // ---- Validation -----------------------------------------------------------

  it('should throw for DecryptionDelegation when contract address is missing', async () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    txBuilder.type(TransactionType.DecryptionDelegation);
    txBuilder.data(calldata);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });

  it('should throw for DecryptionDelegation when data field is missing', async () => {
    txBuilder.type(TransactionType.DecryptionDelegation);
    txBuilder.contract(ACL_ADDRESS);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract call data field');
  });

  it('should throw when data() is called before type is set to a contract call type', () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    should.throws(() => txBuilder.data(calldata), /data can only be set for contract call transaction types/);
  });
});
