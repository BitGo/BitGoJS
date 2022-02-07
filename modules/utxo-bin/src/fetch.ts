import * as utxolib from '@bitgo/utxo-lib';
import * as blockapis from '@bitgo/blockapis';
import { coins, UtxoCoin } from '@bitgo/statics';

function getCoinName(network: utxolib.Network): string {
  const networkName = utxolib.getNetworkName(network);
  const matches = [...coins].flatMap(([, coin]) =>
    coin instanceof UtxoCoin && coin.network.utxolibName === networkName ? [coin] : []
  );
  if (matches.length === 1) {
    return matches[0].name;
  }
  throw new Error(`no coin for network ${networkName}`);
}

function getApi(network: utxolib.Network): blockapis.UtxoApi {
  const coinName = getCoinName(network);
  switch (coinName) {
    case 'btc':
    case 'tbtc':
      return blockapis.BlockstreamApi.forCoin(coinName);
    default:
      return blockapis.BlockchairApi.forCoin(coinName);
  }
}

export async function fetchTransactionHex(txid: string, network: utxolib.Network): Promise<string> {
  return await getApi(network).getTransactionHex(txid);
}

export async function fetchTransactionStatus(
  txid: string,
  network: utxolib.Network
): Promise<blockapis.TransactionStatus> {
  return await getApi(network).getTransactionStatus(txid);
}

export async function fetchPrevOutputs(tx: utxolib.bitgo.UtxoTransaction): Promise<utxolib.TxOutput[]> {
  return await blockapis.fetchInputs(tx.ins, getApi(tx.network), tx.network);
}

export async function fetchPrevOutputSpends(tx: utxolib.bitgo.UtxoTransaction): Promise<blockapis.OutputSpend[]> {
  return await blockapis.fetchTransactionSpends(
    tx.ins.map((i) => utxolib.bitgo.getOutputIdForInput(i)),
    getApi(tx.network)
  );
}

export async function fetchOutputSpends(tx: utxolib.bitgo.UtxoTransaction): Promise<blockapis.OutputSpend[]> {
  try {
    return await getApi(tx.network).getTransactionSpends(tx.getId());
  } catch (e) {
    return [];
  }
}
