/**
 * @prettier
 */
import * as nock from 'nock';
import * as utxolib from '@bitgo/utxo-lib';
import { AbstractUtxoCoin } from '../../../../../../src/v2/coins';
import { LitecointoolsTx, LitecointoolsUnspent } from '../../../../../../src/v2/coins/ltc';
import { PublicUnspent, Unspent } from '../../../../../../src/v2/coins/utxo/unspent';
import { nockBitGo } from './nockBitGo';
import { ExplorerTxInfo } from '../../../../../../src/v2/coins/abstractUtxoCoin';

interface CoinWithRecoveryBlockchainExplorerUrl extends AbstractUtxoCoin {
  recoveryBlockchainExplorerUrl(url: string): string;
}

function nockLitecointools(coin: AbstractUtxoCoin): nock.Scope {
  const url = new URL((coin as CoinWithRecoveryBlockchainExplorerUrl).recoveryBlockchainExplorerUrl(''));
  return nock(url.protocol + '//' + url.host);
}

export function nockLitecointoolsTransaction(
  coin: AbstractUtxoCoin,
  tx: utxolib.bitgo.UtxoTransaction,
  unspents: Unspent[]
): nock.Scope {
  const payload: LitecointoolsTx = {
    vin: unspents.map((u) => ({ addr: u.address })),
    vout: tx.outs.map((o) => ({
      scriptPubKey: {
        addresses: [utxolib.address.fromOutputScript(o.script, coin.network)],
      },
    })),
  };
  return nockLitecointools(coin).get(`/api/tx/${tx.getId()}`).reply(200, payload);
}

export function nockLitecointoolsAddressUnspents(
  coin: AbstractUtxoCoin,
  txid: string,
  address: string,
  outputs: utxolib.TxOutput[]
): nock.Scope {
  const payload: LitecointoolsUnspent[] = outputs
    .map(
      (o, vout): LitecointoolsUnspent => ({
        txid,
        vout,
        address: utxolib.address.fromOutputScript(o.script, coin.network),
        satoshis: o.value,
        height: 1001,
      })
    )
    .filter((u) => u.address === address);
  return nockLitecointools(coin).get(`/api/addrs/${address}/utxo`).reply(200, payload);
}

export function nockBitGoPublicTransaction(
  coin: AbstractUtxoCoin,
  tx: utxolib.bitgo.UtxoTransaction,
  unspents: Unspent[]
): nock.Scope {
  const payload: ExplorerTxInfo = {
    input: unspents.map((u) => ({ address: u.address })),
    outputs: tx.outs.map((o) => ({ address: utxolib.address.fromOutputScript(o.script, coin.network) })),
  };
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/tx/${tx.getId()}`).reply(200, payload);
}

export function nockBitGoPublicAddressUnspents(
  coin: AbstractUtxoCoin,
  txid: string,
  address: string,
  outputs: utxolib.TxOutput[]
): nock.Scope {
  const payload: PublicUnspent[] = outputs.map(
    (o, vout: number): PublicUnspent => ({
      id: `${txid}:${vout}`,
      address: utxolib.address.fromOutputScript(o.script, coin.network),
      value: o.value,
      valueString: String(o.value),
      blockHeight: 1001,
    })
  );
  return nockBitGo().get(`/api/v2/${coin.getChain()}/public/addressUnspents/${address}`).reply(200, payload);
}
