import { fixedScriptWallet, zcashAddress } from '@bitgo/wasm-utxo';

import { getReplayProtectionPubkeys } from '../../transaction/fixedScript/replayProtection';

import { ZcashCoinName, UnifiedRecipientPreference } from './types';

/**
 * How a recipient parsed from a Zcash PSBT is spent.
 *
 * The decode-side counterpart of utxo-core's `buildTransaction/zcash.ts` `ZcashDestination` on
 * the build side: a shielded recipient is an Orchard/Ironwood output stored in the v6 (Ironwood)
 * PSBT's orchard PCZT, and everything else is an ordinary transparent output. A transparent
 * output resolved from a Unified Address carries that original UA (`zcashUnifiedTransparent`), a
 * plain address does not.
 */
export type PsbtRecipientDestination =
  | {
      kind: 'zcashShielded';
      /**
       * The Unified Address the output was addressed to — the original multi-receiver UA the
       * client passed when the PSBT stores one verbatim, otherwise a re-encoded single-receiver
       * Orchard UA.
       */
      unifiedAddress: string;
    }
  | {
      kind: 'zcashUnifiedTransparent';
      /** The original Unified Address the transparent receiver was resolved from. */
      unifiedAddress: string;
    }
  | { kind: 'transparent' };

/** A recipient resolved from a decoded Zcash PSBT's external outputs. */
export interface PsbtRecipient {
  /** Amount in satoshis. */
  amount: bigint;
  /**
   * The recipient address. For a shielded output this is the Unified Address the output was
   * addressed to — the original multi-receiver UA when the PSBT stores one verbatim, otherwise a
   * re-encoded single-receiver Orchard UA. For a transparent output it is the original Unified
   * Address when one was stored, else the decoded transparent address.
   */
  address: string;
  /**
   * Raw receiver bytes: the 43-byte Orchard/Ironwood receiver for a shielded output, the
   * scriptPubKey for a transparent one.
   */
  script: Uint8Array;
  /**
   * The original Unified Address the client supplied for this recipient, when the PSBT stores
   * one: the v6 (Ironwood) PCZT for a shielded output, the transparent-output proprietary
   * key-value map for a v4 transparent output. `undefined` when the recipient was built from a
   * plain address.
   */
  unifiedAddress?: string;
  destination: PsbtRecipientDestination;
}

/**
 * Resolve the recipient list of a decoded Zcash PSBT (v4 Sapling-shaped or v6 Ironwood).
 *
 * Mirrors the recipient resolution of wallet-platform's utxo-core `buildTransaction` in the
 * decode direction: every non-wallet output with a resolvable address is a recipient. A
 * shielded output parses with `isShielded: true`, its `script` being the raw 43-byte receiver;
 * when the build stored the client's original Unified Address (the v6 PCZT for shielded
 * outputs, the transparent-output proprietary key-value map for v4), both the parsed address
 * and `unifiedAddress` report it verbatim. Opaque outputs with no address (e.g. OP_RETURN) are
 * skipped, as they carry no recipient.
 */
export function resolvePsbtRecipients(
  psbt: fixedScriptWallet.ZcashBitGoPsbt,
  walletKeys: fixedScriptWallet.RootWalletKeys
): PsbtRecipient[] {
  const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, {
    replayProtection: { publicKeys: getReplayProtectionPubkeys('zec') },
  });

  const recipients: PsbtRecipient[] = [];
  parsed.outputs.forEach((output, i) => {
    // Wallet-owned (change) outputs.
    if (output.scriptId !== null) {
      return;
    }
    // Opaque outputs (e.g. OP_RETURN) carry no recipient address.
    if (output.address === null) {
      return;
    }
    // The original client-passed Unified Address, stored verbatim in the PSBT's key-value
    // pairs: the orchard PCZT for a shielded output (parsed `address` reports it in full), the
    // transparent-output proprietary map for a v4 transparent output.
    const unifiedAddress = output.isShielded ? output.address : psbt.transparentOutputUnifiedAddress(i) ?? undefined;
    recipients.push({
      amount: output.value,
      address: output.address,
      script: output.script,
      unifiedAddress,
      destination: output.isShielded
        ? { kind: 'zcashShielded', unifiedAddress: output.address }
        : unifiedAddress
        ? { kind: 'zcashUnifiedTransparent', unifiedAddress }
        : { kind: 'transparent' },
    });
  });
  return recipients;
}

/**
 * Infer the Unified-Address recipient preference for a Zcash transaction when the caller did
 * not pass one — the counterpart of wallet-platform's utxo-core `buildTransaction`
 * `classifyRecipientShieldedness`.
 *
 * A recipient that resolves to a transparent output — an ordinary transparent address, or a
 * Unified Address carrying a transparent receiver — is classified `'transparent'`; a Unified
 * Address carrying only an Orchard/Ironwood receiver is classified `'shielded'`. A mix of
 * shielded and transparent recipients is rejected. An address that is neither a transparent
 * address nor a Unified Address propagates the Unified-Address parse error — it is not
 * silently defaulted to `'transparent'`.
 *
 * @returns `'shielded'` when every recipient resolves shielded, `undefined` when every
 *   recipient resolves transparent (the build's default). The `'transparent'` arm of the
 *   return type exists so callers can pass the explicit preference through unchanged; this
 *   function itself never returns `'transparent'`.
 */
export function getUnifiedRecipientPreference(
  name: ZcashCoinName,
  recipients: { address: string | undefined }[]
): UnifiedRecipientPreference | undefined {
  const shieldedness = recipients.map((recipient) => {
    if (recipient.address === undefined) {
      // Raw script inherently transparent.
      return 'transparent' as const;
    }
    // Ordinary transparent address, or a Unified Address carrying a transparent receiver:
    // resolves transparently either way (the build's default when no preference is given).
    if (zcashAddress.hasTransparentReceiver(recipient.address, name)) {
      return 'transparent' as const;
    }
    // A shielded (Orchard/Ironwood-only) Unified Address is the only remaining resolvable
    // form. An address that is none of the above propagates the parse error instead of
    // assuming a default.
    const unified = fixedScriptWallet.ZcashUnifiedAddress.parse(recipient.address, name);
    if (unified.hasOrchardReceiver) {
      return 'shielded' as const;
    }
    throw new Error(`address ${recipient.address} carries no transparent or Orchard receiver`);
  });
  const hasShielded = shieldedness.includes('shielded');
  const hasTransparent = shieldedness.includes('transparent');
  if (hasShielded && hasTransparent) {
    throw new Error('Mixed shielded and transparent recipients are not supported');
  }
  return hasShielded ? 'shielded' : undefined;
}
