import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { coins, CoinFeature, EthereumNetwork } from '@bitgo/statics';
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

import { EvmCoin } from '../../src/evmCoin';
import { TransactionBuilder } from '../../src/lib';

/**
 * CECHO-2460 / INFOSEC-671 — the user key share must not sign EVM bytes that were never compared
 * with the intent the caller declared.
 *
 * These cases drive the real signing entries (`EcdsaUtils.signTxRequest` and
 * `EcdsaMPCv2Utils.signTxRequest`), which run the real verifier
 * (`AbstractEthLikeNewCoins.verifyTssTransaction`) on the real transaction hex before the signing
 * round starts, and they only observe whether the signing round was reached. The verifier is not
 * stubbed and the transaction bytes are built by the coin's own transaction builder. The signing
 * round is replaced by a sentinel after verification, so `signingStarted` is decided by the
 * production verifier alone.
 *
 * Three signing materials are covered on `tbaseeth` (Base Sepolia), a shared-SDK EVM chain that
 * carries EIP-1559, so the coin's own `TransactionBuilder` and `getCommon` accept it:
 * - the EIP-1559 typed envelope: `signableHex` is the unsigned typed payload (`0x02 || rlp([...])`
 *   without `v`, `r`, `s`);
 * - the legacy type-0 envelope: the wallet platform can still build a `gasPrice` transaction for an
 *   EIP-1559 chain, and its `signableHex` is the EIP-155 preimage
 *   `rlp([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])`, which ethereumjs cannot
 *   parse (v = chainId), so only `serializedTxHex` describes what the user signs;
 * - `tkavaevm`, a legacy-only shared-SDK chain that additionally forces the serialized-bytes route
 *   through `CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX`.
 *
 * Policy pinned by these cases: any definite mismatch between the bytes and the user intent throws
 * in the single default mode — destination, amount, wrong or unexpected calldata, and a payment
 * declared without recipients. Only a finding the verifier cannot decide locally (an intent type
 * with no validator) warns and lets signing proceed. Whenever the verifier needs the serialized
 * bytes, a missing `serializedTxHex` fails before the signing round instead of verifying a preimage
 * the client cannot compare against anything.
 */

const walletId = '62fe536a6b4cf70007acb48c0e7bb0b0';
const baseAddress = '0x1111111111111111111111111111111111111111';
const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const transferAmount = '1000';
const approveAttackerMax = `0x095ea7b3${attackerAddress.slice(2).padStart(64, '0')}${'f'.repeat(64)}`;
// ERC-20 transfer(recipient, amount): a token function that a native payment must never carry. Its
// inner recipient and amount match the intent, so only the asset mismatch can reject it.
const erc20TransferToRecipient = `0xa9059cbb${recipientAddress.slice(2).padStart(64, '0')}${BigInt(transferAmount)
  .toString(16)
  .padStart(64, '0')}`;
// Minimal signing material: signRequestBase only needs pShare.i === 1, a backupNShare and the
// paillier modulus before it hands the unsigned bytes to verifyTransaction.
const prv = JSON.stringify({ pShare: { i: 1, n: 'paillier-modulus' }, backupNShare: {} });
// MPCv2 takes the user key share as base64; the verifier runs before any share is used.
const mpcv2Prv = Buffer.from('mpcv2-user-key-share').toString('base64');

/** `auto` derives the envelope from the coin's statics features. */
type Envelope = 'auto' | 'eip1559' | 'legacy';
type TssImplementation = 'ecdsa' | 'mpcv2';

interface SigningMaterial {
  /** Broadcast-format unsigned transaction, without the 0x prefix as the wallet platform sends it. */
  serializedTxHex: string;
  /** The preimage the user key share signs: typed envelope or legacy EIP-155 RLP. */
  signableHex: string;
}

interface TxShape {
  to: string;
  value: string;
  data?: string;
}

/** Build the two server-supplied hexes exactly as the wallet platform shapes them. */
const buildSigningMaterial = async (
  chain: string,
  tx: TxShape,
  envelope: Envelope = 'auto'
): Promise<SigningMaterial> => {
  const staticsCoin = coins.get(chain);
  const network = staticsCoin.network as EthereumNetwork;
  const coinSupportsEip1559 = staticsCoin.features.includes(CoinFeature.EIP1559);
  const isEip1559 = envelope === 'auto' ? coinSupportsEip1559 : envelope === 'eip1559';
  const fee = isEip1559
    ? {
        fee: '30000000000',
        gasLimit: '21000',
        eip1559: { maxFeePerGas: '30000000000', maxPriorityFeePerGas: '1000000000' },
      }
    : { fee: '30', gasPrice: '30', gasLimit: '21000' };

  const builder = new TransactionBuilder(staticsCoin);
  builder.type(tx.data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
  builder.fee(fee);
  builder.counter(1);
  builder.contract(tx.to);
  if (tx.data) {
    builder.data(tx.data);
  }
  builder.value(tx.value);

  const broadcast = (await builder.build()).toBroadcastFormat();
  const serializedTxHex = broadcast.startsWith('0x') ? broadcast.slice(2) : broadcast;

  const common = getCommon(network);
  if (!coinSupportsEip1559) {
    common.setHardfork(optionalDeps.EthCommon.Hardfork.Petersburg);
  }
  // getMessageToSign(false) is the signing preimage: the unsigned typed payload for EIP-1559, and
  // [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0] for a legacy EIP-155 transaction.
  let signableHex: string;
  if (isEip1559) {
    const typedTx = optionalDeps.EthTx.FeeMarketEIP1559Transaction.fromSerializedTx(
      Buffer.from(serializedTxHex, 'hex'),
      { common }
    );
    signableHex = typedTx.getMessageToSign(false).toString('hex');
  } else {
    const legacyTx = optionalDeps.EthTx.Transaction.fromSerializedTx(Buffer.from(serializedTxHex, 'hex'), { common });
    signableHex = Buffer.from(optionalDeps.ethUtil.rlp.encode(legacyTx.getMessageToSign(false))).toString('hex');
  }

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
  chain: string;
  material: SigningMaterial;
  txParams?: TransactionParams;
  intent?: PopulatedIntent;
  implementation?: TssImplementation;
  /** Drop the broadcast bytes, as a tampered or legacy server response can. */
  omitSerializedTxHex?: boolean;
}): Promise<SignOutcome> => {
  const implementation = opts.implementation ?? 'ecdsa';
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.safeRegister(opts.chain, EvmCoin.createInstance);
  bitgo.initializeTestVars();

  const coin = bitgo.coin(opts.chain);
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
          ...(opts.omitSerializedTxHex ? {} : { serializedTxHex: opts.material.serializedTxHex }),
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

/**
 * The intent as the wallet platform stores it on a tx request. `symbol` is the chain symbol the
 * platform labels the amount with; it may differ from the coin name by case (`TBASEETH`).
 */
const storedIntent = (
  chain: string,
  intentType: string,
  address: string,
  value: string,
  symbol: string = chain
): PopulatedIntent => ({
  intentType,
  recipients: [{ address: { address }, amount: { value, symbol } }],
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

describe('EVM TSS signing path verifies the bytes before signing (CECHO-2460)', function () {
  describe('EIP-1559 typed envelope (tbaseeth)', function () {
    const chain = 'tbaseeth';

    it('signs a caller-declared payment when the typed envelope matches that intent', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      // The fixture is realistic: the preimage is the unsigned typed payload, while the broadcast
      // form the platform stores also carries the empty signature fields the preimage drops.
      material.signableHex.should.not.equal(material.serializedTxHex);

      for (const type of ['transfer', 'payment']) {
        const outcome = await sign({
          chain,
          material,
          txParams: { type, recipients: [{ address: recipientAddress, amount: transferAmount }] },
        });
        expectSigned(outcome);
      }
    });

    it('never starts signing a payment the typed envelope redirects', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('never starts signing a payment the typed envelope inflates', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: '2000' });
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/does not match the value given by client/);
    });

    it('never starts signing a caller-declared payment that declares no recipients', async function () {
      // Without recipients there is nothing to verify the bytes against, and the stored intent is
      // server data: it must not fill the gap and decide the destination the user signs.
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: { type: 'transfer' },
        intent: storedIntent(chain, 'payment', attackerAddress, transferAmount),
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/without recipients/);
    });

    it('signs a stored-intent payment the caller did not re-declare (pending approval)', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'payment', recipientAddress, transferAmount),
      });
      expectSigned(outcome);
    });

    it('never starts signing stored-intent bytes that redirect the payment', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'payment', recipientAddress, transferAmount),
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    });

    it('ignores a stored intent that names another destination when the caller declared its own', async function () {
      // The caller declared the payment; the stored intent is only server data and cannot reroute
      // the caller's own declaration.
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        intent: storedIntent(chain, 'payment', attackerAddress, transferAmount),
      });
      expectSigned(outcome);
    });

    it('never starts signing approve(attacker, MAX) labelled as a payment', async function () {
      // Wrong and unexpected calldata under a payment intent is a definite mismatch: the user
      // asked for a payment, the bytes grant an unlimited allowance.
      const material = await buildSigningMaterial(chain, {
        to: tokenContractAddress,
        value: '0',
        data: approveAttackerMax,
      });
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchError);
    });

    it('never starts signing a stored contractCall intent it has no verifier for', async function () {
      // `contractCall` / `customTx` carry arbitrary calldata with no intent shape to verify against,
      // so they are refused outright instead of being signed unchecked.
      const material = await buildSigningMaterial(chain, {
        to: tokenContractAddress,
        value: '0',
        data: approveAttackerMax,
      });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'contractCall', tokenContractAddress, '0'),
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).message.should.match(/unsupported intent type for EVM TSS: contractCall/);
    });
  });

  describe('legacy type-0 envelope on an EIP-1559 chain (tbaseeth)', function () {
    const chain = 'tbaseeth';
    const envelope: Envelope = 'legacy';

    it('signs a payment whose legacy serialized bytes match the intent', async function () {
      // The wallet platform still builds gasPrice transactions for EIP-1559 chains. Their
      // signableHex is the EIP-155 preimage (v = chainId), which ethereumjs cannot decode, so the
      // verifier has to read the serialized transaction.
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, envelope);
      material.signableHex.should.not.equal(material.serializedTxHex);
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectSigned(outcome);
    });

    it('never starts signing a legacy payment the serialized bytes redirect', async function () {
      // A parse error instead of the recipient mismatch would mean the verifier decoded the
      // EIP-155 preimage rather than the serialized transaction the user is signing.
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount }, envelope);
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('never starts signing legacy bytes the caller declared a different amount for', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: '2000' }, envelope);
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/does not match the value given by client/);
    });

    it('never starts signing a preimage that was not derived from the verified legacy bytes', async function () {
      const benign = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, envelope);
      const attacker = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount }, envelope);
      // Verify the benign bytes, then sign the attacker's preimage.
      const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
      (outcome.error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
    });
  });

  describe('legacy type-0 envelope (tkavaevm)', function () {
    const chain = 'tkavaevm';

    it('signs a payment whose serialized bytes match the intent, and signs the matching preimage', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      // Legacy chains send two different hexes: the broadcast bytes and the EIP-155 preimage.
      material.signableHex.should.not.equal(
        material.serializedTxHex,
        'the preimage and the broadcast bytes must be distinct, as the platform sends them'
      );
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectSigned(outcome);
    });

    it('never starts signing a payment redirected in the serialized bytes', async function () {
      // A parse error instead of the recipient mismatch would mean the verifier decoded the
      // EIP-155 preimage rather than the serialized transaction the user is signing.
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('never starts signing a preimage that was not derived from the verified serialized bytes', async function () {
      const benign = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const attacker = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      // Verify the benign bytes, then sign the attacker's preimage.
      const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
      const outcome = await sign({ chain, material, txParams: callerTransfer(recipientAddress, transferAmount) });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
      (outcome.error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
    });

    it('never starts signing a caller-declared payment that declares no recipients', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: { type: 'transfer' },
        intent: storedIntent(chain, 'payment', attackerAddress, transferAmount),
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/without recipients/);
    });

    it('signs a stored-intent payment the caller did not re-declare (pending approval)', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'payment', recipientAddress, transferAmount),
      });
      expectSigned(outcome);
    });
  });

  describe('stored native intent labelled with an upper-case chain symbol (tbaseeth)', function () {
    const chain = 'tbaseeth';
    // The platform labels a native amount with the chain symbol, which it may upper-case. The
    // recipient resolver must still recognise 'TBASEETH' as this chain's native coin, never as a
    // token of that name: an unresolved asset would leave the payment unverifiable.
    const nativeSymbol = 'TBASEETH';

    it('signs a stored native payment whose amount symbol is upper-cased', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'payment', recipientAddress, transferAmount, nativeSymbol),
      });
      expectSigned(outcome);
    });

    it('never starts signing a token function against a stored native payment', async function () {
      // The intent declares a native amount and the bytes carry ERC-20 transfer(recipient, amount).
      // Its inner recipient and amount match the intent, so the asset mismatch is the only finding.
      const material = await buildSigningMaterial(chain, {
        to: tokenContractAddress,
        value: '0',
        data: erc20TransferToRecipient,
      });
      const outcome = await sign({
        chain,
        material,
        intent: storedIntent(chain, 'payment', recipientAddress, transferAmount, nativeSymbol),
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    });
  });

  describe('missing serialized bytes', function () {
    // A legacy preimage is not a parseable transaction, so the serialized broadcast bytes are the
    // only thing that can be verified against intent. Without them the signing round must never
    // start: verifying a preimage the client cannot compare against anything proves nothing.
    const expectMissingSerializedRejection = (outcome: SignOutcome): void => {
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
      (outcome.error as Error).message.should.match(/serializedTxHex is required/);
    };

    it('never starts ECDSA signing when the legacy preimage has no serialized bytes', async function () {
      const chain = 'tbaseeth';
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, 'legacy');
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        omitSerializedTxHex: true,
      });
      expectMissingSerializedRejection(outcome);
    });

    it('never starts MPCv2 signing when the legacy preimage has no serialized bytes', async function () {
      const chain = 'tbaseeth';
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, 'legacy');
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation: 'mpcv2',
        omitSerializedTxHex: true,
      });
      expectMissingSerializedRejection(outcome);
    });

    it('never starts signing when the coin forces the serialized route and the bytes are absent', async function () {
      // `tkavaevm` declares CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX, so the serialized route is
      // taken from the coin's features rather than from the envelope.
      const chain = 'tkavaevm';
      coins.get(chain).features.should.containEql(CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX);
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        omitSerializedTxHex: true,
      });
      expectMissingSerializedRejection(outcome);
    });
  });

  describe('MPCv2 signing path (tbaseeth)', function () {
    const chain = 'tbaseeth';
    const implementation: TssImplementation = 'mpcv2';

    it('signs a caller-declared payment when the typed envelope matches the intent', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectSigned(outcome);
    });

    it('never starts signing a typed payment the bytes redirect', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('signs a legacy payment whose serialized bytes match the intent', async function () {
      const material = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, 'legacy');
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectSigned(outcome);
    });

    it('never starts signing a legacy payment the bytes redirect', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount }, 'legacy');
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
      (outcome.error as Error).message.should.match(/destination address does not match/);
    });

    it('never starts signing a preimage that was not derived from the verified bytes', async function () {
      const benign = await buildSigningMaterial(chain, { to: recipientAddress, value: transferAmount }, 'legacy');
      const attacker = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount }, 'legacy');
      const material = { serializedTxHex: benign.serializedTxHex, signableHex: attacker.signableHex };
      const outcome = await sign({
        chain,
        material,
        txParams: callerTransfer(recipientAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(InvalidTransactionError);
      (outcome.error as Error).message.should.match(/signableHex is inconsistent with serializedTxHex/);
    });

    it('never starts signing a caller-declared payment that declares no recipients', async function () {
      const material = await buildSigningMaterial(chain, { to: attackerAddress, value: transferAmount });
      const outcome = await sign({
        chain,
        material,
        txParams: { type: 'transfer' },
        intent: storedIntent(chain, 'payment', attackerAddress, transferAmount),
        implementation,
      });
      expectRejectedWithoutSigning(outcome);
      (outcome.error as Error).should.be.instanceOf(TxIntentMismatchRecipientError);
    });
  });
});
