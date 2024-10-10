import * as fs from 'fs/promises';
import { Buffer } from 'buffer';

import * as t from 'io-ts';
import * as yargs from 'yargs';
import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import * as blockapis from '@bitgo/blockapis';

import { fetchPrevOutputs, getClient } from '../../fetch';
import { getNetworkOptionsDemand, getRootWalletKeys, isWalletKeyName, keyOptions, KeyOptions } from '../../args';

type WalletUnspent = utxolib.bitgo.WalletUnspent<bigint>;
type Output = { script: Buffer; value: bigint };
type PartialWalletUnspent = Omit<WalletUnspent, 'value' | 'address'>;

export type ArgsCreateTx = KeyOptions & {
  network: utxolib.Network;
  unspents?: string;
  unspent?: string[];
  chain?: string[];
  index?: string[];
  output?: string[];
  signer: string;
  cosigner: string;
};

async function toWalletUnspents(
  httpClient: blockapis.HttpClient,
  unspents: PartialWalletUnspent[],
  network: utxolib.Network
): Promise<WalletUnspent[]> {
  const prevOutputs = await fetchPrevOutputs(
    httpClient,
    unspents.map((u) => utxolib.bitgo.parseOutputId(u.id)),
    network
  );
  return Promise.all(
    unspents.map(async (u, i) => {
      return {
        id: u.id,
        chain: u.chain,
        index: u.index,
        value: prevOutputs[i].value,
        address: utxolib.address.fromOutputScript(prevOutputs[i].script, network),
      };
    })
  );
}

function parseOutput(v: string, network: utxolib.Network): Output {
  const parts = v.split(':');
  let script: Buffer;
  let value: bigint;
  if (parts.length === 3) {
    if (parts[0] === 'hex') {
      script = Buffer.from(parts[1], 'hex');
      value = BigInt(parseFloat(parts[2]));
    } else {
      throw new Error(`invalid output specifier ${v}`);
    }
  } else if (parts.length === 2) {
    script = utxolib.address.toOutputScript(parts[0], network);
    value = BigInt(parseFloat(parts[1]));
  } else {
    throw new Error(`invalid output specifier ${v}`);
  }

  return { script, value };
}

function createFixedScriptTxWithUnspents(
  network: utxolib.Network,
  rootWalletKeys: utxolib.bitgo.RootWalletKeys,
  unspents: WalletUnspent[],
  outputs: Output[],
  {
    signer,
    cosigner,
  }: {
    signer: utxolib.bitgo.KeyName;
    cosigner: utxolib.bitgo.KeyName;
  }
): utxolib.Psbt {
  const psbt = utxolib.bitgo.createPsbtForNetwork({ network });
  for (const u of unspents) {
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signer, cosigner);
  }
  for (const output of outputs) {
    psbt.addOutput(output);
  }
  return psbt;
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((x) => typeof x === 'string');
}

async function readWalletUnspents(file: string): Promise<WalletUnspent[]> {
  const json = JSON.parse(await fs.readFile(file, 'utf8'));
  const Unspent = t.type({
    id: t.string,
    address: t.string,
    chain: t.number,
    index: t.number,
    valueString: t.string,
  });
  if (!t.array(Unspent).is(json)) {
    throw new Error(`invalid unspents json`);
  }
  return json.map((u) => {
    if (!utxolib.bitgo.isChainCode(u.chain)) {
      throw new Error(`invalid chain code ${u.chain}`);
    }
    return {
      id: u.id,
      address: u.address,
      chain: u.chain,
      index: u.index,
      value: BigInt(u.valueString),
    };
  });
}

async function toWalletUnspentsFromArgs(
  client: blockapis.HttpClient,
  args: {
    unspent?: string[];
    chain?: string[];
    index?: string[];
  },
  network: utxolib.Network
): Promise<WalletUnspent[]> {
  if (!args.unspent || !isStringArray(args.unspent)) {
    throw new Error(`invalid unspent array`);
  }
  if (!args.chain || !isStringArray(args.chain)) {
    throw new Error(`invalid chain array`);
  }
  if (!args.index || !isStringArray(args.index)) {
    throw new Error(`invalid index array`);
  }
  if (args.unspent.length !== args.chain.length || args.unspent.length !== args.index.length) {
    throw new Error(`unspent, chain and index arrays must have the same length`);
  }
  return toWalletUnspents(
    client,
    args.unspent.map((id, i) => {
      if (!args.chain?.[i] || !args.index?.[i]) {
        throw new Error('chain and index are required for each unspent');
      }
      const chain = parseInt(args.chain?.[i], 10);
      const index = parseInt(args.index?.[i], 10);
      if (isNaN(chain) || isNaN(index)) {
        throw new Error('chain and index must be numbers');
      }
      if (!utxolib.bitgo.isChainCode(chain)) {
        throw new Error('invalid chain');
      }
      return { id, chain, index };
    }),
    network
  );
}

export async function createFixedScriptTx(args: ArgsCreateTx, httpClient: blockapis.HttpClient): Promise<utxolib.Psbt> {
  const rootWalletKeys = getRootWalletKeys(args);

  let unspents: WalletUnspent[];
  if (args.unspents) {
    if (args.unspent) {
      throw new Error('cannot specify both unspents and unspent');
    }
    unspents = await readWalletUnspents(args.unspents);
  } else {
    unspents = await toWalletUnspentsFromArgs(httpClient, args, args.network);
  }

  if (!args.output || !isStringArray(args.output)) {
    throw new Error(`invalid output array`);
  }

  const outputs = args.output.map((v) => parseOutput(v, args.network));
  if (!isWalletKeyName(args.signer)) {
    throw new Error('invalid signer');
  }
  if (!isWalletKeyName(args.cosigner)) {
    throw new Error('invalid cosigner');
  }

  return createFixedScriptTxWithUnspents(
    args.network,
    rootWalletKeys,
    await toWalletUnspents(httpClient, unspents, args.network),
    outputs,
    {
      signer: args.signer,
      cosigner: args.cosigner,
    }
  );
}

export const cmdCreateFixedScriptTx: CommandModule<
  unknown,
  ArgsCreateTx & {
    cache: boolean;
  }
> = {
  command: 'createFixedScript',
  describe: 'create psbt based on fixed-script unspents and outputs',
  builder(b: yargs.Argv<unknown>): yargs.Argv<
    ArgsCreateTx & {
      cache: boolean;
    }
  > {
    return b
      .option('cache', { type: 'boolean', default: false })
      .option(getNetworkOptionsDemand())
      .options(keyOptions)
      .option('unspents', { type: 'string', description: 'json file with unspents' })
      .option('unspent', { type: 'string', array: true })
      .option('chain', { type: 'string', array: true })
      .option('index', { type: 'string', array: true })
      .option('output', { type: 'string', array: true })
      .option('signer', { type: 'string', default: 'user' })
      .option('cosigner', { type: 'string', default: 'bitgo' });
  },
  async handler(argv) {
    const httpClient = await getClient({ cache: argv.cache });
    const psbt = await createFixedScriptTx(argv, httpClient);
    console.log(psbt.toBase64());
  },
};
