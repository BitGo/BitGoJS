/**
 * @prettier
 */
import * as nock from 'nock';
import * as utxolib from '@bitgo/utxo-lib';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { nockBitGo } from './nockBitGo';

interface ImsUnspent {
  id: string;
  address: string;
  value: number;
  valueString?: string;
}

export function nockBitGoPublicTransaction<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  tx: utxolib.bitgo.UtxoTransaction<TNumber>,
  unspents: { address: string }[]
): nock.Scope {
  const payload = {
    input: unspents.map((u) => ({ address: u.address })),
    outputs: tx.outs.map((o) => ({ address: utxolib.address.fromOutputScript(o.script, coin.network) })),
  };
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/tx/${tx.getId()}`).reply(200, payload);
}

export function nockBitGoPublicAddressUnspents<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  txid: string,
  address: string,
  outputs: utxolib.TxOutput<TNumber>[]
): nock.Scope {
  const payload: ImsUnspent[] = outputs.map(
    (o, vout: number): ImsUnspent => ({
      id: `${txid}:${vout}`,
      address: utxolib.address.fromOutputScript(o.script, coin.network),
      value: Number(o.value),
      valueString: coin.amountType === 'bigint' ? o.value.toString() : undefined,
    })
  );
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/addressUnspents/${address}`).reply(200, payload);
}
