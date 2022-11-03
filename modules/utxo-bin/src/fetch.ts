import * as utxolib from '@bitgo/utxo-lib';
import * as blockapis from '@bitgo/blockapis';
import { coins, UtxoCoin } from '@bitgo/statics';
import { HttpClient } from '@bitgo/blockapis';

function getCoinName(network: utxolib.Network): string {
  const networkName = utxolib.getNetworkName(network);

  // the bitcoincash network actually has two coins: bch and bcha - hardcode bch by default here
  switch (networkName) {
    case 'bitcoincash':
      return 'bch';
    case 'bitcoincashTestnet':
      return 'tbch';
  }

  const matches = [...coins].flatMap(([, coin]) =>
    coin instanceof UtxoCoin && coin.network.utxolibName === networkName ? [coin.name] : []
  );
  switch (matches.length) {
    case 0:
      throw new Error(`no coin for network ${networkName}`);
    case 1:
      return matches[0];
    default:
      throw new Error(`more than one coin for ${networkName}: ${matches}`);
  }
}

function getApi(httpClient: HttpClient, network: utxolib.Network): blockapis.UtxoApi {
  const coinName = getCoinName(network);
  switch (coinName) {
    case 'btc':
    case 'tbtc':
      return blockapis.BlockstreamApi.forCoin(coinName, { httpClient });
    default:
      return blockapis.BlockchairApi.forCoin(coinName, { httpClient });
  }
}

export async function fetchTransactionHex(
  httpClient: HttpClient,
  txid: string,
  network: utxolib.Network
): Promise<string> {
  return await getApi(httpClient, network).getTransactionHex(txid);
}

export async function fetchTransactionStatus(
  httpClient: HttpClient,
  txid: string,
  network: utxolib.Network
): Promise<blockapis.TransactionStatus> {
  return await getApi(httpClient, network).getTransactionStatus(txid);
}

export async function fetchPrevOutputs(
  httpClient: HttpClient,
  tx: utxolib.bitgo.UtxoTransaction
): Promise<utxolib.TxOutput[]> {
  return await blockapis.fetchInputs(tx.ins, getApi(httpClient, tx.network), tx.network);
}

export async function fetchPrevOutputSpends(
  httpClient: HttpClient,
  tx: utxolib.bitgo.UtxoTransaction
): Promise<blockapis.OutputSpend[]> {
  return await blockapis.fetchTransactionSpends(
    tx.ins.map((i) => utxolib.bitgo.getOutputIdForInput(i)),
    getApi(httpClient, tx.network)
  );
}

export async function fetchOutputSpends(
  httpClient: HttpClient,
  tx: utxolib.bitgo.UtxoTransaction
): Promise<blockapis.OutputSpend[]> {
  try {
    return await getApi(httpClient, tx.network).getTransactionSpends(tx.getId());
  } catch (e) {
    return [];
  }
}
