/**
 * Standalone calldata tests for Zama ERC-7984 decryption delegation.
 *
 * Zama helpers are imported from the @bitgo/abstract-eth public package entry (re-exports
 * ./lib including zamaUtils). TransactionType is imported from the sdk-core enum dist path
 * to avoid loading the full @bitgo/sdk-core barrel (pre-existing io-ts issue in the TSS graph).
 *
 * TransactionBuilder build/rebuild tests live in decryptionDelegationTxBuilder.ts.
 */
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import {
  buildMulticallDelegationCalldata,
  callFromParentMethodId,
  aclMulticallMethodId,
  wrapInCallFromParent,
} from '@bitgo/abstract-eth';

const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const TOKEN_ADDRESS_2 = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
const ACL_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

describe('DecryptionDelegation TransactionType (standalone)', () => {
  it('should be a valid numeric type distinct from ContractCall/Send/FlushTokens', () => {
    should.exist(TransactionType.DecryptionDelegation);
    (typeof TransactionType.DecryptionDelegation).should.equal('number');
    TransactionType.DecryptionDelegation.should.not.equal(TransactionType.ContractCall);
    TransactionType.DecryptionDelegation.should.not.equal(TransactionType.Send);
    TransactionType.DecryptionDelegation.should.not.equal(TransactionType.FlushTokens);
    TransactionType.DecryptionDelegation.should.not.equal(TransactionType.FlushERC721);
    TransactionType.DecryptionDelegation.should.not.equal(TransactionType.FlushERC1155);
  });
});

describe('DecryptionDelegation calldata selectors (standalone)', () => {
  it('single-token calldata uses multicall selector 0xac9650d8', () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    calldata.slice(0, 10).should.equal(aclMulticallMethodId);
    calldata.slice(0, 10).should.equal('0xac9650d8');
  });

  it('multi-token calldata uses multicall selector 0xac9650d8', () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
    calldata.slice(0, 10).should.equal(aclMulticallMethodId);
  });

  it('forwarder-wrapped calldata uses callFromParent selector 0x77e60b35', () => {
    const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
    wrapped.slice(0, 10).should.equal(callFromParentMethodId);
    wrapped.slice(0, 10).should.equal('0x77e60b35');
  });

  it('delegate address is ABI-encoded in calldata', () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    calldata.should.containEql(DELEGATE_ADDRESS.slice(2).toLowerCase().padStart(64, '0'));
  });

  it('token address is ABI-encoded in calldata', () => {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
    calldata.should.containEql(TOKEN_ADDRESS.slice(2).toLowerCase().padStart(64, '0'));
  });
});
