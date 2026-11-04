import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import {
  EcdsaUtils,
  RequestTracer,
  TransactionType,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';

import { EvmCoin } from '../../src/evmCoin';
import { TransactionBuilder } from '../../src/lib';

/**
 * End to end on the ECDSA signing path (CECHO-2460). tssVerification.ts calls verifyTransaction
 * directly; this suite runs the real EVM verifier inside EcdsaUtils.signTxRequest and proves that
 * bytes it rejects never reach the signing round.
 */
describe('EVM TSS signing path stops tampered bytes before signing', function () {
  const chain = 'kavaevm';
  const staticsCoin = coins.get(chain);
  const walletId = '62fe536a6b4cf70007acb48c0e7bb0b0';
  const baseAddress = '0x1111111111111111111111111111111111111111';
  const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const approveAttackerMax = `0x095ea7b3${attackerAddress.slice(2).padStart(64, '0')}${'f'.repeat(64)}`;
  // Minimal signing material: signRequestBase only needs pShare.i === 1, a backupNShare and the
  // paillier modulus before it hands the unsigned bytes to verifyTransaction.
  const prv = JSON.stringify({ pShare: { i: 1, n: 'paillier-modulus' }, backupNShare: {} });
  const paymentIntent = {
    intentType: 'payment',
    recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: chain } }],
  };
  const callerPayment = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };

  const buildTxHex = async (opts: { to: string; value: string; data?: string }): Promise<string> => {
    const builder = new TransactionBuilder(staticsCoin);
    builder.type(opts.data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
    builder.fee({ fee: '10', gasLimit: '21000' });
    builder.counter(1);
    builder.contract(opts.to);
    if (opts.data) {
      builder.data(opts.data);
    }
    builder.value(opts.value);
    return (await builder.build()).toBroadcastFormat();
  };

  /** Signs through EcdsaUtils and reports whether the signing round (after verification) started. */
  const sign = async (opts: {
    txHex: string;
    txParams?: Record<string, unknown>;
    strict?: boolean;
  }): Promise<{ signingStarted: boolean; error?: Error }> => {
    const bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'test',
      strictTssVerification: opts.strict ?? false,
      onVerificationWarning: () => undefined,
    });
    const coin = new (EvmCoin as any)(bitgo, staticsCoin);
    const wallet = new Wallet(bitgo, coin, { id: walletId, coinSpecific: { baseAddress }, multisigType: 'tss' } as any);
    const utils = new EcdsaUtils(bitgo, coin, wallet);
    let signingStarted = false;
    (utils as any).getEcdsaSigningChallenges = async () => {
      signingStarted = true;
      throw new Error('stop: signing round started');
    };
    const txRequest = {
      txRequestId: 'signing-path',
      apiVersion: 'full',
      walletId,
      intent: paymentIntent,
      transactions: [
        {
          unsignedTx: { derivationPath: 'm/0', signableHex: opts.txHex, serializedTxHex: opts.txHex },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;
    try {
      await utils.signTxRequest({ txRequest, txParams: opts.txParams as any, prv, reqId: new RequestTracer() });
    } catch (e) {
      return { signingStarted, error: e as Error };
    }
    return { signingStarted };
  };

  it('reaches the signing round for a payment whose bytes match the intent', async function () {
    const txHex = await buildTxHex({ to: recipientAddress, value: '1000' });
    for (const txParams of [undefined, callerPayment]) {
      const { signingStarted, error } = await sign({ txHex, txParams, strict: true });
      signingStarted.should.equal(true);
      (error as Error).message.should.match(/signing round started/);
    }
  });

  it('never starts signing a redirected payment on the pending-approval path, in either mode', async function () {
    const txHex = await buildTxHex({ to: attackerAddress, value: '1000' });
    for (const strict of [false, true]) {
      const { signingStarted, error } = await sign({ txHex, strict });
      signingStarted.should.equal(false);
      (error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (error as Error).message.should.match(/destination address does not match/);
    }
  });

  it('never starts signing approve(attacker, MAX) labelled as a payment under strictTssVerification', async function () {
    const txHex = await buildTxHex({ to: tokenContractAddress, value: '0', data: approveAttackerMax });
    const { signingStarted, error } = await sign({ txHex, txParams: callerPayment, strict: true });
    signingStarted.should.equal(false);
    (error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (error as Error).message.should.match(/not a recognized payment shape/);
  });

  it('lets the same bytes reach signing in default mode, as the warn-first rollout agreed', async function () {
    // Pins today's policy so a change to it is deliberate: this flips once strict becomes the default.
    const txHex = await buildTxHex({ to: tokenContractAddress, value: '0', data: approveAttackerMax });
    const { signingStarted } = await sign({ txHex, txParams: callerPayment });
    signingStarted.should.equal(true);
  });
});
