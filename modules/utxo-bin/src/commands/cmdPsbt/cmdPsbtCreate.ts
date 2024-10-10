import * as fs from 'fs/promises';
import { Buffer } from 'buffer';

import * as t from 'io-ts';
import * as yargs from 'yargs';
import { CommandModule } from 'yargs';
import { Dimensions } from '@bitgo/unspents';
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
  feeRateSatKB?: number;
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

function parseOutput(
  v: string | { script: Buffer; value: string },
  network: utxolib.Network
): { script: Buffer; value: bigint | 'rest' } {
  if (typeof v === 'object') {
    if (v.value === 'rest') {
      return {
        script: v.script,
        value: v.value,
      };
    }
    return {
      script: v.script,
      value: BigInt(parseFloat(v.value)),
    };
  }

  if (typeof v === 'string') {
    const parts = v.split(':');
    if (parts.length === 3) {
      if (parts[0] === 'hex') {
        return parseOutput({ script: Buffer.from(parts[1], 'hex'), value: parts[2] }, network);
      } else {
        throw new Error(`invalid output specifier ${v}`);
      }
    } else if (parts.length === 2) {
      return parseOutput(
        {
          script: utxolib.address.toOutputScript(parts[0], network),
          value: parts[1],
        },
        network
      );
    } else {
      throw new Error(`invalid output specifier ${v}`);
    }
  }

  throw new Error(`invalid output specifier ${v}`);
}

function getFeeSat(dimensions: Dimensions, { feeRateSatKB }: { feeRateSatKB: number }): bigint {
  const vsize = dimensions.getVSize();
  return BigInt(Math.ceil((vsize * feeRateSatKB) / 1000));
}

function parseOutputs(
  outputs: string[],
  {
    network,
    inputDimensions,
    inputSum,
    feeRateSatKB,
  }: {
    network: utxolib.Network;
    inputDimensions: Dimensions;
    inputSum: bigint;
    feeRateSatKB: number | undefined;
  }
): Output[] {
  const outputsParsed = outputs.map((v) => parseOutput(v, network));
  const feeSat = feeRateSatKB
    ? getFeeSat(inputDimensions.plus(Dimensions.fromOutputs(outputsParsed)), { feeRateSatKB })
    : undefined;
  const fixedAmount = outputsParsed.reduce((sum, o) => (typeof o.value === 'bigint' ? sum + o.value : sum), BigInt(0));
  const nRest = outputsParsed.filter((o) => o.value === 'rest').length;
  if (nRest > 1) {
    throw new Error(`only one output allowed with value "rest"`);
  }
  return outputsParsed.map(({ script, value }): Output => {
    if (value === 'rest') {
      if (feeSat === undefined) {
        throw new Error(`fee rate required for output with value "rest"`);
      }
      return {
        script,
        value: inputSum - fixedAmount - feeSat,
      };
    }
    return { script, value };
  });
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
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signer, cosigner, {
      skipNonWitnessUtxo: true,
    });
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

export async function createFixedScriptTxs(
  args: ArgsCreateTx,
  httpClient: blockapis.HttpClient
): Promise<utxolib.Psbt> {
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

  const inputDimensions = Dimensions.fromUnspents(unspents);
  const inputSum = unspents.reduce((sum, u) => sum + u.value, BigInt(0));

  const outputs = parseOutputs(args.output, {
    network: args.network,
    inputDimensions,
    inputSum,
    feeRateSatKB: args.feeRateSatKB,
  });

  if (!isWalletKeyName(args.signer)) {
    throw new Error('invalid signer');
  }
  if (!isWalletKeyName(args.cosigner)) {
    throw new Error('invalid cosigner');
  }

  return createFixedScriptTxWithUnspents(args.network, rootWalletKeys, unspents, outputs, {
    signer: args.signer,
    cosigner: args.cosigner,
  });
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
      .option('feeRateSatKB', { type: 'number', description: 'fee rate in satoshis per kilobyte' })
      .option('signer', { type: 'string', default: 'user' })
      .option('cosigner', { type: 'string', default: 'bitgo' })
      .option('outdir', { type: 'string', description: 'output directory' });
  },
  async handler(argv) {
    const httpClient = await getClient({ cache: argv.cache });
    const psbt = await createFixedScriptTxs(argv, httpClient);
    if (argv.outdir) {
      const txid = (psbt as any).__CACHE.__TX.getId();
      const filename = `${argv.outdir}/${txid}.psbt`;
      console.log(`writing ${filename}`);
      await fs.writeFile(filename, psbt.toBase64(), 'utf8');
    } else {
      console.log(psbt.toBase64());
    }
  },
};
