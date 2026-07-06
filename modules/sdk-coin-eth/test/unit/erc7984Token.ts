/**
 * Unit tests for Erc7984Token.
 *
 * Covers:
 *   - getTokenEnablementConfig
 *   - verifyTransaction (TSS and multisig paths)
 *   - verifyTransaction (confidential transfer / SendERC7984 path)
 *   - decodeTokenAddressesFromDelegationCalldata (round-trip and forwarder-wrapped)
 */
import should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { TransactionType, Wallet } from '@bitgo/sdk-core';
import {
  buildMulticallDelegationCalldata,
  buildFlushERC7984ForwarderTokenCalldata,
  sendMultiSigData,
  wrapInCallFromParent,
  decodeTokenAddressesFromDelegationCalldata,
  TransferBuilderERC7984,
} from '@bitgo/abstract-eth';
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

const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a root-wallet delegation tx hex (to = ACL, data = multicall).
 */
async function buildDelegationTxHex(aclAddress: string, tokenAddresses: string[], value = '0'): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(aclAddress);
  const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, tokenAddresses, EXPIRY);
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
  tokenAddresses: string[]
): Promise<string> {
  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(forwarderAddress);
  const innerCalldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, tokenAddresses, EXPIRY);
  const outerCalldata = wrapInCallFromParent(aclAddress, innerCalldata);
  txBuilder.data(outerCalldata);
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
const CONSOLIDATION_FORWARDER = '0xf4bcb366bb5e34ebbee51fae5de98cc876c0146f';
const CONSOLIDATION_BASE_ADDRESS = '0x3b58684525564b38a381e46a731703ed03f32122';
const CONSOLIDATION_HANDLE = '0x65df136b609ab395c1a99ae46f7939c7f8b20dff4bff0000000088bb0050';
const DUMMY_MULTISIG_SIGNATURE = '0x' + '00'.repeat(65);

async function buildMultisigConsolidationTxHex(): Promise<string> {
  const flushCalldata = buildFlushERC7984ForwarderTokenCalldata(
    CTEST1_TOKEN_ADDRESS,
    CONSOLIDATION_BASE_ADDRESS,
    CONSOLIDATION_HANDLE
  );
  const sendData = sendMultiSigData(
    CONSOLIDATION_FORWARDER,
    '0',
    flushCalldata,
    Math.floor(Date.now() / 1000) + 3600,
    14,
    DUMMY_MULTISIG_SIGNATURE
  );

  const txBuilder = getBuilder('hteth') as TransactionBuilder;
  txBuilder.fee({ fee: '1000000000', gasLimit: '12100000' });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.ContractCall);
  txBuilder.contract(MULTISIG_WALLET_CONTRACT);
  txBuilder.data(sendData);
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
});
