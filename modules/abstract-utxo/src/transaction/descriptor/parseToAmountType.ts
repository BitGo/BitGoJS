import { AbstractUtxoCoin, BaseOutput, BaseParsedTransaction, ParseTransactionOptions } from '../../abstractUtxoCoin';
import { parse, ParsedDescriptorTransaction } from './parse';
import { IDescriptorWallet } from '../../descriptor/descriptorWallet';

type AmountType = 'number' | 'bigint' | 'string';

export function toAmountType(v: number | bigint | string, t: AmountType): number | bigint | string {
  switch (t) {
    case 'number':
      return Number(v);
    case 'bigint':
      return BigInt(v);
    case 'string':
      return String(v);
  }
}

type AmountTypeOptions = {
  amountTypeBaseOutput: AmountType;
  amountTypeAggregate: AmountType;
};

function baseOutputToTNumber<TAmount extends number | bigint>(
  output: BaseOutput<bigint>,
  amountType: AmountType
): BaseOutput<TAmount> {
  return {
    address: output.address,
    amount: toAmountType(output.amount, amountType) as TAmount,
    external: output.external,
  };
}

function entryToTNumber<
  K extends keyof ParsedDescriptorTransaction<bigint>,
  V extends ParsedDescriptorTransaction<bigint>[K]
>(k: K, v: V, params: AmountTypeOptions): [K, V] {
  switch (k) {
    case 'outputs':
    case 'changeOutputs':
    case 'explicitExternalOutputs':
    case 'implicitExternalOutputs':
    case 'missingOutputs':
      if (v === undefined) {
        return [k, v];
      }
      if (Array.isArray(v)) {
        return [k, v.map((o) => baseOutputToTNumber(o, params.amountTypeBaseOutput)) as V];
      }
      throw new Error('expected array');
    case 'explicitExternalSpendAmount':
    case 'implicitExternalSpendAmount':
      if (typeof v !== 'bigint') {
        throw new Error('expected bigint');
      }
      return [k, toAmountType(v, params.amountTypeAggregate) as V];
    default:
      return [k, v];
  }
}

export function parsedDescriptorTransactionToTNumber<TAmount extends number | bigint, TOutput>(
  obj: ParsedDescriptorTransaction<bigint>,
  params: AmountTypeOptions
): BaseParsedTransaction<TAmount, TOutput> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => entryToTNumber(k as keyof ParsedDescriptorTransaction<bigint>, v, params))
  ) as BaseParsedTransaction<TAmount, TOutput>;
}

export function parseToAmountType<TAmount extends number | bigint>(
  coin: AbstractUtxoCoin,
  wallet: IDescriptorWallet,
  params: ParseTransactionOptions<TAmount>
): BaseParsedTransaction<TAmount, BaseOutput<string>> {
  return parsedDescriptorTransactionToTNumber<TAmount, BaseOutput<string>>(parse(coin, wallet, params), {
    amountTypeAggregate: coin.amountType,
    amountTypeBaseOutput: 'string',
  });
}
