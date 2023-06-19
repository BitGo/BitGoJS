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
  TransactionInfo,
  TransactionPrebuild,
} from '@bitgo/abstract-utxo';
import { BaseCoin, BitGoBase, HalfSignedUtxoTransaction, SignedTransaction } from '@bitgo/sdk-core';
import { bitgo, networks } from '@bitgo/utxo-lib';

type UnspentJSON = bitgo.Unspent<number> & { valueString: string };
type TransactionInfoJSON = TransactionInfo<number> & { unspents: UnspentJSON[] };
type TransactionPrebuildJSON = TransactionPrebuild<number> & { txInfo: TransactionInfoJSON };

function parseUnspents<TNumber extends number | bigint>(
  unspents: UnspentJSON[] | bitgo.Unspent<TNumber>[]
): bitgo.Unspent<bigint>[] {
  return unspents.map((unspent: bitgo.Unspent<TNumber> | UnspentJSON): bitgo.Unspent<bigint> => {
    if (typeof unspent.value === 'bigint') {
      return unspent as bitgo.Unspent<bigint>;
    }
    if ('valueString' in unspent) {
      return { ...unspent, value: BigInt(unspent.valueString) };
    }
    if (typeof unspent.value === 'number') {
      throw new Error(`received Unspent<number> where Unspent<bigint> or UnspentJSON was expected`);
    }
    throw new Error('invalid unspent');
  });
}

function parseTransactionInfo<TNumber extends number | bigint>(
  txInfo: TransactionInfo<TNumber> | TransactionInfoJSON
): TransactionInfo<bigint> {
  if (txInfo.unspents) {
    return { ...txInfo, unspents: parseUnspents(txInfo.unspents) };
  }
  return { ...txInfo, unspents: undefined };
}

function parseTransactionPrebuild<TNumber extends number | bigint>(
  txPrebuild: TransactionPrebuild<TNumber> | TransactionPrebuildJSON
): TransactionPrebuild<bigint> {
  if (txPrebuild?.txInfo) {
    return { ...txPrebuild, txInfo: parseTransactionInfo(txPrebuild.txInfo) };
  }
  return txPrebuild as TransactionPrebuild<bigint>;
}

export class Doge extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || networks.dogecoin, 'bigint');
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

  createTransactionFromHex<TNumber extends number | bigint = bigint>(hex: string): bitgo.UtxoTransaction<TNumber> {
    return super.createTransactionFromHex<TNumber>(hex);
  }

  async parseTransaction<TNumber extends number | bigint = bigint>(
    params: ParseTransactionOptions<TNumber>
  ): /*
    the actual return type is Promise<ParsedTransaction<bigint>>,
    but the superclass signature currently requires TNumber
     */
  Promise<ParsedTransaction<TNumber>> {
    return (await super.parseTransaction({
      ...params,
      txPrebuild: parseTransactionPrebuild(params.txPrebuild),
    })) as ParsedTransaction<TNumber> /* cast to satisfy superclass signature */;
  }

  async verifyTransaction<TNumber extends number | bigint = bigint>(
    params:
      | VerifyTransactionOptions<TNumber>
      | (VerifyTransactionOptions<TNumber> & { txPrebuild: TransactionPrebuildJSON })
  ): Promise<boolean> {
    return super.verifyTransaction({
      ...params,
      txPrebuild: parseTransactionPrebuild(params.txPrebuild),
    });
  }

  async signTransaction<TNumber extends number | bigint = bigint>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    return super.signTransaction({
      ...params,
      txPrebuild: {
        ...params.txPrebuild,
        txInfo: params.txPrebuild.txInfo === undefined ? undefined : parseTransactionInfo(params.txPrebuild.txInfo),
      },
    });
  }

  async explainTransaction<TNumber extends number | bigint = bigint>(
    params: ExplainTransactionOptions<TNumber> | (ExplainTransactionOptions<TNumber> & { txInfo: TransactionInfoJSON })
  ): Promise<TransactionExplanation> {
    return super.explainTransaction({
      ...params,
      txInfo: params.txInfo ? parseTransactionInfo(params.txInfo as TransactionInfoJSON) : undefined,
    });
  }

  async recoverFromWrongChain<TNumber extends number | bigint = bigint>(
    params: RecoverFromWrongChainOptions
  ): Promise<CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>> {
    return super.recoverFromWrongChain(params);
  }
}
