import * as utxolib from '@bitgo/utxo-lib';
import * as blockapis from '@bitgo/blockapis';
import { coins, UtxoCoin } from '@bitgo/statics';
import { HttpClient } from '@bitgo/blockapis';
import { ParserTx } from './ParserTx';

function getTxOutPoints(tx: ParserTx): utxolib.bitgo.TxOutPoint[] {
  if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    return tx.ins.map((i) => utxolib.bitgo.getOutputIdForInput(i));
  } else {
    return tx.txInputs.map((i) => utxolib.bitgo.getOutputIdForInput(i));
  }
}

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

export async function fetchPrevOutputs(httpClient: HttpClient, tx: ParserTx): Promise<utxolib.TxOutput<bigint>[]> {
  return (await blockapis.fetchInputs(getTxOutPoints(tx), getApi(httpClient, tx.network), tx.network)).map((v) => ({
    ...v,
    value: BigInt(v.value),
  }));
}

export async function fetchPrevOutputSpends(
  httpClient: HttpClient,
  tx: utxolib.bitgo.UtxoTransaction<bigint> | utxolib.bitgo.UtxoPsbt
): Promise<blockapis.OutputSpend[]> {
  return await blockapis.fetchTransactionSpends(getTxOutPoints(tx), getApi(httpClient, tx.network));
}

export async function fetchOutputSpends(
  httpClient: HttpClient,
  tx: utxolib.bitgo.UtxoTransaction<bigint>
): Promise<blockapis.OutputSpend[]> {
  try {
    return await getApi(httpClient, tx.network).getTransactionSpends(tx.getId());
  } catch (e) {
    return [];
  }
}
