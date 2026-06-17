import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { IWallet, TransactionType, TxIntentMismatchRecipientError } from '@bitgo/sdk-core';

import { Bsc, Tbsc } from '../../src/index';
import { getBuilder } from './getBuilder';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

/**
 * Build an unsigned BSC legacy transaction serialised as the hex string that
 * the TSS stack puts in txPrebuild.txHex.
 *
 * In the TSS signing flow, txPrebuild.txHex is the RLP-encoded unsigned
 * transaction — the same value produced by toBroadcastFormat() before the
 * transaction has been signed.  This is what AbstractEthLikeNewCoins.
 * verifyTssTransaction() parses via getTransactionBuilder().from(txHex).
 *
 * Note: toBroadcastFormat() on an unsigned BSC testnet tx yields a legacy
 * RLP-encoded tx with v = 2*97+35 = 229 (EIP-155 chainId placeholder) and
 * r = s = 0.  This is the correct format for parse-and-verify.
 */
async function buildSignableHex(opts: { to: string; data: string; nonce?: number }): Promise<string> {
  const { to, data, nonce = 0 } = opts;
  // Cast to any to access the private setContract method.  This is acceptable in tests
  // where we need full control over the transaction's recipient without going through
  // the higher-level builder APIs (send, transfer, etc.).
  const builder = getBuilder('tbsc') as any;
  builder.type(TransactionType.ContractCall);
  builder.counter(nonce);
  builder.fee({ fee: '1000000000', gasLimit: '100000' });
  builder._contractAddress = to;
  builder.data(data);
  const tx = await builder.build();
  // toBroadcastFormat() returns the RLP-encoded unsigned tx (isSigned=false,
  // v = chainId placeholder).  This is the format consumed by verifyTssTransaction.
  return tx.toBroadcastFormat();
}

/** ABI-encode an address argument as a 32-byte padded hex value (without 0x). */
function abiEncodeAddress(addr: string): string {
  return addr.replace('0x', '').toLowerCase().padStart(64, '0');
}

/** ABI-encode a uint256 argument as a 32-byte padded hex value (without 0x). */
function abiEncodeUint256(value: string): string {
  return BigInt(value).toString(16).padStart(64, '0');
}

/** Build ERC-20 approve(spender, amount) calldata. */
function buildApproveData(spender: string, amount: string): string {
  return `0x095ea7b3${abiEncodeAddress(spender)}${abiEncodeUint256(amount)}`;
}

/** Build ERC-20 transfer(to, amount) calldata. */
function buildTransferData(to: string, amount: string): string {
  return `0xa9059cbb${abiEncodeAddress(to)}${abiEncodeUint256(amount)}`;
}

const TOKEN_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const SPENDER = '0x1111111111111111111111111111111111111111';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const AMOUNT = '1000000000000000000'; // 1e18

describe('Native BNB', function () {
  before(function () {
    bitgo.safeRegister('bsc', Bsc.createInstance);
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for bsc', function () {
      const bsc = bitgo.coin('bsc');

      bsc.should.be.an.instanceof(Bsc);
      bsc.getChain().should.equal('bsc');
      bsc.getFamily().should.equal('bsc');
      bsc.getFullName().should.equal('Native BNB');
      bsc.getBaseFactor().should.equal(1e18);
      bsc.supportsTss().should.equal(true);
      bsc.allowsAccountConsolidations().should.equal(true);
    });

    it('should return the right info for tbsc', function () {
      const tbsc = bitgo.coin('tbsc');

      tbsc.should.be.an.instanceof(Tbsc);
      tbsc.getChain().should.equal('tbsc');
      tbsc.getFamily().should.equal('bsc');
      tbsc.getFullName().should.equal('Testnet Native BNB');
      tbsc.getBaseFactor().should.equal(1e18);
      tbsc.supportsTss().should.equal(true);
      tbsc.allowsAccountConsolidations().should.equal(true);
    });
  });

  // ─── verifyTssTransaction ───────────────────────────────────────────────────
  //
  // BSC no longer has its own verifyTssTransaction override; these tests exercise
  // the parent (AbstractEthLikeNewCoins) implementation via the BSC coin instance.
  //
  // Regression markers:
  //   • Types in NO_RECIPIENT list must still pass without recipients
  //   • 'transfer' deep-comparison behaviour must be unchanged
  //   • 'tokenApproval' and 'transferToken' now require calldata comparison when
  //     recipients are present — these are the WCN-495 security additions
  describe('verifyTssTransaction', function () {
    let coin: Bsc;
    let mockWallet: IWallet;

    before(function () {
      coin = bitgo.coin('tbsc') as Bsc;
      mockWallet = {} as IWallet;
    });

    // ── Structural guard ────────────────────────────────────────────────────

    it('should return true for tokenApproval type without recipients', async function () {
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildApproveData(SPENDER, AMOUNT) });
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'tokenApproval' },
        txPrebuild: { txHex } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('should return true for transferToken type without recipients', async function () {
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildTransferData(RECIPIENT, AMOUNT) });
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'transferToken' },
        txPrebuild: { txHex } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('should return true for consolidate type without recipients', async function () {
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'consolidate' },
        txPrebuild: { txHex: '0x' } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('should return true for bridgeFunds type without recipients', async function () {
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'bridgeFunds' },
        txPrebuild: { txHex: '0x' } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('should throw missing txParams when no recipients and unknown type', async function () {
      await coin
        .verifyTssTransaction({
          txParams: { type: 'unknownType' },
          txPrebuild: { txHex: '0x' } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith('missing txParams');
    });

    it('should throw missing txParams when no recipients and no type', async function () {
      await coin
        .verifyTssTransaction({
          txParams: {},
          txPrebuild: { txHex: '0x' } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith('missing txParams');
    });

    it('should throw missing params when wallet is undefined', async function () {
      await coin
        .verifyTssTransaction({
          txParams: { recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
          txPrebuild: { txHex: '0x' } as any,
          wallet: undefined as any,
        })
        .should.be.rejectedWith('missing params');
    });

    it('should throw for hop + batch transaction', async function () {
      await coin
        .verifyTssTransaction({
          txParams: {
            hop: true,
            recipients: [
              { address: RECIPIENT, amount: AMOUNT },
              { address: SPENDER, amount: AMOUNT },
            ],
          },
          txPrebuild: { txHex: '0x' } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should bypass structural guard when consolidateId is present on txPrebuild', async function () {
      const result = await coin.verifyTssTransaction({
        txParams: {},
        txPrebuild: { txHex: '0x', consolidateId: 'consolidate-1' } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    // ── tokenApproval deep calldata comparison (WCN-495) ───────────────────
    //
    // Regression risk: a compromised server can substitute approve(attacker, MAX_UINT256).
    // These tests confirm that the spender address and allowance are verified against
    // the declared recipients.

    it('tokenApproval: should pass when calldata matches declared spender and amount', async function () {
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildApproveData(SPENDER, AMOUNT) });
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'tokenApproval', recipients: [{ address: SPENDER, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('tokenApproval: should throw TxIntentMismatchRecipientError when spender is substituted', async function () {
      const attackerAddress = '0x9999999999999999999999999999999999999999';
      // Server swaps the spender to attacker address
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildApproveData(attackerAddress, AMOUNT) });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'tokenApproval', recipients: [{ address: SPENDER, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('tokenApproval: should throw TxIntentMismatchRecipientError when allowance is inflated', async function () {
      const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      // Server inflates the allowance to MAX_UINT256
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildApproveData(SPENDER, maxUint256) });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'tokenApproval', recipients: [{ address: SPENDER, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('tokenApproval: should throw TxIntentMismatchRecipientError when calldata uses non-approve selector (fail-closed)', async function () {
      // Server substitutes an ERC-20 transfer call instead of an approve — fail closed
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildTransferData(SPENDER, AMOUNT) });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'tokenApproval', recipients: [{ address: SPENDER, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    // ── transferToken deep calldata comparison (WCN-495) ───────────────────

    it('transferToken: should pass when calldata matches declared recipient and amount', async function () {
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildTransferData(RECIPIENT, AMOUNT) });
      const result = await coin.verifyTssTransaction({
        txParams: { type: 'transferToken', recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
        txPrebuild: { txHex } as any,
        wallet: mockWallet,
      });
      result.should.equal(true);
    });

    it('transferToken: should throw TxIntentMismatchRecipientError when recipient is substituted', async function () {
      const attackerAddress = '0x9999999999999999999999999999999999999999';
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildTransferData(attackerAddress, AMOUNT) });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'transferToken', recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('transferToken: should throw TxIntentMismatchRecipientError when amount is modified', async function () {
      const inflatedAmount = '999999999999999999999';
      const txHex = await buildSignableHex({
        to: TOKEN_CONTRACT,
        data: buildTransferData(RECIPIENT, inflatedAmount),
      });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'transferToken', recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('transferToken: should throw TxIntentMismatchRecipientError when calldata uses non-transfer selector (fail-closed)', async function () {
      // Server substitutes an approve call instead of a transfer — fail closed
      const txHex = await buildSignableHex({ to: TOKEN_CONTRACT, data: buildApproveData(RECIPIENT, AMOUNT) });
      await coin
        .verifyTssTransaction({
          txParams: { type: 'transferToken', recipients: [{ address: RECIPIENT, amount: AMOUNT }] },
          txPrebuild: { txHex } as any,
          wallet: mockWallet,
        })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });
});
