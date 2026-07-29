import * as fs from 'fs/promises';
import * as utxolib from '@bitgo/utxo-lib';

import { argToString, getNetworkOptionsDemand, readStringOptions } from '../../args';
import { Buffer } from 'buffer';

type InputArgs = {
  /** path to psbt file */
  path?: string;
  /** when set, create a new psbt */
  create?: boolean;
  /** network */
  network: utxolib.Network;
  /** expect empty psbt */
  expectEmpty?: boolean;
};
type OutputArgs = {
  /** edit the input file */
  edit: boolean;
  /** output path */
  out?: string;
};
export type WithPsbtOptions = InputArgs & OutputArgs;

export const withPsbtOptions = {
  ...readStringOptions,
  ...getNetworkOptionsDemand('bitcoin'),
  create: { type: 'boolean', default: false },
  edit: { type: 'boolean', default: false },
  out: { type: 'string' },
} as const;

export async function getOrCreatePsbt(args: InputArgs): Promise<utxolib.Psbt> {
  let psbt: string | undefined;
  try {
    psbt = await argToString({ path: args.path, stdin: false });
  } catch (e) {
    // check for ENOENT
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw e;
    }
  }
  if (psbt) {
    if (args.expectEmpty) {
      throw new Error(`psbt is not empty (path=${args.path})`);
    }
    const buffer = utxolib.bitgo.toPsbtBuffer(psbt);
    return utxolib.Psbt.fromBuffer(buffer, { network: args.network });
  }
  if (args.create) {
    return new utxolib.Psbt({ network: args.network });
  }
  throw new Error(`missing psbt (path=${args.path})`);
}

export async function emitOutput(value: utxolib.Psbt | Buffer | string, args: InputArgs & OutputArgs): Promise<void> {
  if (value instanceof utxolib.Psbt) {
    value = value.toBase64();
  }

  if (value instanceof Buffer) {
    value = value.toString('hex');
  }

  if (args.edit || args.out) {
    if (args.edit && args.out) {
      throw new Error('cannot specify both edit and out');
    }
    const path = args.edit ? args.path : args.out;
    if (!path) {
      throw new Error('missing out path');
    }
    await fs.writeFile(path, value);
  } else {
    console.log(value);
  }
}

export async function withPsbt(
  args: InputArgs & OutputArgs,
  fn: (psbt: utxolib.Psbt) => Promise<utxolib.Psbt | Buffer>
): Promise<void> {
  const psbt = await getOrCreatePsbt(args);
  await emitOutput(await fn(psbt), args);
}
