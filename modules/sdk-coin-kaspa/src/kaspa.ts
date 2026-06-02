import { coins } from '@bitgo/statics';
import {
  AuditDecryptedKeyParams,
  BitGoBase,
  IWallet,
  InvalidAddressError,
  InvalidTransactionError,
  KeyPair as IKeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  SignedTransaction,
  UnexpectedAddressError,
  VerifyAddressOptions,
} from '@bitgo/sdk-core';
import {
  AbstractUtxoCoin,
  ExplainTransactionOptions,
  ParseTransactionOptions,
  SignTransactionOptions,
  TransactionPrebuild,
  UtxoCoinName,
  UtxoCoinNameMainnet,
  transaction,
} from '@bitgo/abstract-utxo';
import * as KaspaLib from './lib';
import { KaspaSignTransactionOptions, KaspaVerifyTransactionOptions } from './lib/iface';
import { isValidKaspaAddress } from './lib/utils';

export abstract class AbstractKaspaLikeCoin extends AbstractUtxoCoin {
  /**
   * Kaspa has no utxo-lib network entry. This deprecated getter is overridden
   * to prevent accidental usage of the Bitcoin PSBT signing stack.
   */
  get network(): never {
    throw new Error(`${this.getChain()} does not have a utxo-lib network entry`);
  }

  /**
   * Kaspa family name is 'kas' for both mainnet and testnet.
   * Override avoids going through names.ts which only knows Bitcoin-family coins.
   * The cast is required because UtxoCoinNameMainnet is a closed union of Bitcoin-family coins;
   * Kaspa manages its own network stack and is intentionally outside that union.
   */
  getFamily(): UtxoCoinNameMainnet {
    return 'kas' as unknown as UtxoCoinNameMainnet;
  }

  /**
   * Human-readable name for this coin variant.
   * Implemented in each concrete class to avoid runtime name comparisons.
   */
  abstract getFullName(): string;

  /**
   * Whether this is a mainnet or testnet coin.
   * Implemented in each concrete class to avoid runtime name comparisons.
   */
  protected abstract isMainnet(): boolean;

  supportsBlockTarget(): boolean {
    return false;
  }

  /**
   * Return the base factor (sompi per KASPA).
   * 1 KASPA = 100,000,000 sompi (8 decimal places)
   */
  getBaseFactor(): number {
    return 1e8;
  }

  /** @inheritDoc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  /**
   * Validate a Kaspa address.
   */
  isValidAddress(address: string): boolean {
    return isValidKaspaAddress(address);
  }

  /**
   * Validate a public key (secp256k1 compressed or uncompressed).
   */
  isValidPub(pub: string): boolean {
    try {
      new KaspaLib.KeyPair({ pub });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a private key.
   */
  isValidPrv(prv: string): boolean {
    try {
      new KaspaLib.KeyPair({ prv });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a Kaspa key pair.
   */
  generateKeyPair(seed?: Buffer): { pub: string; prv: string } {
    const keyPair = seed ? new KaspaLib.KeyPair({ seed }) : new KaspaLib.KeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    if (!keys.pub) {
      throw new Error('Missing pub in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Check if address belongs to wallet by deriving from keychains.
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, keychains } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }

    const networkType = (this.name as string) === 'kas' ? 'mainnet' : 'testnet';
    const derivedAddress = new KaspaLib.KeyPair({ pub: keychains[0].pub }).getAddress(networkType);

    if (derivedAddress !== address) {
      throw new UnexpectedAddressError(`address validation failure: ${address} is not of this wallet`);
    }

    return true;
  }

  private getBuilder(): KaspaLib.TransactionBuilderFactory {
    return new KaspaLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Parse a Kaspa transaction from prebuild.
   * Overrides AbstractUtxoCoin's PSBT-based implementation with Kaspa's JSON-hex format.
   */
  async parseTransaction<TNumber extends number | bigint = number>(
    params: ParseTransactionOptions<TNumber>
  ): Promise<transaction.ParsedTransaction<TNumber>> {
    const anyParams = params as unknown as { txHex?: string; halfSigned?: { txHex?: string } };
    const txHex = anyParams.txHex ?? anyParams.halfSigned?.txHex;
    if (!txHex) {
      return {} as transaction.ParsedTransaction<TNumber>;
    }
    let tx: KaspaLib.Transaction;
    try {
      const txBuilder = this.getBuilder().from(txHex);
      tx = (await txBuilder.build()) as KaspaLib.Transaction;
    } catch (e) {
      throw new InvalidTransactionError(`Invalid transaction: ${(e as Error).message}`);
    }
    const coin = this.getChain();
    return {
      inputs: tx.txData.inputs.map((input) => ({
        amount: input.amount,
        coin,
      })),
      outputs: tx.txData.outputs.map((output) => ({
        address: output.address,
        amount: output.amount,
        coin,
      })),
    } as unknown as transaction.ParsedTransaction<TNumber>;
  }

  /**
   * Verify a Kaspa transaction against expected params.
   */
  async verifyTransaction(params: KaspaVerifyTransactionOptions): Promise<boolean> {
    const txHex = params.txPrebuild?.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }

    let tx: KaspaLib.Transaction;
    try {
      const txBuilder = this.getBuilder().from(txHex);
      tx = (await txBuilder.build()) as KaspaLib.Transaction;
    } catch (error) {
      throw new InvalidTransactionError(`Invalid transaction: ${(error as Error).message}`);
    }

    const explainedTx = tx.explainTransaction();

    if (params.txParams.recipients) {
      const recipientCount = params.txParams.recipients.length;
      if (explainedTx.outputs.length < recipientCount) {
        throw new Error(`Expected at least ${recipientCount} outputs, transaction had ${explainedTx.outputs.length}`);
      }
    }

    return true;
  }

  /**
   * Explain a Kaspa transaction.
   * Overrides AbstractUtxoCoin's PSBT-based implementation with Kaspa's JSON-hex format.
   * The return type cast is necessary because Kaspa uses a custom TransactionExplanation
   * that doesn't include Bitcoin-specific fields (chain, index) on outputs.
   */
  async explainTransaction<TNumber extends number | bigint = number>(
    params: ExplainTransactionOptions<TNumber>,
    _wallet?: IWallet
  ): Promise<Awaited<ReturnType<AbstractUtxoCoin['explainTransaction']>>> {
    const anyParams = params as unknown as { txHex?: string; halfSigned?: { txHex?: string } };
    const txHex = anyParams.txHex ?? anyParams.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('missing transaction hex');
    }
    try {
      const txBuilder = this.getBuilder().from(txHex);
      const tx = (await txBuilder.build()) as KaspaLib.Transaction;
      return tx.explainTransaction() as unknown as Awaited<ReturnType<AbstractUtxoCoin['explainTransaction']>>;
    } catch (e) {
      throw new InvalidTransactionError(`Invalid transaction: ${(e as Error).message}`);
    }
  }

  /**
   * Sign a Kaspa transaction using secp256k1 Schnorr signatures.
   *
   * Kaspa is a UTXO coin: every input has its own sighash.
   * Two signing paths are supported:
   *
   * Path A — `params.prv` (direct key, test / non-TSS):
   *   Calls `tx.sign(prv)` which loops every input and produces a Schnorr
   *   signature for each one in a single call.
   *
   * Path B — `params.signatures` (TSS multi-input):
   *   The caller already ran one independent DKLS session per input, using
   *   `tx.signablePayloads[i]` as the message for session i.  Each resulting
   *   signature is applied to its input via `addSignatureForInput`.
   *
   *   Platform flow:
   *     1. Build tx, read `(tx as Transaction).signablePayloads` → Buffer[N]
   *     2. Run N DKLS sessions in parallel, one per sighash
   *     3. Call signTransaction({ signatures: [{ inputIndex, pubKey, signature }, ...] })
   */
  async signTransaction<TNumber extends number | bigint = number>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction> {
    const kaspaParams = params as unknown as KaspaSignTransactionOptions;
    const txHex = kaspaParams.txPrebuild?.txHex;
    if (!txHex) {
      throw new InvalidTransactionError('missing txHex in txPrebuild');
    }

    const txBuilder = this.getBuilder().from(txHex);
    const tx = (await txBuilder.build()) as KaspaLib.Transaction;

    if (kaspaParams.prv) {
      // Path A: direct private-key signing — correct for all inputs at once.
      const privKeyBuffer = Buffer.from(kaspaParams.prv.slice(0, 64), 'hex');
      tx.sign(privKeyBuffer);
    } else if (kaspaParams.signatures && kaspaParams.signatures.length > 0) {
      // Path B: TSS multi-input — apply each externally-computed per-input signature.
      // Each signature MUST have been produced over signablePayloads[inputIndex],
      // i.e. the sighash that commits specifically to that input's index.
      // Applying a signature produced over a different message will be rejected
      // by the Kaspa node's script engine.
      for (const { inputIndex, pubKey, signature } of kaspaParams.signatures) {
        tx.addSignatureForInput(inputIndex, pubKey, Buffer.from(signature, 'hex'));
      }
    }

    const inputCount = tx.txData.inputs.length;
    const sigCount = tx.signature.filter((s) => s.length > 0).length;
    const signedHex = tx.toHex();

    return inputCount > 0 && sigCount >= inputCount ? { txHex: signedHex } : { halfSigned: { txHex: signedHex } };
  }

  /**
   * Kaspa's txHex is already the custom JSON-hex format — skip the PSBT
   * re-encode that AbstractUtxoCoin.postProcessPrebuild would otherwise apply.
   */
  async postProcessPrebuild<TNumber extends number | bigint>(
    prebuild: TransactionPrebuild<TNumber>
  ): Promise<TransactionPrebuild<TNumber>> {
    return prebuild;
  }

  async signMessage(_key: IKeyPair, _message: string | Buffer): Promise<Buffer> {
    throw new MethodNotImplementedError();
  }

  /** @inheritDoc */
  auditDecryptedKey(_params: AuditDecryptedKeyParams): void {
    throw new MethodNotImplementedError();
  }

  /**
   * TSS/MPC support: Kaspa uses secp256k1 (Schnorr variant for on-chain,
   * ECDSA for the off-chain TSS ceremony).
   *
   * Kaspa is a UTXO coin with a BIP-143-like per-input sighash scheme.
   * Each input commits to its own index and produces a distinct hash.
   * One independent DKLS signing session is required per input.
   *
   * Correct multi-input TSS flow:
   *   1. Read `tx.signablePayloads` → Buffer[] (one sighash per input).
   *   2. Run one DKLS signing session per sighash IN PARALLEL.
   *   3. Apply each signature: `tx.addSignatureForInput(i, pubKey, sig)`.
   */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}

export class Kaspa extends AbstractKaspaLikeCoin {
  readonly name = 'kas' as UtxoCoinName;

  getFullName(): string {
    return 'Kaspa';
  }

  protected isMainnet(): boolean {
    return true;
  }

  static createInstance(bitgo: BitGoBase): Kaspa {
    return new Kaspa(bitgo);
  }
}

export class Tkaspa extends AbstractKaspaLikeCoin {
  readonly name = 'tkas' as UtxoCoinName;

  getFullName(): string {
    return 'Testnet Kaspa';
  }

  protected isMainnet(): boolean {
    return false;
  }

  static createInstance(bitgo: BitGoBase): Tkaspa {
    return new Tkaspa(bitgo);
  }
}
