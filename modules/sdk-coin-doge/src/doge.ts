import {
  AbstractUtxoCoin,
  SignTransactionOptions,
  ExplainTransactionOptions,
  TransactionExplanation,
  UtxoNetwork,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyTransactionOptions,
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  RecoverFromWrongChainOptions,
  UnspentJSON,
} from '@bitgo/abstract-utxo';
import { BaseCoin, BitGoBase, HalfSignedUtxoTransaction, SignedTransaction } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

type Unspent<TNumber extends number | bigint = number> = utxolib.bitgo.Unspent<TNumber>;

export class Doge extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dogecoin, 'bigint');
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Doge(bitgo);
  }

  getChain(): string {
    return 'doge';
  }

  getFamily(): string {
    return 'doge';
  }

  getFullName(): string {
    return 'Dogecoin';
  }

  supportsBlockTarget(): boolean {
    return true;
  }

  /* amountType is set in constructor. Functions below override the default TNumber of AbstractUtxoCoin to bigint */

  /* postProcessPrebuild, isBitGoTaintedUnspent, verifyCustomChangeKeySignatures do not care whether they receive number or bigint */

  createTransactionFromHex<TNumber extends number | bigint = bigint>(
    hex: string
  ): utxolib.bitgo.UtxoTransaction<TNumber> {
    return super.createTransactionFromHex<TNumber>(hex);
  }

  async parseTransaction<TNumber extends number | bigint = bigint>(
    params: ParseTransactionOptions<TNumber>
  ): Promise<ParsedTransaction<TNumber>> {
    return super.parseTransaction<TNumber>(params);
  }

  async verifyTransaction<TNumber extends number | bigint = bigint>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    return super.verifyTransaction<TNumber>(params);
  }

  async signTransaction<TNumber extends number | bigint = bigint>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    return super.signTransaction(params);
  }

  async explainTransaction<TNumber extends number | bigint = bigint>(
    params: ExplainTransactionOptions<TNumber>
  ): Promise<TransactionExplanation> {
    return super.explainTransaction(params);
  }

  async recoverFromWrongChain<TNumber extends number | bigint = bigint>(
    params: RecoverFromWrongChainOptions
  ): Promise<CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>> {
    return super.recoverFromWrongChain(params);
  }

  parseUnspents(unspents: UnspentJSON[]): Unspent<number | bigint>[] {
    return unspents?.map((unspent) => {
      return { ...unspent, value: utxolib.bitgo.toTNumber(unspent.valueString, 'bigint') };
    });
  }
}
