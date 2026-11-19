/**
 * Unit tests for Erc7984Token.
 *
 * Covers:
 *   - getTokenEnablementConfig
 *   - verifyTransaction (TSS and multisig paths)
 *   - verifyTransaction (confidential transfer / SendERC7984 path)
 *   - decodeTokenAddressesFromDelegationCalldata (round-trip and forwarder-wrapped)
 *   - recover() (ERC-7984 confidential token recovery)
 *   - queryConfidentialBalance()
 */
import should from 'should';
import sinon from 'sinon';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { RecoveryKeyMismatchError, TransactionType, Wallet } from '@bitgo/sdk-core';
import { EthereumNetwork } from '@bitgo/statics';
import {
  buildMulticallDelegationCalldata,
  buildDelegationCalldata,
  buildConfidentialTransferByHandleCalldata,
  buildFlushERC7984ForwarderTokenCalldata,
  buildWrapCalldata,
  buildUnwrapCalldata,
  buildFinalizeUnwrapCalldata,
  sendMultiSigData,
  wrapInCallFromParent,
  decodeTokenAddressesFromDelegationCalldata,
  decodeDelegationCallsFromCalldata,
  TransferBuilderERC7984,
  confidentialTransferNoProofMethodId,
  approveMethodId,
} from '@bitgo/abstract-eth';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';
import { ethers } from 'ethers';
import { Erc7984Token } from '../../src/erc7984Token';
import { TransactionBuilder } from '../../src/lib';
import { getBuilder } from './getBuilder';
import { register } from '../../src/register';
import * as testData from '../resources/eth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Hoodi ACL contract address (Networks.test.hoodi.zamaAclContractAddress)
const ZAMA_ACL_ADDRESS = '0x6d3faf6f86e1ff9f3b0831dda920aba1cbd5bd68';
const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';

// hteth:ctest1 token contract address (from statics/erc7984Tokens.ts)
const CTEST1_TOKEN_ADDRESS = '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1';
// hteth:cusdt token contract address (from statics/erc7984Tokens.ts)
const CUSDT_TOKEN_ADDRESS = '0x2debbe0487ef921df4457f9e36ed05be2df1ac75';

const WRONG_TOKEN_ADDRESS = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const WRONG_ACL_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const FORWARDER_ADDRESS = '0x1234567890123456789012345678901234567890';

// Hostile addresses for CECHO-2720 negative tests
const ATTACKER_DELEGATE_ADDRESS = '0x2222222222222222222222222222222222222222';
const ATTACKER_CONTRACT_ADDRESS = '0x3333333333333333333333333333333333333333';

const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a root-wallet delegation tx hex (to = ACL, data = multicall).
 */
async function buildDelegationTxHex(
  aclAddress: string,
  tokenAddresses: string[],
  value = '0',
  delegateAddress = DELEGATE_ADDRESS
): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(aclAddress);
  const calldata = buildMulticallDelegationCalldata(delegateAddress, tokenAddresses, EXPIRY);
  txBuilder.data(calldata);
  if (value !== '0') {
    txBuilder.value(value);
  }
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

/**
 * Builds a forwarder delegation tx hex (to = forwarder, data = callFromParent(ACL, 0, multicall)).
 * This mirrors what DecryptionDelegationBuilder.build() returns when forwarderAddress is set.
 */
async function buildForwarderDelegationTxHex(
  forwarderAddress: string,
  aclAddress: string,
  tokenAddresses: string[],
  delegateAddress = DELEGATE_ADDRESS
): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(forwarderAddress);
  const innerCalldata = buildMulticallDelegationCalldata(delegateAddress, tokenAddresses, EXPIRY);
  const outerCalldata = wrapInCallFromParent(aclAddress, innerCalldata);
  txBuilder.data(outerCalldata);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

/**
 * Encodes ACL.multicall(bytes[]) from raw inner call hex strings.
 * Used to build hostile calldata (e.g. mixed inner selectors) for CECHO-2720 negative tests.
 */
function encodeRawMulticall(innerCallsHex: string[]): string {
  const method = EthereumAbi.methodID('multicall', ['bytes[]']);
  const args = Buffer.from(new ethers.utils.AbiCoder().encode(['bytes[]'], [innerCallsHex]).slice(2), 'hex');
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Encodes ForwarderV4.callFromParent(target, value, data) with an arbitrary native value —
 * unlike wrapInCallFromParent, which hardcodes value 0.
 */
function encodeRawCallFromParent(targetAddress: string, value: string | number, calldata: string): string {
  const method = EthereumAbi.methodID('callFromParent', ['address', 'uint256', 'bytes']);
  const args = EthereumAbi.rawEncode(
    ['address', 'uint256', 'bytes'],
    [targetAddress, value, Buffer.from(calldata.slice(2), 'hex')]
  );
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Builds a ContractCall tx with arbitrary calldata — the hostile-prebuild primitive
 * for CECHO-2720 tests (attacker-controlled prebuild simulations).
 */
async function buildRawContractCallTxHex(contractAddress: string, calldata: string, value = '0'): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(contractAddress);
  txBuilder.data(calldata);
  if (value !== '0') {
    txBuilder.value(value);
  }
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Erc7984Token', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  let getNetworkStub: sinon.SinonStub;

  beforeEach(function () {
    // Test seam: statics network configs are frozen, so stub getNetwork to return a copy
    // pinned with the enterprise viewing key; strict mode fails closed when no pin exists.
    const originalNetwork = coin.getNetwork() as EthereumNetwork;
    getNetworkStub = sinon
      .stub(coin, 'getNetwork')
      .returns({ ...originalNetwork, zamaViewingKeyAddress: DELEGATE_ADDRESS });
  });

  afterEach(function () {
    getNetworkStub.restore();
  });

  // -------------------------------------------------------------------------
  describe('getTokenEnablementConfig', function () {
    it('should return requiresTokenEnablement: true', function () {
      const config = coin.getTokenEnablementConfig();
      config.requiresTokenEnablement.should.equal(true);
    });

    it('should return supportsMultipleTokenEnablements: true', function () {
      const config = coin.getTokenEnablementConfig();
      config.supportsMultipleTokenEnablements.should.equal(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – non-enable-token', function () {
    it('should route to confidential transfer path when type is not enabletoken', async function () {
      // Non-enabletoken transactions route to verifyConfidentialTransfer.
      // Empty recipients triggers our ERC7984-specific validation error,
      // confirming the override only intercepts the enabletoken type.
      await coin
        .verifyTransaction({
          txParams: { recipients: [] },
          txPrebuild: {} as any,
          wallet: {} as any,
        })
        .should.be.rejectedWith(/recipients must contain at least one entry/);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – TSS path', function () {
    it('should verify a valid single-token delegation tx', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should verify a valid multi-token delegation tx', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS, CUSDT_TOKEN_ADDRESS]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }, { name: 'hteth:cusdt' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should throw when ACL address does not match', async function () {
      const txHex = await buildDelegationTxHex(WRONG_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/does not match ACL contract/);
    });

    it('should throw when calldata contains wrong token address', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [WRONG_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/not found in delegation calldata/);
    });

    it('should verify a valid forwarder delegation tx (callFromParent shape)', async function () {
      const txHex = await buildForwarderDelegationTxHex(FORWARDER_ADDRESS, ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should verify a forwarder delegation tx with multiple tokens', async function () {
      const txHex = await buildForwarderDelegationTxHex(FORWARDER_ADDRESS, ZAMA_ACL_ADDRESS, [
        CTEST1_TOKEN_ADDRESS,
        CUSDT_TOKEN_ADDRESS,
      ]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }, { name: 'hteth:cusdt' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should throw when forwarder calldata contains wrong token address', async function () {
      const txHex = await buildForwarderDelegationTxHex(FORWARDER_ADDRESS, ZAMA_ACL_ADDRESS, [WRONG_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/not found in delegation calldata/);
    });

    it('should throw when calldata has unrecognised method ID', async function () {
      // Build a tx with arbitrary calldata that is neither multicall nor callFromParent
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.contract(ZAMA_ACL_ADDRESS);
      txBuilder.data('0xdeadbeef');
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/unrecognised calldata method ID/);
    });

    it('should throw when transaction value is not 0', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS], '1');
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/expected transaction value 0/);
    });

    it('should throw when enableTokens is empty', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/enableTokens must be non-empty/);
    });

    it('should throw when txHex is missing', async function () {
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: {} as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/missing txHex/);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – strict delegation verification (CECHO-2720)', function () {
    it('should reject a delegate substitution when the network pins an enterprise viewing key', async function () {
      // The root beforeEach pins DELEGATE_ADDRESS as the enterprise viewing key.
      const txHex = await buildDelegationTxHex(
        ZAMA_ACL_ADDRESS,
        [CTEST1_TOKEN_ADDRESS],
        '0',
        ATTACKER_DELEGATE_ADDRESS
      );
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/does not match the expected enterprise viewing key/);
    });

    it('should verify a delegation whose delegate matches the pinned enterprise viewing key', async function () {
      // The root beforeEach pins DELEGATE_ADDRESS as the enterprise viewing key.
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should reject inconsistent delegates across inner delegation calls', async function () {
      const innerCalls = [
        buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY),
        buildDelegationCalldata(ATTACKER_DELEGATE_ADDRESS, CUSDT_TOKEN_ADDRESS, EXPIRY),
      ];
      const txHex = await buildRawContractCallTxHex(ZAMA_ACL_ADDRESS, encodeRawMulticall(innerCalls));
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }, { name: 'hteth:cusdt' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/inconsistent delegates/);
    });

    it('should reject smuggled non-delegation calls inside the multicall', async function () {
      // Hostile inner entry: ACL.approve(attacker, 1) — a selector the legacy decoder silently skips.
      const smuggledCall =
        approveMethodId + EthereumAbi.rawEncode(['address', 'uint256'], [ATTACKER_CONTRACT_ADDRESS, 1]).toString('hex');
      const innerCalls = [buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY), smuggledCall];
      const txHex = await buildRawContractCallTxHex(ZAMA_ACL_ADDRESS, encodeRawMulticall(innerCalls));
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/unrecognised method ID/);
    });

    it('should reject the forwarder theft prebuild (callFromParent to attacker contract with the forwarder balance)', async function () {
      const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
      const calldata = encodeRawCallFromParent(ATTACKER_CONTRACT_ADDRESS, '1000000000000000000', inner);
      const txHex = await buildRawContractCallTxHex(FORWARDER_ADDRESS, calldata);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/callFromParent target .* does not match ACL contract/);
    });

    it('should reject callFromParent with a non-zero native value', async function () {
      const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
      const calldata = encodeRawCallFromParent(ZAMA_ACL_ADDRESS, '1000000000000000000', inner);
      const txHex = await buildRawContractCallTxHex(FORWARDER_ADDRESS, calldata);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/callFromParent must carry value 0/);
    });

    it('should reject extra delegation calls for tokens that were not requested', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS, CUSDT_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/must contain exactly 1 distinct token delegation.s. but found 2/);
    });

    it('should reject duplicate delegations for the same token', async function () {
      const innerCalls = [
        buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY),
        buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY),
      ];
      const txHex = await buildRawContractCallTxHex(ZAMA_ACL_ADDRESS, encodeRawMulticall(innerCalls));
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/duplicate delegations for the same token/);
    });

    it('should reject an unrequested token smuggled alongside a duplicate requested token', async function () {
      // The pre-review length check let requested [A, A] with decoded [A, X] pass.
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS, CUSDT_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }, { name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/must contain exactly 1 distinct token delegation.s. but found 2/);
    });

    it('should accept a deduplicated prebuild when the caller requests the same token twice', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }, { name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should reject already-expired delegations', async function () {
      const expiredExpiry = Math.floor(Date.now() / 1000) - 3600;
      const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], expiredExpiry);
      const txHex = await buildRawContractCallTxHex(ZAMA_ACL_ADDRESS, calldata);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/has already expired/);
    });

    it('should enforce the strict checks on the staging environment as well', async function () {
      // Test seam: flip the readonly env property to exercise the staging branch of the rollout gate.
      const mutableBitgo = bitgo as { env: string };
      const originalEnv = mutableBitgo.env;
      mutableBitgo.env = 'staging';
      try {
        const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
        const calldata = encodeRawCallFromParent(ATTACKER_CONTRACT_ADDRESS, '1000000000000000000', inner);
        const txHex = await buildRawContractCallTxHex(FORWARDER_ADDRESS, calldata);
        await coin
          .verifyTransaction({
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'hteth:ctest1' }],
            },
            txPrebuild: { txHex } as any,
            wallet: {} as any,
            walletType: 'tss',
          })
          .should.be.rejectedWith(/does not match ACL contract/);
      } finally {
        mutableBitgo.env = originalEnv;
      }
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – strict mode fails closed without a pinned viewing key (CECHO-2720)', function () {
    beforeEach(function () {
      // Drop the root-level pin: strict mode must fail closed when nothing is pinned.
      getNetworkStub.restore();
    });

    it('should reject a valid delegation when the network pins no enterprise viewing key', async function () {
      const txHex = await buildDelegationTxHex(ZAMA_ACL_ADDRESS, [CTEST1_TOKEN_ADDRESS]);
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'hteth:ctest1' }],
          },
          txPrebuild: { txHex } as any,
          wallet: {} as any,
          walletType: 'tss',
        })
        .should.be.rejectedWith(/zamaViewingKeyAddress is not pinned.*fail closed/);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – CECHO-2720 rollout gate (prod keeps legacy behavior)', function () {
    beforeEach(function () {
      // Test seam: flip the readonly env property to simulate prod (legacy verification path).
      const mutableBitgo = bitgo as { env: string };
      mutableBitgo.env = 'prod';
    });

    afterEach(function () {
      // Test seam: restore the test environment after each prod simulation.
      const mutableBitgo = bitgo as { env: string };
      mutableBitgo.env = 'test';
    });

    it('should still verify the forwarder theft prebuild on prod (strict checks not yet enforced there)', async function () {
      const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
      const calldata = encodeRawCallFromParent(ATTACKER_CONTRACT_ADDRESS, '1000000000000000000', inner);
      const txHex = await buildRawContractCallTxHex(FORWARDER_ADDRESS, calldata);
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });

    it('should still verify a smuggled-call prebuild on prod', async function () {
      // Hostile inner entry: ACL.approve(attacker, 1).
      const smuggledCall =
        approveMethodId + EthereumAbi.rawEncode(['address', 'uint256'], [ATTACKER_CONTRACT_ADDRESS, 1]).toString('hex');
      const innerCalls = [buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY), smuggledCall];
      const txHex = await buildRawContractCallTxHex(ZAMA_ACL_ADDRESS, encodeRawMulticall(innerCalls));
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'hteth:ctest1' }],
        },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
        walletType: 'tss',
      });
      result.should.equal(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('decodeDelegationCallsFromCalldata', function () {
    it('should decode delegate, token, and expiry from multicall calldata', function () {
      const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
      const decoded = decodeDelegationCallsFromCalldata(calldata);
      decoded.shape.should.equal('aclMulticall');
      decoded.calls.length.should.equal(1);
      decoded.calls[0].delegate.should.equal(DELEGATE_ADDRESS.toLowerCase());
      decoded.calls[0].tokenAddress.should.equal(CTEST1_TOKEN_ADDRESS.toLowerCase());
      decoded.calls[0].expiry.should.equal(BigInt(EXPIRY));
    });

    it('should decode the callFromParent target and native value', function () {
      const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
      const wrapped = encodeRawCallFromParent(ZAMA_ACL_ADDRESS, '123', inner);
      const decoded = decodeDelegationCallsFromCalldata(wrapped);
      decoded.shape.should.equal('callFromParent');
      (decoded.callFromParentTarget as string).should.equal(ZAMA_ACL_ADDRESS.toLowerCase());
      (decoded.callFromParentValue as bigint).should.equal(123n);
      decoded.calls[0].delegate.should.equal(DELEGATE_ADDRESS.toLowerCase());
    });

    it('should throw on a non-delegation inner call', function () {
      const smuggledCall =
        approveMethodId + EthereumAbi.rawEncode(['address', 'uint256'], [ATTACKER_CONTRACT_ADDRESS, 1]).toString('hex');
      const innerCalls = [buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY), smuggledCall];
      should.throws(() => decodeDelegationCallsFromCalldata(encodeRawMulticall(innerCalls)), /unrecognised method ID/);
    });

    it('should throw on trailing bytes in an inner call', function () {
      const paddedCall = buildDelegationCalldata(DELEGATE_ADDRESS, CTEST1_TOKEN_ADDRESS, EXPIRY) + 'ff'.repeat(32);
      should.throws(() => decodeDelegationCallsFromCalldata(encodeRawMulticall([paddedCall])), /malformed/);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyTransaction – multisig path', function () {
    it('should verify valid buildParams recipients', async function () {
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          recipients: [{ tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' }] as any,
        },
        txPrebuild: {
          buildParams: {
            type: 'enabletoken',
            recipients: [{ tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' }],
          },
        } as any,
        wallet: {} as any,
        walletType: 'onchain',
      });
      result.should.equal(true);
    });

    it('should verify multiple token recipients', async function () {
      const result = await coin.verifyTransaction({
        txParams: {
          type: 'enabletoken',
          recipients: [
            { tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' },
            { tokenName: 'hteth:cusdt', address: '0xabc', amount: '0' },
          ] as any,
        },
        txPrebuild: {
          buildParams: {
            type: 'enabletoken',
            recipients: [
              { tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' },
              { tokenName: 'hteth:cusdt', address: '0xabc', amount: '0' },
            ],
          },
        } as any,
        wallet: {} as any,
        walletType: 'onchain',
      });
      result.should.equal(true);
    });

    it('should throw when buildParams recipients have wrong tokenName', async function () {
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            recipients: [{ tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' }] as any,
          },
          txPrebuild: {
            buildParams: {
              type: 'enabletoken',
              recipients: [{ tokenName: 'hteth:wrongtoken', address: '0xabc', amount: '0' }],
            },
          } as any,
          wallet: {} as any,
          walletType: 'onchain',
        })
        .should.be.rejectedWith(/not found in buildParams recipients/);
    });

    it('should throw when amount is not 0', async function () {
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
            recipients: [{ tokenName: 'hteth:ctest1', address: '0xabc', amount: '0' }] as any,
          },
          txPrebuild: {
            buildParams: {
              type: 'enabletoken',
              recipients: [{ tokenName: 'hteth:ctest1', address: '0xabc', amount: '100' }],
            },
          } as any,
          wallet: {} as any,
          walletType: 'onchain',
        })
        .should.be.rejectedWith(/expected amount 0/);
    });

    it('should throw when recipients is missing', async function () {
      await coin
        .verifyTransaction({
          txParams: {
            type: 'enabletoken',
          },
          txPrebuild: {
            buildParams: {},
          } as any,
          wallet: {} as any,
          walletType: 'onchain',
        })
        .should.be.rejectedWith(/missing buildParams.recipients/);
    });
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – confidential transfer (SendERC7984) tests
// ---------------------------------------------------------------------------

/**
 * Build a raw signed sendMultiSig tx hex that wraps a confidentialTransfer call.
 * The wallet contract (sendMultiSig wrapper) is `walletContractAddress`.
 */
async function buildConfidentialTransferTxHex(opts: {
  walletContractAddress: string;
  tokenContractAddress: string;
  recipientAddress: string;
  encryptedHandle: string;
  inputProof: string;
}): Promise<string> {
  const key = testData.KEYPAIR_PRV.getKeys().prv as string;
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '12100000' });
  txBuilder.counter(1);
  txBuilder.contract(opts.walletContractAddress);
  txBuilder.type(TransactionType.SendERC7984);

  const transferBuilder = txBuilder.transfer() as TransferBuilderERC7984;
  transferBuilder
    .from('0x19645032c7f1533395d44a629462e751084d3e4d')
    .to(opts.recipientAddress)
    .tokenContractAddress(opts.tokenContractAddress)
    .encryptedHandle(opts.encryptedHandle)
    .inputProof(opts.inputProof)
    .contractSequenceId(1)
    .expirationTime(Math.floor(Date.now() / 1000) + 3600)
    .key(key);

  txBuilder.sign({ key: testData.PRIVATE_KEY });
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – confidential transfer (SendERC7984)', function () {
  // Wallet contract that wraps the sendMultiSig call
  const WALLET_CONTRACT = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
  // Recipient of the confidential transfer
  const RECIPIENT = '0x19645032c7f1533395d44a629462e751084d3e4c';
  // Encrypted handle: synthetic 32 bytes
  const HANDLE = '0x' + 'ab'.repeat(32);
  // Input proof: synthetic 50 bytes
  const PROOF = '0x' + 'cd'.repeat(50);
  // A different recipient to trigger mismatch
  const WRONG_RECIPIENT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  // A different token contract to trigger mismatch
  const WRONG_TOKEN = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  // Representative plaintext amount in base units (e.g., 1 cTEST1 = 1_000_000 units at 6 decimals)
  const AMOUNT = '1000000';

  it('should verify a valid confidential transfer transaction with matching amounts', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    const result = await coin.verifyTransaction({
      txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      txPrebuild: { txHex, buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] } } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should throw when no recipient info is provided in either txParams or buildParams', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: {},
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/missing expected recipient/);
  });

  it('should verify successfully using buildParams.recipients when txParams has no recipients', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    const result = await coin.verifyTransaction({
      txParams: {},
      txPrebuild: {
        txHex,
        buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should throw when token contract address does not match this coin', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: WRONG_TOKEN,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/token contract address mismatch/);
  });

  it('should throw when recipient address does not match txParams', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: WRONG_RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipient address mismatch/);
  });

  it('should throw when calldata is not a confidential transfer', async function () {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(WALLET_CONTRACT);
    txBuilder.data('0xdeadbeef00000000000000000000000000000000000000000000000000000000');
    const tx = await txBuilder.build();
    const txHex = tx.toBroadcastFormat();

    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/failed to decode confidential transfer calldata/);
  });

  it('should throw when txParams amount does not match buildParams amount (with txHex)', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '9999999' }] },
        txPrebuild: {
          txHex,
          buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount mismatch/);
  });

  it('should throw when txParams amount is 0 (with txHex)', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '0' }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount must be a positive integer string/);
  });

  // ── First-signer (no txHex) tests ──────────────────────────────────────────

  it('should verify valid first-signer params when no txHex is present', async function () {
    const result = await coin.verifyTransaction({
      txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      txPrebuild: {} as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should verify first-signer params when txParams and buildParams amounts match', async function () {
    const result = await coin.verifyTransaction({
      txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      txPrebuild: { buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] } } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should throw when recipients is empty and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [] },
        txPrebuild: {} as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipients must contain at least one entry/);
  });

  it('should throw when recipient address is invalid and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: 'not-an-address', amount: AMOUNT }] },
        txPrebuild: {} as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipient address is missing or invalid/);
  });

  it('should throw when amount is 0 and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '0' }] },
        txPrebuild: {} as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount must be a positive integer string/);
  });

  it('should throw when amount is empty and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '' }] },
        txPrebuild: {} as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount must be a positive integer string/);
  });

  it('should throw when txParams and buildParams amounts mismatch and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '9999999' }] },
        txPrebuild: { buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] } } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount mismatch/);
  });

  it('should throw when txParams and buildParams recipient addresses mismatch and no txHex is present', async function () {
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        txPrebuild: {
          buildParams: { recipients: [{ address: WRONG_RECIPIENT, amount: AMOUNT }] },
        } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipient address mismatch/);
  });

  it('should verify when txHex absent and buildParams has matching recipient address', async function () {
    const result = await coin.verifyTransaction({
      txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      txPrebuild: {
        buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should verify decoded recipient against buildParams when txParams.recipients is absent', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    // No recipients in txParams — falls back to buildParams for recipient verification
    const result = await coin.verifyTransaction({
      txParams: {},
      txPrebuild: {
        txHex,
        buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should throw when decoded recipient does not match buildParams recipient (txParams absent)', async function () {
    const txHex = await buildConfidentialTransferTxHex({
      walletContractAddress: WALLET_CONTRACT,
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });

    await coin
      .verifyTransaction({
        txParams: {},
        txPrebuild: {
          txHex,
          buildParams: { recipients: [{ address: WRONG_RECIPIENT, amount: AMOUNT }] },
        } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipient address mismatch/);
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – direct confidentialTransfer (hot/TSS EOA wallet) tests
// ---------------------------------------------------------------------------

/**
 * Builds a raw tx hex where the EOA calls confidentialTransfer directly on the token
 * contract (no sendMultiSig wrapper). This is the hot/TSS wallet path.
 */
async function buildDirectConfidentialTransferTxHex(opts: {
  tokenContractAddress: string;
  recipientAddress: string;
  encryptedHandle: string;
  inputProof: string;
}): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  // tx.to = token contract (EOA calls it directly)
  txBuilder.contract(opts.tokenContractAddress);
  // Inner calldata: confidentialTransfer(address, bytes32, bytes) — no sendMultiSig wrapper
  const calldata = new TransferBuilderERC7984()
    .to(opts.recipientAddress)
    .tokenContractAddress(opts.tokenContractAddress)
    .encryptedHandle(opts.encryptedHandle)
    .inputProof(opts.inputProof)
    .build();
  txBuilder.data(calldata);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – direct confidentialTransfer (hot/TSS EOA wallet)', function () {
  const RECIPIENT = '0x19645032c7f1533395d44a629462e751084d3e4c';
  const HANDLE = '0x' + 'ab'.repeat(32);
  const PROOF = '0x' + 'cd'.repeat(50);
  const WRONG_RECIPIENT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const WRONG_TOKEN = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const AMOUNT = '1000000';

  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  it('should verify a valid direct confidentialTransfer tx', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    const result = await coin.verifyTransaction({
      txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      txPrebuild: { txHex, buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] } } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should verify using buildParams.recipients when txParams has no recipients', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    const result = await coin.verifyTransaction({
      txParams: {},
      txPrebuild: {
        txHex,
        buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
      } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should throw when token contract address (tx.to) does not match this coin', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: WRONG_TOKEN,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/token contract address mismatch/);
  });

  it('should throw when recipient address does not match txParams', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: WRONG_RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/recipient address mismatch/);
  });

  it('should throw when no recipient info is provided in either txParams or buildParams', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    await coin
      .verifyTransaction({
        txParams: {},
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/missing expected recipient/);
  });

  it('should throw when txParams amount does not match buildParams amount', async function () {
    const txHex = await buildDirectConfidentialTransferTxHex({
      tokenContractAddress: CTEST1_TOKEN_ADDRESS,
      recipientAddress: RECIPIENT,
      encryptedHandle: HANDLE,
      inputProof: PROOF,
    });
    await coin
      .verifyTransaction({
        txParams: { recipients: [{ address: RECIPIENT, amount: '9999999' }] },
        txPrebuild: {
          txHex,
          buildParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount mismatch/);
  });
});

// ---------------------------------------------------------------------------
// decodeTokenAddressesFromDelegationCalldata tests
// ---------------------------------------------------------------------------

describe('decodeTokenAddressesFromDelegationCalldata', function () {
  it('should decode a single-token multicall calldata', function () {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
    const addresses = decodeTokenAddressesFromDelegationCalldata(calldata);
    addresses.should.deepEqual([CTEST1_TOKEN_ADDRESS.toLowerCase()]);
  });

  it('should decode a multi-token multicall calldata', function () {
    const calldata = buildMulticallDelegationCalldata(
      DELEGATE_ADDRESS,
      [CTEST1_TOKEN_ADDRESS, CUSDT_TOKEN_ADDRESS],
      EXPIRY
    );
    const addresses = decodeTokenAddressesFromDelegationCalldata(calldata);
    addresses.should.deepEqual([CTEST1_TOKEN_ADDRESS.toLowerCase(), CUSDT_TOKEN_ADDRESS.toLowerCase()]);
  });

  it('should return addresses in lowercase', function () {
    const mixedCase = '0x7B1D59bbCD291daA59cB6C8C5bc04De1AFC4aBA1';
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [mixedCase], EXPIRY);
    const addresses = decodeTokenAddressesFromDelegationCalldata(calldata);
    addresses[0].should.equal(mixedCase.toLowerCase());
  });

  it('should handle callFromParent-wrapped multicall calldata', function () {
    const inner = buildMulticallDelegationCalldata(
      DELEGATE_ADDRESS,
      [CTEST1_TOKEN_ADDRESS, CUSDT_TOKEN_ADDRESS],
      EXPIRY
    );
    const wrapped = wrapInCallFromParent(ZAMA_ACL_ADDRESS, inner);
    const addresses = decodeTokenAddressesFromDelegationCalldata(wrapped);
    addresses.should.deepEqual([CTEST1_TOKEN_ADDRESS.toLowerCase(), CUSDT_TOKEN_ADDRESS.toLowerCase()]);
  });

  it('should work with calldata missing 0x prefix', function () {
    const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [CTEST1_TOKEN_ADDRESS], EXPIRY);
    const noPrefix = calldata.slice(2); // strip 0x
    const addresses = decodeTokenAddressesFromDelegationCalldata(noPrefix);
    addresses.should.deepEqual([CTEST1_TOKEN_ADDRESS.toLowerCase()]);
  });

  it('should throw for unrecognised calldata', function () {
    should.throws(
      () => decodeTokenAddressesFromDelegationCalldata('0xdeadbeef00000000'),
      /Not a valid delegation calldata/
    );
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – confidential consolidation (FlushERC7984ForwarderToken)
// ---------------------------------------------------------------------------

const MULTISIG_WALLET_CONTRACT = '0x3b58684525564b38a381e46a731703ed03f32122';
// Wallet-owned flush forwarder for the fixture wallet, derived rather than arbitrary:
// the strict consolidation verifier (CECHO-2719) only accepts destinations that are
// locally derivable from the wallet's base address, so the fixture uses the real
// CREATE2 forwarder of CONSOLIDATION_BASE_ADDRESS (assigned in before() below).
let CONSOLIDATION_FORWARDER = '';
const CONSOLIDATION_BASE_ADDRESS = '0x3b58684525564b38a381e46a731703ed03f32122';
const CONSOLIDATION_HANDLE = '0x65df136b609ab395c1a99ae46f7939c7f8b20dff4bff0000000088bb0050';
const DUMMY_MULTISIG_SIGNATURE = '0x' + '00'.repeat(65);
// Hoodi enterprise fee address used in v4 forwarder CREATE2 salts (from the v5-wallet
// address fixture in test/unit/eth.ts) — for the v4-salted forwarder regression tests.
const V4_WALLET_FEE_ADDRESS = '0xb1e725186990b86ca8efed08a3ccda9c9f400f09';

/**
 * Builds a multisig consolidation tx: to = wallet contract, data = sendMultiSig
 * wrapping callFromParent flush calldata. Parameters allow hostile prebuild variants
 * (attacker forwarder, non-zero amount, wrong outer contract) for CECHO-2719 tests.
 */
async function buildMultisigConsolidationTxHex(
  forwarderAddress: string = CONSOLIDATION_FORWARDER,
  amount = '0',
  contractAddress: string = MULTISIG_WALLET_CONTRACT,
  outerValue = '0'
): Promise<string> {
  const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
    CTEST1_TOKEN_ADDRESS,
    CONSOLIDATION_BASE_ADDRESS,
    CONSOLIDATION_HANDLE
  );
  const sendData = sendMultiSigData(
    forwarderAddress,
    amount,
    flushCalldata,
    Math.floor(Date.now() / 1000) + 3600,
    14,
    DUMMY_MULTISIG_SIGNATURE
  );

  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '12100000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(contractAddress);
  txBuilder.data(sendData);
  if (outerValue !== '0') {
    txBuilder.value(outerValue);
  }
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

async function buildDirectConsolidationTxHex(): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
  txBuilder.contract(CONSOLIDATION_FORWARDER);
  txBuilder.forwarderAddress(CONSOLIDATION_FORWARDER);
  txBuilder.tokenContractAddress(CTEST1_TOKEN_ADDRESS);
  txBuilder.parentAddress(CONSOLIDATION_BASE_ADDRESS);
  txBuilder.encryptedHandle(CONSOLIDATION_HANDLE);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – confidential consolidation (FlushERC7984ForwarderToken)', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
    // CECHO-2719: derive the fixture forwarder locally (Hoodi v1 forwarder factory,
    // index 1) so it is a genuinely wallet-owned destination for strict verification.
    const hoodiNetwork = coin.getNetwork() as EthereumNetwork;
    CONSOLIDATION_FORWARDER = coin.generateForwarderAddress(
      CONSOLIDATION_BASE_ADDRESS,
      '',
      hoodiNetwork.forwarderFactoryAddress as string,
      hoodiNetwork.forwarderImplementationAddress as string,
      1
    );
  });

  it('should verify a valid multisig consolidation tx (sendMultiSig → callFromParent → confidentialTransferNoProof)', async function () {
    const txHex = await buildMultisigConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: { type: 'consolidate' } as any,
      txPrebuild: {
        consolidateId: '6a44ebc0326e1be45c1d797542c8c634',
        txHex,
        recipients: [{ address: CONSOLIDATION_FORWARDER, amount: '0' }],
      } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should verify a valid direct callFromParent consolidation tx (TSS shape)', async function () {
    const txHex = await buildDirectConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: { type: 'consolidate' } as any,
      txPrebuild: {
        consolidateId: '6a44ebc0326e1be45c1d797542c8c634',
        txHex,
      } as any,
      wallet,
      verification: { consolidationToBaseAddress: true },
    });
    result.should.equal(true);
  });

  it('should reject multisig consolidation when parent address does not match wallet base address', async function () {
    const txHex = await buildMultisigConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/parent address mismatch/);
  });

  it('should verify multisig consolidation using forwarder address from txPrebuild.txInfo.recipients', async function () {
    const txHex = await buildMultisigConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
    });

    // No top-level recipients; forwarder comes from txInfo.recipients
    const result = await coin.verifyTransaction({
      txParams: { type: 'consolidate' } as any,
      txPrebuild: {
        consolidateId: '6a44ebc0326e1be45c1d797542c8c634',
        txHex,
        txInfo: { recipients: [{ address: CONSOLIDATION_FORWARDER, amount: '0' }] },
      } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should reject multisig consolidation when txInfo.recipients forwarder address does not match tx forwarder', async function () {
    const txHex = await buildMultisigConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: {
          consolidateId: 'abc123',
          txHex,
          txInfo: { recipients: [{ address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', amount: '0' }] },
        } as any,
        wallet,
      })
      .should.be.rejectedWith(/forwarder address mismatch/);
  });

  // TSS MPCv2 signing path — resolveEffectiveTxParams sets type from intent.intentType ('consolidateToken'),
  // and txPrebuild has only txHex (no consolidateId, no recipients). This was the broken path before
  // isConsolidationTransaction was updated to recognise 'consolidateToken'.
  it('should verify a valid direct callFromParent consolidation tx when type is consolidateToken (TSS MPCv2 signing path)', async function () {
    const txHex = await buildDirectConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: {
        type: 'consolidateToken',
        recipients: [{ address: CONSOLIDATION_FORWARDER, amount: '0' }],
      } as any,
      txPrebuild: { txHex } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should reject callFromParent consolidation with type consolidateToken when parent address does not match wallet base address', async function () {
    const txHex = await buildDirectConsolidationTxHex();
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    });

    await coin
      .verifyTransaction({
        txParams: {
          type: 'consolidateToken',
          recipients: [{ address: CONSOLIDATION_FORWARDER, amount: '0' }],
        } as any,
        txPrebuild: { txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/parent address mismatch/);
  });
  // -------------------------------------------------------------------------
  describe('strict consolidation verification (CECHO-2719)', function () {
    it('should reject a TSS direct theft prebuild (to = attacker, value = wallet balance)', async function () {
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(ATTACKER_CONTRACT_ADDRESS, flushCalldata, '1000000000000000000');
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/expected transaction value 0/);
    });

    it('should reject a TSS direct arbitrary-call prebuild (to = attacker, value = 0)', async function () {
      // Zero value kills the native-balance theft, but without the enable-token
      // verifier's structural backstop the wallet would still execute an arbitrary
      // zero-value call at the attacker's contract, so the destination must be a
      // locally derived wallet-owned forwarder.
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(ATTACKER_CONTRACT_ADDRESS, flushCalldata);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/is not a wallet-owned forwarder address/);
    });

    it('should reject a multisig theft prebuild (sendMultiSig(attacker, balance, flush))', async function () {
      const txHex = await buildMultisigConsolidationTxHex(ATTACKER_CONTRACT_ADDRESS, '1000000000000000000');
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/sendMultiSig amount must be 0/);
    });

    it('should reject a multisig arbitrary-call prebuild (sendMultiSig(attacker, 0, flush))', async function () {
      const txHex = await buildMultisigConsolidationTxHex(ATTACKER_CONTRACT_ADDRESS);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/is not a wallet-owned forwarder address/);
    });

    it('should reject a multisig prebuild whose outer to is not the wallet contract', async function () {
      // sendMultiSig targets the fixture's derived forwarder, but the outer call goes
      // to a contract that is not the wallet's base address.
      const txHex = await buildMultisigConsolidationTxHex(undefined, '0', ATTACKER_CONTRACT_ADDRESS);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/multisig consolidation must call the wallet contract/);
    });

    it('should reject a non-zero callFromParent value even when the destination is a derived forwarder', async function () {
      const inner = buildConfidentialTransferByHandleCalldata(CONSOLIDATION_BASE_ADDRESS, CONSOLIDATION_HANDLE);
      const calldata = encodeRawCallFromParent(CTEST1_TOKEN_ADDRESS, '123', inner);
      const txHex = await buildRawContractCallTxHex(CONSOLIDATION_FORWARDER, calldata);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/callFromParent must carry value 0/);
    });

    it('should reject a txHex-less prebuild carrying only a consolidateId', async function () {
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: '6a44ebc0326e1be45c1d797542c8c634' } as any,
          wallet,
        })
        .should.be.rejectedWith(/txPrebuild\.txHex is required/);
    });

    it('should fail closed when no wallet-owned forwarder can be derived', async function () {
      // Test seam: statics network configs are frozen, so stub getNetwork to return a
      // copy with no forwarder factory addresses configured (original captured before
      // stubbing, per the frozen-networks constraint).
      const originalNetwork = coin.getNetwork() as EthereumNetwork;
      const getNetworkStub = sinon.stub(coin, 'getNetwork').returns({
        ...originalNetwork,
        forwarderFactoryAddress: undefined,
        walletV2ForwarderFactoryAddress: undefined,
        walletV4ForwarderFactoryAddress: undefined,
      });
      try {
        const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
          CTEST1_TOKEN_ADDRESS,
          CONSOLIDATION_BASE_ADDRESS,
          CONSOLIDATION_HANDLE
        );
        const txHex = await buildRawContractCallTxHex(CONSOLIDATION_FORWARDER, flushCalldata);
        const wallet = new Wallet(bitgo, coin, {
          coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
        });

        await coin
          .verifyTransaction({
            txParams: { type: 'consolidate' } as any,
            txPrebuild: { consolidateId: 'abc123', txHex } as any,
            wallet,
          })
          .should.be.rejectedWith(/unable to derive any wallet-owned forwarder address/);
      } finally {
        getNetworkStub.restore();
      }
    });

    it('should enforce the strict checks on the staging environment as well', async function () {
      // Test seam: flip the readonly env property to exercise the staging branch of the rollout gate.
      const mutableBitgo = bitgo as { env: string };
      const originalEnv = mutableBitgo.env;
      mutableBitgo.env = 'staging';
      try {
        const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
          CTEST1_TOKEN_ADDRESS,
          CONSOLIDATION_BASE_ADDRESS,
          CONSOLIDATION_HANDLE
        );
        const txHex = await buildRawContractCallTxHex(ATTACKER_CONTRACT_ADDRESS, flushCalldata, '1000000000000000000');
        const wallet = new Wallet(bitgo, coin, {
          coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
        });

        await coin
          .verifyTransaction({
            txParams: { type: 'consolidate' } as any,
            txPrebuild: { consolidateId: 'abc123', txHex } as any,
            wallet,
          })
          .should.be.rejectedWith(/expected transaction value 0/);
      } finally {
        mutableBitgo.env = originalEnv;
      }
    });
    it('should reject a multisig prebuild with a non-zero outer transaction value', async function () {
      const txHex = await buildMultisigConsolidationTxHex(undefined, '0', undefined, '1000000000000000000');
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/expected transaction value 0/);
    });

    it('should verify a valid direct consolidation whose txHex is unprefixed', async function () {
      // TransactionBuilder.from() accepts unprefixed serialized txHex (RAW_TX_HEX_REGEX),
      // so a producer (e.g. a TSS serializedTxHex) may send it; strict verification must
      // normalise with addHexPrefix before ethers parseTransaction, not reject the prebuild.
      const txHex = await buildDirectConsolidationTxHex();
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: '6a44ebc0326e1be45c1d797542c8c634', txHex: txHex.slice(2) } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should verify a v1-derived forwarder for a wallet that carries a fee address', async function () {
      // Regression (review): the derivation used to pass the wallet fee address for every
      // forwarder version, which switched v1/v2/v5 to the v4 CREATE2 salt layout and
      // rejected their legitimate forwarders. Only v4 encodes the fee address into its salt.
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS, feeAddress: ATTACKER_CONTRACT_ADDRESS },
      } as any);
      const txHex = await buildDirectConsolidationTxHex();

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: '6a44ebc0326e1be45c1d797542c8c634', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject a forwarder derived beyond the derivation index cap', async function () {
      // Documents the STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX trade-off: an index past
      // the cap is not wallet-verifiable offline, and the rejection names the scanned
      // range so the staging validation window can diagnose it.
      const hoodiNetwork = coin.getNetwork() as EthereumNetwork;
      const beyondCapForwarder = coin.generateForwarderAddress(
        CONSOLIDATION_BASE_ADDRESS,
        '',
        hoodiNetwork.forwarderFactoryAddress as string,
        hoodiNetwork.forwarderImplementationAddress as string,
        10500
      );
      const inner = buildConfidentialTransferByHandleCalldata(CONSOLIDATION_BASE_ADDRESS, CONSOLIDATION_HANDLE);
      const txHex = await buildRawContractCallTxHex(
        beyondCapForwarder,
        wrapInCallFromParent(CTEST1_TOKEN_ADDRESS, inner)
      );
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/verified CREATE2 derivation indices 0\.\.9999/);
    });

    it('should reject a v4-salted forwarder when the wallet record carries no fee address', async function () {
      // v4 forwarders encode the enterprise fee address into the CREATE2 salt; without the
      // wallet's fee address they are not derivable offline, and the rejection must name
      // the missing data instead of silently dropping the v4 layout (review finding).
      const hoodiNetwork = coin.getNetwork() as EthereumNetwork;
      const v4Forwarder = coin.generateForwarderAddress(
        CONSOLIDATION_BASE_ADDRESS,
        V4_WALLET_FEE_ADDRESS,
        hoodiNetwork.walletV4ForwarderFactoryAddress as string,
        hoodiNetwork.walletV4ForwarderImplementationAddress as string,
        1
      );
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(v4Forwarder, flushCalldata);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(
          /v4-salted forwarders were NOT verifiable because the wallet record carries no feeAddress/
        );
    });

    it('should verify a v4-salted forwarder when the wallet carries its fee address', async function () {
      const hoodiNetwork = coin.getNetwork() as EthereumNetwork;
      const v4Forwarder = coin.generateForwarderAddress(
        CONSOLIDATION_BASE_ADDRESS,
        V4_WALLET_FEE_ADDRESS,
        hoodiNetwork.walletV4ForwarderFactoryAddress as string,
        hoodiNetwork.walletV4ForwarderImplementationAddress as string,
        1
      );
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(v4Forwarder, flushCalldata);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS, feeAddress: V4_WALLET_FEE_ADDRESS },
      } as any);

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });
    it('should reject the wallet base address as a flush destination', async function () {
      // A legitimate consolidation always targets a forwarder contract; the wallet's own
      // base address has no callFromParent and holds no balances to flush. The multisig
      // outer `to == base` requirement is enforced separately (review follow-up).
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(CONSOLIDATION_BASE_ADDRESS, flushCalldata);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS, feeAddress: V4_WALLET_FEE_ADDRESS },
      } as any);

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejectedWith(/is not a wallet-owned forwarder address/);
    });

    it('should verify a multisig consolidation to a v4-salted forwarder for a fee-carrying wallet', async function () {
      // The multisig shape is the other v4 consumer besides the TSS v5 wallet.
      const hoodiNetwork = coin.getNetwork() as EthereumNetwork;
      const v4Forwarder = coin.generateForwarderAddress(
        CONSOLIDATION_BASE_ADDRESS,
        V4_WALLET_FEE_ADDRESS,
        hoodiNetwork.walletV4ForwarderFactoryAddress as string,
        hoodiNetwork.walletV4ForwarderImplementationAddress as string,
        1
      );
      const txHex = await buildMultisigConsolidationTxHex(v4Forwarder);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS, feeAddress: V4_WALLET_FEE_ADDRESS },
      } as any);

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should verify a consolidation whose txHex is an unsigned EIP-1559 signable (TSS signableHex form)', async function () {
      // The TSS txRequest flow passes unsignedTx.signableHex as txHex; lock in that both
      // the builder round trip and ethers parseTransaction accept the unsigned forms.
      const inner = buildConfidentialTransferByHandleCalldata(CONSOLIDATION_BASE_ADDRESS, CONSOLIDATION_HANDLE);
      const calldata = wrapInCallFromParent(CTEST1_TOKEN_ADDRESS, inner);
      const unsignedTx = {
        type: 2,
        chainId: 560048, // Hoodi
        nonce: 1,
        gasLimit: 200000,
        maxFeePerGas: 1000000000,
        maxPriorityFeePerGas: 1000000,
        to: CONSOLIDATION_FORWARDER,
        value: 0,
        data: calldata,
      };
      const txHex = ethers.utils.serializeTransaction(unsignedTx);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject an unsigned legacy EIP-155 signable at the pre-existing builder round trip', async function () {
      // The unsigned EIP-155 serialization (v = chainId, r = s = 0) is not parseable by
      // the builder's @ethereumjs/tx round trip — on the base branch as well, in both
      // envs, since the legacy decode always runs first. Coins whose signableHex takes
      // that form (e.g. BSC/XDC) are exactly why TSS_VERIFY_USE_SERIALIZED_TX_HEX exists:
      // their verification receives serializedTxHex, which is a parseable serialization.
      // eth/Hoodi TSS flows produce EIP-1559, covered by the previous test.
      const inner = buildConfidentialTransferByHandleCalldata(CONSOLIDATION_BASE_ADDRESS, CONSOLIDATION_HANDLE);
      const calldata = wrapInCallFromParent(CTEST1_TOKEN_ADDRESS, inner);
      const unsignedTx = {
        chainId: 560048,
        nonce: 1,
        gasPrice: 1000000000,
        gasLimit: 200000,
        to: CONSOLIDATION_FORWARDER,
        value: 0,
        data: calldata,
      };
      const txHex = ethers.utils.serializeTransaction(unsignedTx);
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      await coin
        .verifyTransaction({
          txParams: { type: 'consolidate' } as any,
          txPrebuild: { consolidateId: 'abc123', txHex } as any,
          wallet,
        })
        .should.be.rejected();
    });
  });

  // -------------------------------------------------------------------------
  describe('CECHO-2719 rollout gate (prod keeps legacy behavior)', function () {
    beforeEach(function () {
      // Test seam: flip the readonly env property to simulate prod (legacy verification path).
      const mutableBitgo = bitgo as { env: string };
      mutableBitgo.env = 'prod';
    });

    afterEach(function () {
      // Test seam: restore the test environment after each prod simulation.
      const mutableBitgo = bitgo as { env: string };
      mutableBitgo.env = 'test';
    });

    it('should still verify the TSS direct theft prebuild on prod (strict checks not yet enforced there)', async function () {
      const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
        CTEST1_TOKEN_ADDRESS,
        CONSOLIDATION_BASE_ADDRESS,
        CONSOLIDATION_HANDLE
      );
      const txHex = await buildRawContractCallTxHex(ATTACKER_CONTRACT_ADDRESS, flushCalldata, '1000000000000000000');
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should still verify the multisig theft prebuild on prod', async function () {
      const txHex = await buildMultisigConsolidationTxHex(ATTACKER_CONTRACT_ADDRESS, '1000000000000000000');
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: 'abc123', txHex } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should still verify a txHex-less consolidateId-only prebuild on prod', async function () {
      const wallet = new Wallet(bitgo, coin, {
        coinSpecific: { baseAddress: CONSOLIDATION_BASE_ADDRESS },
      });

      const result = await coin.verifyTransaction({
        txParams: { type: 'consolidate' } as any,
        txPrebuild: { consolidateId: '6a44ebc0326e1be45c1d797542c8c634' } as any,
        wallet,
      });
      result.should.equal(true);
    });
  });
});

// ---------------------------------------------------------------------------
// recover() – ERC-7984 confidential token recovery
// ---------------------------------------------------------------------------

describe('Erc7984Token – recover()', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;
  let explorerStub: sinon.SinonStub;

  const WALLET_CONTRACT = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
  const RECOVERY_DEST = '0x19645032c7f1533395d44a629462e751084d3e4c';
  const HANDLE = '0x' + 'ab'.repeat(32);
  const ZERO_HANDLE = '0x' + '00'.repeat(32);

  const USER_KEY = testData.PRIVATE_KEY;
  const BACKUP_KEY = testData.PRIVATE_KEY;
  const WALLET_PASSPHRASE = 'test wallet passphrase';

  /**
   * Function selector for `isSigner(address)` on the WalletSimple contract.
   *
   * EVM calldata starts with the first 4 bytes of the keccak256 hash of the
   * function signature, i.e. `keccak256("isSigner(address)")[0..4]` = `7df73e27`.
   * The explorer stub matches on this prefix to distinguish the signer probe
   * from other `eth_call` queries (e.g. `getNextSequenceId` = `a0b7967b`).
   */
  const IS_SIGNER_SELECTOR = '7df73e27';

  /**
   * Solidity ABI-encoded boolean `true`.
   *
   * A `bool` in ABI encoding occupies a full 32-byte word: 31 zero bytes then
   * `0x01` for true (all 32 zero bytes for false). `queryIsWalletSigner` decodes
   * the explorer response with `ethAbi.rawDecode(['bool'], ...)`, so the stub
   * must return this exact 32-byte shape — a shorter value like `0x01` would
   * fail to decode.
   *
   * Written as an expression instead of a bare hex literal because the repo's
   * test-fixture secret scrubber flags 64-hex literals.
   */
  const ABI_TRUE = '0x' + '00'.repeat(31) + '01';

  /**
   * Solidity ABI-encoded boolean `false` — a 32-byte word of all zeros.
   * See `ABI_TRUE` above for the encoding rationale.
   */
  const ABI_FALSE = '0x' + '00'.repeat(32);

  // Encrypted keys for test (encrypt with the test passphrase)
  let encryptedUserKey: string;
  let encryptedBackupKey: string;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;

    encryptedUserKey = await bitgo.encrypt({ input: USER_KEY, password: WALLET_PASSPHRASE });
    encryptedBackupKey = await bitgo.encrypt({ input: BACKUP_KEY, password: WALLET_PASSPHRASE });
  });

  beforeEach(function () {
    explorerStub = sinon.stub(coin, 'recoveryBlockchainExplorerQuery' as any);
  });

  afterEach(function () {
    sinon.restore();
  });

  function mockExplorerForRecovery(handle: string = HANDLE) {
    explorerStub.callsFake(async (query: Record<string, string>) => {
      if (query.action === 'eth_call' && query.data?.startsWith(IS_SIGNER_SELECTOR)) {
        return { result: ABI_TRUE };
      }
      if (query.action === 'txlist') {
        // getAddressNonce: return empty tx list (nonce = 0)
        return { result: [] };
      }
      if (query.action === 'balance') {
        // queryAddressBalance: return enough ETH for gas
        return { result: '100000000000000000' }; // 0.1 ETH
      }
      if (query.action === 'eth_call' && query.data?.startsWith('a0b7967b')) {
        // querySequenceId: getNextSequenceId
        return { result: '0x0000000000000000000000000000000000000000000000000000000000000005' };
      }
      if (query.action === 'eth_call' && query.to === CTEST1_TOKEN_ADDRESS) {
        // queryConfidentialBalance
        return { result: handle };
      }
      throw new Error(`Unexpected explorer query: ${JSON.stringify(query)}`);
    });
  }

  it('should build a full balance sweep recovery transaction', async function () {
    mockExplorerForRecovery();

    const result = await coin.recover({
      userKey: encryptedUserKey,
      backupKey: encryptedBackupKey,
      walletPassphrase: WALLET_PASSPHRASE,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
    });

    should.exist(result);
    result.should.have.property('id');
    result.should.have.property('tx');
    (result as any).tx.should.be.a.String();
    (result as any).tx.length.should.be.greaterThan(0);
  });

  it('should use user-provided encryptedHandle and skip auto-query', async function () {
    const userHandle = '0x' + 'ff'.repeat(32);

    explorerStub.callsFake(async (query: Record<string, string>) => {
      if (query.action === 'eth_call' && query.data?.startsWith(IS_SIGNER_SELECTOR)) {
        return { result: ABI_TRUE };
      }
      if (query.action === 'txlist') {
        return { result: [] };
      }
      if (query.action === 'balance') {
        return { result: '100000000000000000' };
      }
      if (query.action === 'eth_call' && query.data?.startsWith('a0b7967b')) {
        return { result: '0x0000000000000000000000000000000000000000000000000000000000000005' };
      }
      if (query.action === 'eth_call' && query.to === CTEST1_TOKEN_ADDRESS) {
        throw new Error('Should not query confidentialBalanceOf when handle is provided');
      }
      throw new Error(`Unexpected explorer query: ${JSON.stringify(query)}`);
    });

    const result = await coin.recover({
      userKey: encryptedUserKey,
      backupKey: encryptedBackupKey,
      walletPassphrase: WALLET_PASSPHRASE,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
      encryptedHandle: userHandle,
    });

    should.exist(result);
    result.should.have.property('tx');
  });

  it('should still build a recovery tx even with a zero-value handle (encrypted handles are always non-zero)', async function () {
    mockExplorerForRecovery(ZERO_HANDLE);

    const result = await coin.recover({
      userKey: encryptedUserKey,
      backupKey: encryptedBackupKey,
      walletPassphrase: WALLET_PASSPHRASE,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
    });

    should.exist(result);
    result.should.have.property('tx');
  });

  it('should return unsigned sweep format when isUnsignedSweep is true', async function () {
    mockExplorerForRecovery();

    const result = await coin.recover({
      userKey: testData.PUBLIC_KEY,
      backupKey: testData.PUBLIC_KEY,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
      isUnsignedSweep: true,
    });

    should.exist(result);
    result.should.have.property('tx');
    result.should.have.property('userKey');
    result.should.have.property('backupKey');
  });

  it('should return KRS recovery format with backupKey and coin', async function () {
    explorerStub.callsFake(async (query: Record<string, string>) => {
      if (query.action === 'eth_call' && query.data?.startsWith(IS_SIGNER_SELECTOR)) {
        return { result: ABI_TRUE };
      }
      if (query.action === 'txlist') {
        return { result: [] };
      }
      if (query.action === 'balance') {
        return { result: '100000000000000000' };
      }
      if (query.action === 'eth_call' && query.data?.startsWith('a0b7967b')) {
        return { result: '0x0000000000000000000000000000000000000000000000000000000000000005' };
      }
      if (query.action === 'eth_call' && query.to === CTEST1_TOKEN_ADDRESS) {
        return { result: HANDLE };
      }
      throw new Error(`Unexpected explorer query: ${JSON.stringify(query)}`);
    });

    const result = (await coin.recover({
      userKey: encryptedUserKey,
      backupKey: testData.PUBLIC_KEY,
      walletPassphrase: WALLET_PASSPHRASE,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
      krsProvider: 'keyternal',
    })) as any;

    should.exist(result);
    result.should.have.property('tx');
    result.should.have.property('backupKey', testData.PUBLIC_KEY);
    result.should.have.property('coin', 'hteth:ctest1');
  });

  it('should throw when backup key has insufficient gas', async function () {
    explorerStub.callsFake(async (query: Record<string, string>) => {
      if (query.action === 'eth_call' && query.data?.startsWith(IS_SIGNER_SELECTOR)) {
        return { result: ABI_TRUE };
      }
      if (query.action === 'txlist') {
        return { result: [] };
      }
      if (query.action === 'balance') {
        // Very low balance, not enough for 12M gas
        return { result: '100' };
      }
      throw new Error(`Unexpected explorer query: ${JSON.stringify(query)}`);
    });

    await coin
      .recover({
        userKey: encryptedUserKey,
        backupKey: encryptedBackupKey,
        walletPassphrase: WALLET_PASSPHRASE,
        walletContractAddress: WALLET_CONTRACT,
        recoveryDestination: RECOVERY_DEST,
      })
      .should.be.rejectedWith(/has balance.*Gwei/);
  });

  it('should throw when userKey is missing', async function () {
    await coin
      .recover({
        userKey: undefined as any,
        backupKey: encryptedBackupKey,
        walletPassphrase: WALLET_PASSPHRASE,
        walletContractAddress: WALLET_CONTRACT,
        recoveryDestination: RECOVERY_DEST,
      })
      .should.be.rejectedWith(/missing userKey/);
  });

  it('should throw when walletContractAddress is invalid', async function () {
    await coin
      .recover({
        userKey: encryptedUserKey,
        backupKey: encryptedBackupKey,
        walletPassphrase: WALLET_PASSPHRASE,
        walletContractAddress: 'not-an-address',
        recoveryDestination: RECOVERY_DEST,
      })
      .should.be.rejectedWith(/invalid walletContractAddress/);
  });

  it('should produce tx with inner calldata matching confidentialTransfer selector 0x5bebed7e', async function () {
    mockExplorerForRecovery();

    const result = (await coin.recover({
      userKey: encryptedUserKey,
      backupKey: encryptedBackupKey,
      walletPassphrase: WALLET_PASSPHRASE,
      walletContractAddress: WALLET_CONTRACT,
      recoveryDestination: RECOVERY_DEST,
    })) as any;

    should.exist(result.tx);
    // The serialized tx contains the sendMultiSig calldata which wraps confidentialTransfer.
    // The confidentialTransfer selector (5bebed7e) must appear somewhere in the serialized tx.
    const selectorNoPrefix = confidentialTransferNoProofMethodId.slice(2);
    result.tx.should.containEql(selectorNoPrefix);
  });

  it('should throw RecoveryKeyMismatchError when a recovery key is not a wallet signer', async function () {
    explorerStub.callsFake(async (query: Record<string, string>) => {
      if (query.action === 'eth_call' && query.data?.startsWith(IS_SIGNER_SELECTOR)) {
        return { result: ABI_FALSE };
      }
      throw new Error(`Unexpected explorer query: ${JSON.stringify(query)}`);
    });

    await coin
      .recover({
        userKey: encryptedUserKey,
        backupKey: encryptedBackupKey,
        walletPassphrase: WALLET_PASSPHRASE,
        walletContractAddress: WALLET_CONTRACT,
        recoveryDestination: RECOVERY_DEST,
      })
      .should.be.rejectedWith(RecoveryKeyMismatchError);
  });
});

// ---------------------------------------------------------------------------
// queryConfidentialBalance() tests
// ---------------------------------------------------------------------------

describe('Erc7984Token – queryConfidentialBalance()', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;
  let explorerStub: sinon.SinonStub;

  const WALLET_ADDRESS = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
  const HANDLE = '0x' + 'ab'.repeat(32);

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  beforeEach(function () {
    explorerStub = sinon.stub(coin, 'recoveryBlockchainExplorerQuery' as any);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should return a valid bytes32 handle from eth_call', async function () {
    explorerStub.resolves({ result: HANDLE });

    const result = await coin.queryConfidentialBalance(WALLET_ADDRESS);
    result.should.equal(HANDLE);
  });

  it('should verify the eth_call is made to the correct token contract', async function () {
    explorerStub.resolves({ result: HANDLE });

    await coin.queryConfidentialBalance(WALLET_ADDRESS);

    explorerStub.calledOnce.should.be.true();
    const callArgs = explorerStub.firstCall.args[0];
    callArgs.should.have.property('action', 'eth_call');
    callArgs.should.have.property('to', CTEST1_TOKEN_ADDRESS);
    callArgs.should.have.property('module', 'proxy');
  });

  it('should throw when explorer returns no result', async function () {
    explorerStub.resolves({ result: null });

    await coin.queryConfidentialBalance(WALLET_ADDRESS).should.be.rejectedWith(/Could not obtain confidential balance/);
  });

  it('should throw when response format is unexpected (not 66 chars)', async function () {
    explorerStub.resolves({ result: '0xabcd' });

    await coin
      .queryConfidentialBalance(WALLET_ADDRESS)
      .should.be.rejectedWith(/Unexpected confidentialBalanceOf response format/);
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – WrapERC7984 (shield)
// ---------------------------------------------------------------------------

const WRAP_BASE_ADDRESS = '0x1111111111111111111111111111111111111111';
const WRAP_AMOUNT = '1000000';
const WRAP_RATE = '1';

async function buildDirectWrapTxHex(tokenAddress: string, recipient: string, amount: string): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.WrapERC7984);
  txBuilder.contract(tokenAddress);
  txBuilder.wrapRecipient(recipient);
  txBuilder.wrapAmount(amount);
  txBuilder.wrapRate(WRAP_RATE);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

async function buildMultisigWrapTxHex(tokenAddress: string, recipient: string, amount: string): Promise<string> {
  const wrapCalldata = buildWrapCalldata(recipient, amount, WRAP_RATE);
  const sendData = sendMultiSigData(
    tokenAddress,
    '0',
    wrapCalldata,
    Math.floor(Date.now() / 1000) + 3600,
    14,
    DUMMY_MULTISIG_SIGNATURE
  );

  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(MULTISIG_WALLET_CONTRACT);
  txBuilder.data(sendData);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – WrapERC7984', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  it('should verify a valid direct wrap tx (TSS shape)', async function () {
    const txHex = await buildDirectWrapTxHex(CTEST1_TOKEN_ADDRESS, WRAP_BASE_ADDRESS, WRAP_AMOUNT);
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: WRAP_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: {
        type: 'wrap',
        recipients: [{ address: WRAP_BASE_ADDRESS, amount: WRAP_AMOUNT }],
      } as any,
      txPrebuild: { txHex } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should verify a valid multisig wrap tx (sendMultiSig → wrap)', async function () {
    const txHex = await buildMultisigWrapTxHex(CTEST1_TOKEN_ADDRESS, WRAP_BASE_ADDRESS, WRAP_AMOUNT);
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: WRAP_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: {
        type: 'wrap',
        recipients: [{ address: WRAP_BASE_ADDRESS, amount: WRAP_AMOUNT }],
      } as any,
      txPrebuild: { txHex } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should reject wrap when recipient does not match wallet base address', async function () {
    const txHex = await buildDirectWrapTxHex(CTEST1_TOKEN_ADDRESS, WRAP_BASE_ADDRESS, WRAP_AMOUNT);
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'wrap', recipients: [{ address: WRAP_BASE_ADDRESS, amount: WRAP_AMOUNT }] } as any,
        txPrebuild: { txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/wrap recipient must equal wallet base address/);
  });

  it('should reject wrap when amount mismatches recipients', async function () {
    const txHex = await buildDirectWrapTxHex(CTEST1_TOKEN_ADDRESS, WRAP_BASE_ADDRESS, WRAP_AMOUNT);
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: WRAP_BASE_ADDRESS },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'wrap', recipients: [{ address: WRAP_BASE_ADDRESS, amount: '999' }] } as any,
        txPrebuild: { txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/amount mismatch/);
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – UnwrapERC7984 (unshield phase-1)
// ---------------------------------------------------------------------------

const UNWRAP_BASE_ADDRESS = '0x1111111111111111111111111111111111111111';
const UNWRAP_ENCRYPTED_AMOUNT = '0x' + 'ab'.repeat(32);
const UNWRAP_INPUT_PROOF = '0x' + 'cd'.repeat(64);

async function buildDirectUnwrapTxHex(
  tokenAddress: string,
  from: string,
  to: string,
  encryptedAmount: string,
  inputProof: string
): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.UnwrapERC7984);
  txBuilder.contract(tokenAddress);
  txBuilder.unwrapFrom(from);
  txBuilder.unwrapTo(to);
  txBuilder.unwrapEncryptedAmount(encryptedAmount);
  txBuilder.unwrapInputProof(inputProof);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

async function buildMultisigUnwrapTxHex(
  tokenAddress: string,
  from: string,
  to: string,
  encryptedAmount: string,
  inputProof: string
): Promise<string> {
  const unwrapCalldata = buildUnwrapCalldata(from, to, encryptedAmount, inputProof);
  const sendData = sendMultiSigData(
    tokenAddress,
    '0',
    unwrapCalldata,
    Math.floor(Date.now() / 1000) + 3600,
    14,
    DUMMY_MULTISIG_SIGNATURE
  );

  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(MULTISIG_WALLET_CONTRACT);
  txBuilder.data(sendData);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – UnwrapERC7984', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  it('should verify a valid direct unwrap tx (TSS shape)', async function () {
    const txHex = await buildDirectUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_ENCRYPTED_AMOUNT,
      UNWRAP_INPUT_PROOF
    );
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: UNWRAP_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: { type: 'unwrap' } as any,
      txPrebuild: { txHex } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should verify a valid multisig unwrap tx (sendMultiSig → unwrap)', async function () {
    const txHex = await buildMultisigUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_ENCRYPTED_AMOUNT,
      UNWRAP_INPUT_PROOF
    );
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: UNWRAP_BASE_ADDRESS },
    });

    const result = await coin.verifyTransaction({
      txParams: { type: 'unwrap' } as any,
      txPrebuild: { txHex } as any,
      wallet,
    });
    result.should.equal(true);
  });

  it('should reject unwrap when from does not match wallet base address', async function () {
    const txHex = await buildDirectUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      UNWRAP_ENCRYPTED_AMOUNT,
      UNWRAP_INPUT_PROOF
    );
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'unwrap' } as any,
        txPrebuild: { txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/unwrap from must equal wallet base address/);
  });

  it('should reject unwrap when to differs from from (non-self-directed)', async function () {
    const other = '0x2222222222222222222222222222222222222222';
    const txHex = await buildDirectUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      UNWRAP_BASE_ADDRESS,
      other,
      UNWRAP_ENCRYPTED_AMOUNT,
      UNWRAP_INPUT_PROOF
    );
    const wallet = new Wallet(bitgo, coin, {
      coinSpecific: { baseAddress: UNWRAP_BASE_ADDRESS },
    });

    await coin
      .verifyTransaction({
        txParams: { type: 'unwrap' } as any,
        txPrebuild: { txHex } as any,
        wallet,
      })
      .should.be.rejectedWith(/unwrap to must equal wallet base address/);
  });
});

// ---------------------------------------------------------------------------
// verifyTransaction – FinalizeUnwrapERC7984 (unshield phase-2)
// ---------------------------------------------------------------------------

const FINALIZE_REQUEST_ID = '0x' + '11'.repeat(32);
const FINALIZE_CLEARTEXT_AMOUNT = '1000000';
const FINALIZE_DECRYPTION_PROOF = '0x' + 'ee'.repeat(64);

async function buildDirectFinalizeUnwrapTxHex(
  tokenAddress: string,
  requestId: string,
  cleartextAmount: string,
  decryptionProof: string
): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
  txBuilder.contract(tokenAddress);
  txBuilder.finalizeUnwrapRequestId(requestId);
  txBuilder.finalizeUnwrapCleartextAmount(cleartextAmount);
  txBuilder.finalizeUnwrapDecryptionProof(decryptionProof);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

async function buildMultisigFinalizeUnwrapTxHex(
  tokenAddress: string,
  requestId: string,
  cleartextAmount: string,
  decryptionProof: string
): Promise<string> {
  const finalizeCalldata = buildFinalizeUnwrapCalldata(requestId, cleartextAmount, decryptionProof);
  const sendData = sendMultiSigData(
    tokenAddress,
    '0',
    finalizeCalldata,
    Math.floor(Date.now() / 1000) + 3600,
    14,
    DUMMY_MULTISIG_SIGNATURE
  );

  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(MULTISIG_WALLET_CONTRACT);
  txBuilder.data(sendData);
  const tx = await txBuilder.build();
  return tx.toBroadcastFormat();
}

describe('verifyTransaction – FinalizeUnwrapERC7984', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  it('should verify a valid direct finalizeUnwrap tx (TSS shape)', async function () {
    const txHex = await buildDirectFinalizeUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      FINALIZE_REQUEST_ID,
      FINALIZE_CLEARTEXT_AMOUNT,
      FINALIZE_DECRYPTION_PROOF
    );

    const result = await coin.verifyTransaction({
      txParams: {
        type: 'finalizeUnwrap',
        recipients: [{ address: UNWRAP_BASE_ADDRESS, amount: FINALIZE_CLEARTEXT_AMOUNT }],
      } as any,
      txPrebuild: { txHex } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should verify a valid multisig finalizeUnwrap tx (sendMultiSig → finalizeUnwrap)', async function () {
    const txHex = await buildMultisigFinalizeUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      FINALIZE_REQUEST_ID,
      FINALIZE_CLEARTEXT_AMOUNT,
      FINALIZE_DECRYPTION_PROOF
    );

    const result = await coin.verifyTransaction({
      txParams: {
        type: 'finalizeUnwrap',
        recipients: [{ address: UNWRAP_BASE_ADDRESS, amount: FINALIZE_CLEARTEXT_AMOUNT }],
      } as any,
      txPrebuild: { txHex } as any,
      wallet: {} as any,
    });
    result.should.equal(true);
  });

  it('should reject finalizeUnwrap when amount mismatches recipients', async function () {
    const txHex = await buildDirectFinalizeUnwrapTxHex(
      CTEST1_TOKEN_ADDRESS,
      FINALIZE_REQUEST_ID,
      FINALIZE_CLEARTEXT_AMOUNT,
      FINALIZE_DECRYPTION_PROOF
    );

    await coin
      .verifyTransaction({
        txParams: {
          type: 'finalizeUnwrap',
          recipients: [{ address: UNWRAP_BASE_ADDRESS, amount: '999' }],
        } as any,
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/amount mismatch/);
  });

  it('should reject finalizeUnwrap when wrapper address mismatches token', async function () {
    const wrongWrapper = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const txHex = await buildDirectFinalizeUnwrapTxHex(
      wrongWrapper,
      FINALIZE_REQUEST_ID,
      FINALIZE_CLEARTEXT_AMOUNT,
      FINALIZE_DECRYPTION_PROOF
    );

    await coin
      .verifyTransaction({
        txParams: { type: 'finalizeUnwrap' } as any,
        txPrebuild: { txHex } as any,
        wallet: {} as any,
      })
      .should.be.rejectedWith(/wrapper address mismatch/);
  });
});

// ---------------------------------------------------------------------------
// setGasLimit() override tests
// ---------------------------------------------------------------------------

describe('Erc7984Token – setGasLimit()', function () {
  let bitgo: TestBitGoAPI;
  let coin: Erc7984Token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    register(bitgo);
    coin = bitgo.coin('hteth:ctest1') as Erc7984Token;
  });

  it('should return 800000 as default gas limit', function () {
    const gasLimit = coin.setGasLimit();
    gasLimit.should.equal(800000);
  });

  it('should accept user-provided gas limit', function () {
    const gasLimit = coin.setGasLimit(1000000);
    gasLimit.should.equal(1000000);
  });
});
