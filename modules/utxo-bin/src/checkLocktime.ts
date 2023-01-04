import * as utxolib from '@bitgo/utxo-lib';
import axios from 'axios';
import * as yargs from 'yargs';
import { BlockchairApi } from '@bitgo/blockapis';
import * as fs from 'fs';
import * as util from 'util';

type ArgsFetchTxs = {
  blockhash: string;
};

export async function fetchTxs(args: { blockhash: string }): Promise<void> {
  const url = `https://blockstream.info/api/block/${args.blockhash}/txids`;
  const response = await axios.get(url);
  console.log(response.data);
  const txids: string[] = response.data;
  const blockchair = BlockchairApi.forCoin('btc');
  const access = util.promisify(fs.access);
  const writeFile = util.promisify(fs.writeFile);
  let i = 0;
  for (const txid of txids) {
    i++;
    const filename = `./${txid}.hex`;
    try {
      await access(filename);
      console.log('skipping ' + txid);
    } catch (e) {
      const txHex = await blockchair.getTransactionHex(txid);
      await writeFile(filename, txHex);
      console.log('wrote ' + txid, i, txids.length);
    }
  }
}

export const cmdFetchTxs = {
  command: 'fetchTxs blockhash',
  describe: 'fetch txs from block',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsFetchTxs> {
    return b.positional('blockhash', { type: 'string', demandOption: true });
  },

  async handler(argv: yargs.Arguments<ArgsFetchTxs>): Promise<void> {
    await fetchTxs(argv);
  },
};

function is2Of3(input: utxolib.TxInput | utxolib.bitgo.UtxoTransaction): boolean {
  if (input instanceof utxolib.bitgo.UtxoTransaction) {
    return input.ins.every((i) => is2Of3(i));
  }
  try {
    utxolib.bitgo.parseSignatureScript2Of3(input);
    return true;
  } catch (e) {
    return false;
  }
}

type Key = {
  locktime: 0 | 'blockheight';
  nSequence: number;
};

type StatMap = Map<Key, number>;

function getKey(map: StatMap, k: Key): Key {
  for (const kk of map.keys()) {
    if (k.locktime === kk.locktime && k.nSequence === kk.nSequence) {
      return kk;
    }
  }
  return k;
}

function countTxInput(map: Map<Key, number>, locktime: number | 'blockheight', nSequence: number) {
  if (locktime !== 0) {
    locktime = 'blockheight';
  }
  const key: Key = getKey(map, { locktime, nSequence });
  map.set(key, 1 + (map.get(key) ?? 0));
}

function countTxInputsForTransactions(
  txs: utxolib.bitgo.UtxoTransaction[],
  map: Map<Key, number> = new Map()
): typeof map {
  txs.forEach((tx) => tx.ins.forEach((input) => countTxInput(map, tx.locktime, input.sequence)));
  return map;
}

function checkLocktimesForTransactions(txs: utxolib.bitgo.UtxoTransaction[], label?: string): void {
  if (!label) {
    checkLocktimesForTransactions(txs, 'all txs');
    checkLocktimesForTransactions(
      txs.filter((tx) => is2Of3(tx)),
      '2of3 txs'
    );
    return;
  }
  const map = countTxInputsForTransactions(txs);
  const allInputs = txs.flatMap((tx) => tx.ins);
  function percent(a: number, b: number) {
    return ((a / b) * 100).toFixed(2).padStart(6) + `% (${a.toString().padStart(4)})`;
  }
  const pairs = [...map.entries()].sort((a, b) => a[1] - b[1]);
  console.log(`===== ${label} txs=${txs.length} inputs=${allInputs.length} ====`);
  for (const [k, v] of pairs) {
    console.log(
      [
        `nLocktime=${k.locktime.toString().padStart(12)}`,
        `nSequence=${k.nSequence.toString(16).padStart(8)}`,
        `${percent(v, allInputs.length).padStart(12)}`,
      ].join(' ')
    );
  }

  console.log();
}

async function checkLocktimes() {
  const readdir = util.promisify(fs.readdir);
  const readFile = util.promisify(fs.readFile);
  const files = await readdir('./blocktxs');
  const txs = await Promise.all(
    files.map(async (fname) => {
      const hex = await readFile(`./blocktxs/${fname}`, 'utf8');
      const tx = utxolib.bitgo.createTransactionFromHex(hex, utxolib.networks.bitcoin);
      if (tx.getId() + '.hex' !== fname) {
        throw new Error(`${fname}, ${tx.getId()}`);
      }
      return tx;
    })
  );

  checkLocktimesForTransactions(txs);
}

export const cmdCheckLocktime = {
  command: 'checkLocktime',
  describe: 'check tx locktimes',
  builder(b: yargs.Argv<unknown>): yargs.Argv<unknown> {
    return b;
  },
  async handler(): Promise<void> {
    await checkLocktimes();
  },
};
