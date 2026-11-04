import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { coins, EthereumNetwork } from '@bitgo/statics';
import {
  EcdsaUtils,
  RequestTracer,
  TransactionType,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { getCommon, optionalDeps } from '@bitgo/abstract-eth';

import { EvmCoin } from '../../src/evmCoin';
import { TransactionBuilder } from '../../src/lib';

/**
 * End to end on the ECDSA signing path (CECHO-2460). tssVerification.ts calls verifyTransaction
 * directly; this suite runs the real EVM verifier inside EcdsaUtils.signTxRequest and proves that
 * bytes it rejects never reach the signing round.
 *
 * Legacy (non-EIP-1559) chains carry two different server-supplied hexes: signableHex is the
 * EIP-155 signing preimage `RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])` and
 * serializedTxHex is the broadcast-format unsigned transaction. Only the latter is parseable by
 * ethereumjs, which is why these chains need
 * `CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX`, and why both hexes are built here as the
 * distinct values production sends instead of the same fabricated string.
 */
const legacyChains = ['kavaevm', 'tkavaevm', 'prividiumeth', 'tprividiumeth'];

interface SigningMaterial {
  serializedTxHex: string;
  signableHex: string;
}

const walletId = '62fe536a6b4cf70007acb48c0e7bb0b0';
const baseAddress = '0x1111111111111111111111111111111111111111';
const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const approveAttackerMax = `0x095ea7b3${attackerAddress.slice(2).padStart(64, '0')}${'f'.repeat(64)}`;
// Minimal signing material: signRequestBase only needs pShare.i === 1, a backupNShare and the
// paillier modulus before it hands the unsigned bytes to verifyTransaction.
const prv = JSON.stringify({ pShare: { i: 1, n: 'paillier-modulus' }, backupNShare: {} });

/** Build the two hexes a legacy EVM tx request carries, exactly as the wallet platform shapes them. */
const buildSigningMaterial = async (
  chain: string,
  opts: { to: string; value: string; data?: string }
): Promise<SigningMaterial> => {
  const staticsCoin = coins.get(chain);
  const builder = new TransactionBuilder(staticsCoin);
  builder.type(opts.data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
  builder.fee({ fee: '10', gasLimit: '21000' });
  builder.counter(1);
  builder.contract(opts.to);
  if (opts.data) {
    builder.data(opts.data);
  }
  builder.value(opts.value);
  const broadcast = (await builder.build()).toBroadcastFormat();
  // The wallet platform stores serializedTxHex without the 0x prefix.
  const serializedTxHex = broadcast.startsWith('0x') ? broadcast.slice(2) : broadcast;

  const common = getCommon(staticsCoin.network as EthereumNetwork);
  const legacyTx = optionalDeps.EthTx.Transaction.fromSerializedTx(Buffer.from(serializedTxHex, 'hex'), { common });
  // getMessageToSign(false) appends chainId, 0, 0: the EIP-155 preimage the platform sends as
  // signableHex. ethereumjs rejects it in fromSerializedTx (v = chainId), so it must never be the
  // bytes the verifier decodes.
  const signableHex = Buffer.from(optionalDeps.ethUtil.rlp.encode(legacyTx.getMessageToSign(false))).toString('hex');

  return { serializedTxHex, signableHex };
};

/** Signs through EcdsaUtils and reports whether the signing round (after verification) started. */
const sign = async (opts: {
  chain: string;
  material: SigningMaterial;
  txParams?: Record<string, unknown>;
  strict?: boolean;
}): Promise<{ signingStarted: boolean; error?: Error }> => {
  const staticsCoin = coins.get(opts.chain);
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
    intent: {
      intentType: 'payment',
      recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: opts.chain } }],
    },
    transactions: [
      {
        unsignedTx: {
          derivationPath: 'm/0',
          signableHex: opts.material.signableHex,
          serializedTxHex: opts.material.serializedTxHex,
        },
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

const callerPayment = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };

describe('EVM TSS signing path stops tampered bytes before signing (legacy chains)', function () {
  for (const chain of legacyChains) {
    describe(chain, function () {
      it('signs a payment whose serialized bytes match the intent', async function () {
        const material = await buildSigningMaterial(chain, { to: recipientAddress, value: '1000' });
        material.signableHex.should.not.equal(
          material.serializedTxHex,
          'the preimage and the broadcast bytes must be distinct, as the platform sends them'
        );
        for (const txParams of [undefined, callerPayment]) {
          const { signingStarted, error } = await sign({ chain, material, txParams, strict: true });
          signingStarted.should.equal(true);
          (error as Error).message.should.match(/signing round started/);
        }
      });

      it('never starts signing a redirected payment on the pending-approval path, in either mode', async function () {
        const material = await buildSigningMaterial(chain, { to: attackerAddress, value: '1000' });
        for (const strict of [false, true]) {
          const { signingStarted, error } = await sign({ chain, material, strict });
          signingStarted.should.equal(false);
          (error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
          (error as Error).message.should.match(/destination address does not match/);
        }
      });
    });
  }

  it('never starts signing a preimage that does not match the verified serialized bytes', async function () {
    const chain = 'kavaevm';
    const benign = await buildSigningMaterial(chain, { to: recipientAddress, value: '1000' });
    const attacker = await buildSigningMaterial(chain, { to: attackerAddress, value: '1000' });
    // Verify the benign serialized bytes, then try to sign the attacker's preimage.
    const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
    const { signingStarted, error } = await sign({ chain, material, txParams: callerPayment, strict: true });
    signingStarted.should.equal(false);
    (error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
  });

  it('never starts signing approve(attacker, MAX) labelled as a payment under strictTssVerification', async function () {
    const material = await buildSigningMaterial('kavaevm', {
      to: tokenContractAddress,
      value: '0',
      data: approveAttackerMax,
    });
    const { signingStarted, error } = await sign({ chain: 'kavaevm', material, txParams: callerPayment, strict: true });
    signingStarted.should.equal(false);
    (error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (error as Error).message.should.match(/not a recognized payment shape/);
  });

  it('lets the same bytes reach signing in default mode, as the warn-first rollout agreed', async function () {
    // Pins today's policy so a change to it is deliberate: this flips once strict becomes the default.
    const material = await buildSigningMaterial('kavaevm', {
      to: tokenContractAddress,
      value: '0',
      data: approveAttackerMax,
    });
    const { signingStarted } = await sign({ chain: 'kavaevm', material, txParams: callerPayment });
    signingStarted.should.equal(true);
  });
});
