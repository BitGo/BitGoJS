/**
 * Keyless verification of Zcash shielded (Ironwood v6) spend PSBTs built for custodial MPC
 * (RedPallas) wallets.
 *
 * These wallets hold no viewing keys client-side, so nothing here can prove which addresses
 * belong to the wallet. The only change a keyless client can recognize is the parser's
 * `isChange`: an output paying back to the exact address of a note the transaction spends
 * (wallet-platform/IMS always pay change to the first selected note's address). Every other
 * output is a recipient and must match one the caller asked for.
 *
 * Every function here is pure (no wallet, no network), so the same checks run in the online
 * `sendMany` path (`Zec.verifyTransaction`) and in the offline vault console.
 */
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { stringToBufferTryFormats } from '../../transaction/decode';
import type { Output } from '../../transaction/types';
import type { TransactionExplanationShielded } from '../../transaction/fixedScript/explainTransaction';

export type { TransactionExplanationShielded };

import { ZecAddressCodec } from './address';
import type { ZcashCoinName } from './types';

/**
 * ZIP-317 marginal fee (zatoshi per logical action). IMS folds a changeless leftover into the
 * fee only when it cannot pay for its own change output, so a shielded build's fee is at most
 * one marginal fee above the conventional fee. Mirrors wallet-platform's build-time bound.
 */
export const ZIP317_MARGINAL_FEE = 5000n;

export class ShieldedTransactionVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShieldedTransactionVerificationError';
  }
}

function fail(message: string): never {
  throw new ShieldedTransactionVerificationError(message);
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function toBytes(value: string | Uint8Array): Uint8Array {
  return typeof value === 'string' ? new Uint8Array(Buffer.from(value, 'hex')) : value;
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    const code = 'code' in e && typeof e.code === 'string' ? ` (${e.code})` : '';
    return `${e.message}${code}`;
  }
  return String(e);
}

export type ShieldedTxInput = string | Uint8Array;

/** Decode a v6 (Ironwood) Zcash PSBT from hex, base64 or raw bytes. */
export function decodeShieldedPsbt(
  tx: ShieldedTxInput,
  coinName: ZcashCoinName
): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
  const bytes = typeof tx === 'string' ? stringToBufferTryFormats(tx, ['hex', 'base64']) : tx;
  try {
    return fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(new Uint8Array(bytes), coinName);
  } catch (e) {
    return fail(`not a Zcash Ironwood (v6) PSBT: ${errorMessage(e)}`);
  }
}

/**
 * Whether `tx` decodes as a v6 (Ironwood) PSBT carrying shielded spends — the shape of every
 * custodial MPC (RedPallas) shielded transaction.
 */
export function isShieldedSpendPsbt(tx: ShieldedTxInput, coinName: ZcashCoinName): boolean {
  try {
    parseShieldedSpendPsbt(decodeShieldedPsbt(tx, coinName));
    return true;
  } catch {
    return false;
  }
}

/**
 * Keyless parse of a shielded spend PSBT. The parse runs the key-free bundle verifier first,
 * so a tampered bundle (value balance, note commitments, anchor, ...) throws.
 *
 * @throws ShieldedTransactionVerificationError when the bundle fails verification or the PSBT
 *   spends no shielded notes (a RedPallas wallet never has transparent inputs).
 */
export function parseShieldedSpendPsbt(
  psbt: fixedScriptWallet.ZcashIronwoodBitGoPsbt
): fixedScriptWallet.ZcashShieldedParsedTransaction {
  let parsed: fixedScriptWallet.ZcashShieldedParsedTransaction;
  try {
    parsed = psbt.parseShieldedTransaction();
  } catch (e) {
    return fail(`shielded transaction failed keyless verification: ${errorMessage(e)}`);
  }
  if (parsed.shieldedSpends.length === 0) {
    fail('shielded transaction spends no shielded notes');
  }
  return parsed;
}

/**
 * The fee MUST lie within [ZIP-317 conventional fee, conventional + one marginal fee] — the
 * same bound wallet-platform enforces at build time. Without it a builder could shrink the
 * change and burn the difference as fee while every output check still passes.
 */
export function assertShieldedFeeWithinZip317Bounds(psbt: fixedScriptWallet.ZcashIronwoodBitGoPsbt, fee: bigint): void {
  const conventionalFee = psbt.zip317ConventionalFee();
  if (fee < conventionalFee || fee > conventionalFee + ZIP317_MARGINAL_FEE) {
    fail(
      `shielded transaction fee ${fee} is outside the ZIP-317 bounds [${conventionalFee}, ${
        conventionalFee + ZIP317_MARGINAL_FEE
      }]`
    );
  }
}

export type ShieldedRecipient = { address: string; amount: string | number | bigint };

/**
 * Every requested recipient must consume exactly one output paying its receiver its exact
 * amount; every output left over must be parser-marked change.
 *
 * Recipients are matched first, against every output: a recipient paying back to a spent
 * note's own address (a note split) is parser-marked change yet is still a requested
 * recipient.
 */
export function assertShieldedOutputsMatchRecipients(
  outputs: fixedScriptWallet.ZcashIronwoodParsedOutput[],
  recipients: ShieldedRecipient[],
  coinName: ZcashCoinName
): void {
  const codec = new ZecAddressCodec(coinName, coinName);
  const remaining = [...outputs];
  for (const recipient of recipients) {
    if (!recipient.address) {
      fail('recipient address is required to verify a shielded transaction');
    }
    let value: bigint;
    try {
      value = BigInt(recipient.amount);
    } catch {
      return fail(`invalid recipient amount ${recipient.amount}`);
    }
    const index = remaining.findIndex(
      (output) =>
        output.value === value &&
        codec.isMatchingScript({ address: recipient.address, script: output.script, isShielded: output.isShielded })
    );
    if (index === -1) {
      fail(`expected output missing in shielded transaction: ${recipient.address} ${value}`);
    }
    remaining.splice(index, 1);
  }
  const external = remaining.filter((output) => !output.isChange);
  if (external.length > 0) {
    fail(
      `shielded transaction pays unintended external recipients: ${external
        .map((output) => `${output.address ?? toHex(output.script)} ${output.value}`)
        .join(', ')}`
    );
  }
}

/**
 * Full intent check of a shielded spend prebuild (the online `sendMany` path): keyless parse +
 * bundle verification, recipients, change and fee.
 */
export function verifyShieldedSpendAgainstRecipients(
  tx: ShieldedTxInput,
  recipients: ShieldedRecipient[],
  coinName: ZcashCoinName
): fixedScriptWallet.ZcashShieldedParsedTransaction {
  const psbt = decodeShieldedPsbt(tx, coinName);
  const parsed = parseShieldedSpendPsbt(psbt);
  assertShieldedOutputsMatchRecipients(parsed.outputs, recipients, coinName);
  assertShieldedFeeWithinZip317Bounds(psbt, parsed.fee);
  return parsed;
}

function outputAddress(output: fixedScriptWallet.ZcashIronwoodParsedOutput): string {
  return output.address ?? `scriptPubKey:${toHex(output.script)}`;
}

/**
 * Explain a shielded spend PSBT without wallet keys: parser-marked change outputs go to
 * `changeOutputs`, every other output to `outputs`.
 */
export function explainShieldedSpendPsbt(
  psbt: fixedScriptWallet.ZcashIronwoodBitGoPsbt
): TransactionExplanationShielded {
  const parsed = parseShieldedSpendPsbt(psbt);
  const toOutput = (output: fixedScriptWallet.ZcashIronwoodParsedOutput, external: boolean): Output => ({
    address: outputAddress(output),
    amount: output.value.toString(),
    external,
  });
  const outputs = parsed.outputs.filter((output) => !output.isChange).map((output) => toOutput(output, true));
  const changeOutputs = parsed.outputs.filter((output) => output.isChange).map((output) => toOutput(output, false));
  const sum = (values: bigint[]) => values.reduce((acc, v) => acc + v, 0n);
  const inputAmount = sum(parsed.shieldedSpends.map((spend) => spend.value));
  let id = '';
  try {
    id = psbt.getId();
  } catch {
    // The txid is display-only; it may be unavailable before the proof is combined.
  }
  return {
    id,
    inputs: parsed.shieldedSpends.map((spend) => ({ address: spend.address, value: spend.value.toString() })),
    inputAmount: inputAmount.toString(),
    outputs,
    changeOutputs,
    outputAmount: sum(parsed.outputs.filter((o) => !o.isChange).map((o) => o.value)).toString(),
    changeAmount: sum(parsed.outputs.filter((o) => o.isChange).map((o) => o.value)).toString(),
    fee: parsed.fee.toString(),
    shieldedSpends: parsed.shieldedSpends.map((spend) => ({
      actionIndex: spend.actionIndex,
      address: spend.address,
      value: spend.value.toString(),
      nullifier: toHex(spend.nullifier),
    })),
  };
}

export type ShieldedRk = { actionIndex: number; rk: string | Uint8Array };

/**
 * The spend sighash (hex) of `originalTx` once `rks` are installed — exactly what
 * wallet-platform's post-rerand rebuild computes (`addSpendRks` + `spendSighash`).
 */
export function computeShieldedSpendSighash(
  originalTx: ShieldedTxInput,
  rks: ShieldedRk[],
  coinName: ZcashCoinName
): string {
  const psbt = decodeShieldedPsbt(originalTx, coinName);
  try {
    psbt.addSpendRks(rks.map(({ actionIndex, rk }) => ({ actionIndex, rk: toBytes(rk) })));
    return toHex(psbt.spendSighash());
  } catch (e) {
    return fail(`failed to install rerandomized keys on the shielded transaction: ${errorMessage(e)}`);
  }
}

/**
 * Resolve which action each of the signer's own rerandomized keys was installed at in the
 * rebuilt PSBT, without trusting any server-side spend → action mapping: each rk must be
 * installed at exactly one real spend, and every real spend must carry exactly one of them.
 */
export function resolveInstalledShieldedRks(
  rebuiltPsbt: fixedScriptWallet.ZcashIronwoodBitGoPsbt,
  rks: Array<string | Uint8Array>
): ShieldedRk[] {
  const spendActionIndices = parseShieldedSpendPsbt(rebuiltPsbt).shieldedSpends.map((spend) => spend.actionIndex);
  if (spendActionIndices.length !== rks.length) {
    fail(
      `rebuilt shielded transaction has ${spendActionIndices.length} spends but ${rks.length} rerandomized keys were produced`
    );
  }
  const unclaimed = new Set(spendActionIndices);
  return rks.map((rk, spendIndex) => {
    const rkBytes = toBytes(rk);
    const matches = [...unclaimed].filter((actionIndex) => {
      try {
        rebuiltPsbt.verifyShieldedBundle({ rks: [{ actionIndex, rk: rkBytes }] });
        return true;
      } catch {
        return false;
      }
    });
    if (matches.length !== 1) {
      fail(`rerandomized key for spend ${spendIndex} is not installed in the rebuilt shielded transaction`);
    }
    unclaimed.delete(matches[0]);
    return { actionIndex: matches[0], rk: rkBytes };
  });
}

/**
 * Offline check of wallet-platform's post-rerand rebuild.
 *
 * After rerand round 2 the platform installs the spends' rerandomized keys (rks) into the
 * PSBT, then replaces `serializedTxHex` with the rk-bearing PSBT and `signableHex` with its
 * spend sighash. Nothing else may change. The DSG signs `signableHex`, and the sighash commits
 * every spend, output, memo, the fee and every rk — so if `signableHex` equals the sighash of
 * the ORIGINAL (reviewed) PSBT with the signer's OWN rks installed, the signature can only
 * authorize the transaction that was reviewed.
 *
 * @param originalTxHex the `serializedTxHex` reviewed before rerand (first trip)
 * @param rebuiltTxHex the post-rerand `serializedTxHex`; the HSM derives its sighash from these
 *   bytes, so it must hash to `signableHex` as well
 * @param signableHex the post-rerand `signableHex` the DSG will sign
 * @param rks the signer's own rerand result `pk` per spend, in spend order
 * @returns the rks with the action index each was installed at
 */
export function assertRebuiltShieldedSignable(params: {
  coinName: ZcashCoinName;
  originalTxHex: ShieldedTxInput;
  rebuiltTxHex: ShieldedTxInput;
  signableHex: string;
  rks: Array<string | Uint8Array>;
}): ShieldedRk[] {
  const { coinName, signableHex } = params;
  const expectedSignableHex = signableHex.toLowerCase();

  const original = decodeShieldedPsbt(params.originalTxHex, coinName);
  const originalParsed = parseShieldedSpendPsbt(original);
  const rebuilt = decodeShieldedPsbt(params.rebuiltTxHex, coinName);
  const installedRks = resolveInstalledShieldedRks(rebuilt, params.rks);

  if (originalParsed.shieldedSpends.length !== installedRks.length) {
    fail('rebuilt shielded transaction spends a different number of notes than the reviewed transaction');
  }

  if (computeShieldedSpendSighash(params.originalTxHex, installedRks, coinName) !== expectedSignableHex) {
    fail('rebuilt signable does not commit to the reviewed shielded transaction');
  }

  let rebuiltSighash: string;
  try {
    rebuiltSighash = toHex(rebuilt.spendSighash());
  } catch (e) {
    return fail(`rebuilt shielded transaction has no spend sighash: ${errorMessage(e)}`);
  }
  if (rebuiltSighash !== expectedSignableHex) {
    fail('rebuilt serialized transaction does not match the rebuilt signable');
  }
  return installedRks;
}
