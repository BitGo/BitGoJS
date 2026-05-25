/**
 * Unit tests for Erc7984Token.
 *
 * Covers:
 *   - getTokenEnablementConfig
 *   - verifyTransaction (TSS and multisig paths)
 *   - decodeTokenAddressesFromDelegationCalldata (round-trip and forwarder-wrapped)
 */
import should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { TransactionType } from '@bitgo/sdk-core';
import {
  buildMulticallDelegationCalldata,
  wrapInCallFromParent,
  decodeTokenAddressesFromDelegationCalldata,
} from '@bitgo/abstract-eth';
import { Erc7984Token } from '../../src/erc7984Token';
import { TransactionBuilder } from '../../src/lib';
import { getBuilder } from './getBuilder';
import { register } from '../../src/register';

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
    it('should fall through to parent when type is not enabletoken', async function () {
      // The parent verifyTransaction requires recipients, wallet, etc. When we
      // pass a params object with no type, it falls into the parent path and
      // throws with the parent's "missing params" error — confirming the
      // override only intercepts the enabletoken type.
      await coin
        .verifyTransaction({
          txParams: { recipients: [] },
          txPrebuild: {} as any,
          wallet: {} as any,
        })
        .should.be.rejectedWith(/missing params/);
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
