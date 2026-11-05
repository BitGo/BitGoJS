import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { coins, ContractAddressDefinedToken, EthereumNetwork } from '@bitgo/statics';
import {
  EcdsaMPCv2Utils,
  EcdsaUtils,
  InvalidTransactionError,
  PopulatedIntent,
  RequestTracer,
  TransactionParams,
  TransactionType,
  TxIntentMismatchError,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { getCommon, optionalDeps } from '@bitgo/abstract-eth';

import { BscToken, Tbsc } from '../../src';
import { TransactionBuilder } from '../../src/lib';

/**
 * CECHO-2460 / INFOSEC-671 — the user key share must not sign BSC bytes that were never compared
 * with the intent the caller declared.
 *
 * BSC has no EIP-1559, so it takes the legacy type-0 envelope and the
 * `CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX` branch: the wallet platform sends the unsigned
 * broadcast-format transaction as `serializedTxHex` and the EIP-155 preimage
 * `rlp([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])` as `signableHex`. The verifier
 * must decode the bytes the transaction actually carries (the serialized ones), and the signing
 * round must only be reached with a preimage derived from those same bytes.
 *
 * The cases drive the real signing entries (`EcdsaUtils.signTxRequest` and
 * `EcdsaMPCv2Utils.signTxRequest`), the real verifier and the real transaction builder; the signing
 * round itself is replaced by a sentinel so a rejection can be proven to stop it.
 *
 * Policy pinned by these cases: any definite mismatch between the bytes and the user intent throws
 * in the single default mode — destination, amount, wrong or unexpected calldata, and a payment
 * declared without recipients. Only a finding the verifier cannot decide locally (an intent type
 * with no validator) warns and lets signing proceed.
 */

const walletId = '62fe536a6b4cf70007acb48c0e7bb0b0';
const baseAddress = '0x1111111111111111111111111111111111111111';
const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const transferAmount = '1000';
const approveAttackerMax = `0x095ea7b3${attackerAddress.slice(2).padStart(64, '0')}${'f'.repeat(64)}`;
// Minimal signing material: signRequestBase only needs pShare.i === 1, a backupNShare and the
// paillier modulus before it hands the unsigned bytes to verifyTransaction.
const prv = JSON.stringify({ pShare: { i: 1, n: 'paillier-modulus' }, backupNShare: {} });
// MPCv2 takes the user key share as base64; the verifier runs before any share is used.
const mpcv2Prv = Buffer.from('mpcv2-user-key-share').toString('base64');

/** ERC-20 `transfer(address,uint256)` calldata, encoded without extra test dependencies. */
const encodeErc20Transfer = (to: string, amount: string): string => {
  const address = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
};

interface SigningMaterial {
  /** Broadcast-format unsigned transaction, without the 0x prefix as the wallet platform sends it. */
  serializedTxHex: string;
  /** The EIP-155 preimage the user key share signs. */
  signableHex: string;
}

interface TxShape {
  to: string;
  value: string;
  data?: string;
}

const buildSigningMaterial = async (tx: TxShape): Promise<SigningMaterial> => {
  const staticsCoin = coins.get('tbsc');
  const builder = new TransactionBuilder(staticsCoin);
  builder.type(tx.data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
  builder.fee({ fee: '30', gasPrice: '30', gasLimit: '21000' });
  builder.counter(1);
  builder.contract(tx.to);
  if (tx.data) {
    builder.data(tx.data);
  }
  builder.value(tx.value);

  const broadcast = (await builder.build()).toBroadcastFormat();
  const serializedTxHex = broadcast.startsWith('0x') ? broadcast.slice(2) : broadcast;

  const common = getCommon(staticsCoin.network as EthereumNetwork);
  // BSC never activated EIP-1559; it signs under the petersburg hardfork.
  common.setHardfork(optionalDeps.EthCommon.Hardfork.Petersburg);
  // BSC only ever builds the legacy EIP-155 envelope; its preimage is
  // [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0].
  const legacyTx = optionalDeps.EthTx.Transaction.fromSerializedTx(Buffer.from(serializedTxHex, 'hex'), { common });
  const signableHex = Buffer.from(optionalDeps.ethUtil.rlp.encode(legacyTx.getMessageToSign(false))).toString('hex');

  return { serializedTxHex, signableHex };
};

interface SignOutcome {
  /** True only when execution got past verification and into the signing round. */
  signingStarted: boolean;
  error?: Error;
  /** Whatever the verifier reported through `console.warn` while deciding. */
  warnings: string[];
}

/** Runs the real ECDSA or MPCv2 signing path and reports whether the signing round began. */
const sign = async (opts: {
  material: SigningMaterial;
  txParams?: TransactionParams;
  intent?: PopulatedIntent;
  /** Coin instance the signing request is routed through; defaults to the native tbsc coin. */
  coinName?: string;
  implementation?: 'ecdsa' | 'mpcv2';
}): Promise<SignOutcome> => {
  const implementation = opts.implementation ?? 'ecdsa';
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.safeRegister('tbsc', Tbsc.createInstance);
  BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => bitgo.safeRegister(name, coinConstructor));
  bitgo.initializeTestVars();

  const coin = bitgo.coin(opts.coinName ?? 'tbsc');
  const wallet = new Wallet(bitgo, coin, { id: walletId, coinSpecific: { baseAddress }, multisigType: 'tss' });
  const utils =
    implementation === 'mpcv2' ? new EcdsaMPCv2Utils(bitgo, coin, wallet) : new EcdsaUtils(bitgo, coin, wallet);

  // Replace the first step after verification with a sentinel: reaching it means the verifier let
  // these bytes through to the signing round.
  let signingStarted = false;
  if (implementation === 'mpcv2') {
    const mpcv2 = utils as unknown as {
      pickBitgoPubGpgKeyForSigning: () => Promise<unknown>;
      getMpcv2HashBuffer: () => Buffer;
    };
    // The BitGo GPG key lookup is not the signing round; keep the suite offline.
    mpcv2.pickBitgoPubGpgKeyForSigning = async () => ({});
    mpcv2.getMpcv2HashBuffer = () => {
      signingStarted = true;
      throw new Error('stop: signing round started');
    };
  } else {
    const ecdsa = utils as unknown as { getEcdsaSigningChallenges: () => Promise<never> };
    ecdsa.getEcdsaSigningChallenges = async () => {
      signingStarted = true;
      throw new Error('stop: signing round started');
    };
  }

  // Only the fields the signing path reads are populated; TxRequest carries many server fields.
  const txRequest = {
    txRequestId: 'signing-path',
    apiVersion: 'full',
    walletId,
    intent: opts.intent,
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

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((arg) => String(arg)).join(' '));
  };
  try {
    await utils.signTxRequest({
      txRequest,
      txParams: opts.txParams,
      prv: implementation === 'mpcv2' ? mpcv2Prv : prv,
      reqId: new RequestTracer(),
    });
  } catch (e) {
    return { signingStarted, error: e as Error, warnings };
  } finally {
    console.warn = originalWarn;
  }
  return { signingStarted, warnings };
};

/** The intent as the wallet platform stores it on a tx request. */
const storedIntent = (intentType: string, address: string, value: string): PopulatedIntent => ({
  intentType,
  recipients: [{ address: { address }, amount: { value, symbol: 'tbsc' } }],
});

const callerTransfer = (address: string, amount: string): TransactionParams => ({
  type: 'transfer',
  recipients: [{ address, amount }],
});

const expectRejectedWithoutSigning = (outcome: SignOutcome): void => {
  outcome.signingStarted.should.equal(false, 'the signing round must never start');
  (outcome.error as Error).should.be.instanceOf(Error);
  (outcome.error as Error).message.should.not.match(/signing round started/);
};

const expectSigned = (outcome: SignOutcome): void => {
  outcome.signingStarted.should.equal(true, `expected the signing round to start, got: ${outcome.error?.message}`);
  (outcome.error as Error).message.should.match(/signing round started/);
};

describe('BSC TSS signing path verifies the legacy bytes before signing (CECHO-2460)', function () {
  it('signs a payment whose serialized bytes match the intent, and signs the matching preimage', async function () {
    const material = await buildSigningMaterial({ to: recipientAddress, value: transferAmount });
    // Legacy chains send two different hexes: the broadcast bytes and the EIP-155 preimage.
    material.signableHex.should.not.equal(
      material.serializedTxHex,
      'the preimage and the broadcast bytes must be distinct, as the platform sends them'
    );
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectSigned(outcome);
  });

  it('never starts signing a payment redirected in the serialized bytes', async function () {
    // A parse error instead of the recipient mismatch would mean the verifier decoded the EIP-155
    // preimage (v = chainId) rather than the serialized transaction the user is signing.
    const material = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (outcome.error as Error).message.should.match(/destination address does not match/);
  });

  it('never starts signing a payment the serialized bytes inflate', async function () {
    const material = await buildSigningMaterial({ to: recipientAddress, value: '2000' });
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (outcome.error as Error).message.should.match(/does not match the value given by client/);
  });

  it('never starts signing a preimage that was not derived from the verified serialized bytes', async function () {
    const benign = await buildSigningMaterial({ to: recipientAddress, value: transferAmount });
    const attacker = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
    // Verify the benign bytes, then sign the attacker's preimage.
    const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
    (outcome.error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
  });

  it('never starts signing a caller-declared payment that declares no recipients', async function () {
    // The stored intent is server data: it must not fill the gap and decide the destination.
    const material = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
    const outcome = await sign({
      material,
      txParams: { type: 'transfer' },
      intent: storedIntent('payment', attackerAddress, transferAmount),
    });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (outcome.error as Error).message.should.match(/without recipients/);
  });

  it('signs a stored-intent payment the caller did not re-declare (pending approval)', async function () {
    const material = await buildSigningMaterial({ to: recipientAddress, value: transferAmount });
    const outcome = await sign({ material, intent: storedIntent('payment', recipientAddress, transferAmount) });
    expectSigned(outcome);
  });

  it('never starts signing stored-intent bytes that redirect the payment', async function () {
    const material = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
    const outcome = await sign({ material, intent: storedIntent('payment', recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
  });

  it('verifies the ERC-20 recipient inside the serialized calldata, not just the outer to', async function () {
    const material = await buildSigningMaterial({
      to: tokenContractAddress,
      value: '0',
      data: encodeErc20Transfer(attackerAddress, transferAmount),
    });
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    (outcome.error as Error).message.should.match(/destination address does not match/);
  });

  describe('token coin route (tbsc:usd1)', function () {
    const tokenCoinName = 'tbsc:usd1';
    const tokenStaticsCoin = coins.get(tokenCoinName);
    if (!(tokenStaticsCoin instanceof ContractAddressDefinedToken)) {
      throw new Error(`${tokenCoinName} must be a contract-address token in statics`);
    }
    const tokenContract = String(tokenStaticsCoin.contractAddress);
    const callerTokenTransfer = (address: string, amount: string): TransactionParams => ({
      type: 'transfer',
      recipients: [{ address, amount, tokenName: tokenCoinName }],
    });

    it('signs a token transfer whose serialized calldata matches the declared token and recipient', async function () {
      const material = await buildSigningMaterial({
        to: tokenContract,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, transferAmount),
      });
      const outcome = await sign({
        material,
        txParams: callerTokenTransfer(recipientAddress, transferAmount),
        coinName: tokenCoinName,
      });
      expectSigned(outcome);
    });

    it('never starts signing a token transfer whose calldata recipient is swapped', async function () {
      const material = await buildSigningMaterial({
        to: tokenContract,
        value: '0',
        data: encodeErc20Transfer(attackerAddress, transferAmount),
      });
      const outcome = await sign({
        material,
        txParams: callerTokenTransfer(recipientAddress, transferAmount),
        coinName: tokenCoinName,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });
  });

  it('never starts signing approve(attacker, MAX) labelled as a payment', async function () {
    const material = await buildSigningMaterial({ to: tokenContractAddress, value: '0', data: approveAttackerMax });
    const outcome = await sign({ material, txParams: callerTransfer(recipientAddress, transferAmount) });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).should.be.instanceOf(TxIntentMismatchError);
  });

  it('never starts signing a stored contractCall intent it has no verifier for', async function () {
    // `contractCall` / `customTx` carry arbitrary calldata with no intent shape to verify against,
    // so they are refused outright instead of being signed unchecked.
    const material = await buildSigningMaterial({ to: tokenContractAddress, value: '0', data: approveAttackerMax });
    const outcome = await sign({ material, intent: storedIntent('contractCall', tokenContractAddress, '0') });
    expectRejectedWithoutSigning(outcome);
    (outcome.error as Error).message.should.match(/unsupported intent type for EVM TSS: contractCall/);
  });

  describe('MPCv2 signing path', function () {
    const implementation = 'mpcv2';

    it('signs a payment whose serialized bytes match the intent', async function () {
      const material = await buildSigningMaterial({ to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectSigned(outcome);
    });

    it('never starts signing a payment the serialized bytes redirect', async function () {
      const material = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('never starts signing a preimage that was not derived from the verified bytes', async function () {
      const benign = await buildSigningMaterial({ to: recipientAddress, value: transferAmount });
      const attacker = await buildSigningMaterial({ to: attackerAddress, value: transferAmount });
      const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
      const outcome = await sign({
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
      (outcome.error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
    });
  });
});
