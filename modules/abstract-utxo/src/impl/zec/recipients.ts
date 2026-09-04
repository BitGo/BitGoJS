/**
 * @prettier
 */
import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';

import { getReplayProtectionPubkeys } from '../../transaction/fixedScript/replayProtection';

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
   * plain address (or the single-receiver UA re-encoding is byte-identical for a shielded
   * output).
   */
  unifiedAddress?: string;
  destination: PsbtRecipientDestination;
}

export type ResolvePsbtRecipientsOptions = {
  /**
   * Custom change wallet xpubs, when the transaction spends to a custom change wallet. Outputs
   * matching these keys are classified as change, not recipients — matching how
   * `explainPsbtWasm` treats them.
   */
  customChangeXpubs?: Triple<string>;
};

/**
 * Resolve the recipient list of a decoded Zcash PSBT (v4 Sapling-shaped or v6 Ironwood).
 *
 * Mirrors the recipient resolution of wallet-platform's utxo-core `buildTransaction` in the
 * decode direction: every non-wallet, non-custom-change output with a resolvable address is a
 * recipient. A shielded output parses with `isShielded: true`, its `script` being the raw
 * 43-byte receiver; when the build stored the client's original Unified Address (the v6 PCZT for
 * shielded outputs, the transparent-output proprietary key-value map for v4), both the parsed
 * address and `unifiedAddress` report it verbatim. Opaque outputs with no address (e.g.
 * OP_RETURN) are skipped, as they carry no recipient.
 */
export function resolvePsbtRecipients(
  psbt: fixedScriptWallet.ZcashBitGoPsbt,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  opts: ResolvePsbtRecipientsOptions = {}
): PsbtRecipient[] {
  const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, {
    replayProtection: { publicKeys: getReplayProtectionPubkeys('zec') },
  });
  const customChangeOutputs = opts.customChangeXpubs
    ? psbt.parseOutputsWithWalletKeys(opts.customChangeXpubs)
    : undefined;

  const recipients: PsbtRecipient[] = [];
  parsed.outputs.forEach((output, i) => {
    // Wallet-owned (change) outputs.
    if (output.scriptId !== null) {
      return;
    }
    // Outputs owned by the custom change wallet, if one was supplied.
    if (customChangeOutputs?.[i]?.scriptId != null) {
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
