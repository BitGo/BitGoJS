import { promises as fs } from 'fs';

import { Instance } from 'chalk';
import * as utxolib from '@bitgo/utxo-lib';

import { formatTree } from '../src/format';
import { ParserNode } from '../src/Parser';

export function formatTreeNoColor(n: ParserNode, { showAll }: { showAll: boolean }): string {
  return formatTree(n, { hide: showAll ? [] : undefined, chalk: new Instance({ level: 0 }) });
}

export type ParsedFixture =
  | {
      transaction: utxolib.bitgo.UtxoTransaction<bigint>;
      prevOutputs: utxolib.TxOutput<bigint>[];
    }
  | {
      transaction: utxolib.bitgo.UtxoPsbt;
      prevOutputs: undefined;
    };

type FixtureParams = {
  fixtureType: 'psbtUnsigned' | 'psbtHalfSigned' | 'psbtFullSigned' | 'networkFullSigned';
  scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3;
  spendType?: 'keyPath' | 'scriptPath';
};

const walletKeys = utxolib.testutil.getDefaultWalletKeys();

export async function getPsbt(
  network: utxolib.Network,
  params: FixtureParams,
  { writeFixture }: { writeFixture?: string } = {}
): Promise<ParsedFixture> {
  const inputs: utxolib.testutil.Input[] = [
    { scriptType: params.spendType === 'keyPath' ? 'taprootKeyPathSpend' : params.scriptType, value: BigInt(10_000) },
  ];
  const outputs = [{ scriptType: params.scriptType, value: BigInt(9_000) }];
  let stage: string = params.fixtureType;
  if (stage.startsWith('psbt')) {
    stage = stage.slice('psbt'.length).toLowerCase();
  }
  if (stage !== 'unsigned' && stage !== 'halfsigned' && stage !== 'fullsigned') {
    throw new Error(`invalid stage ${stage}`);
  }
  if (params.spendType === 'keyPath' && writeFixture === undefined) {
    // because we currently cannot create deterministic signatures for taprootKeyPathSpend, we
    // store a copy in fixtures/psbt and use that instead of creating a new one
    const filename = `test/fixtures/psbt/${params.scriptType}.${params.spendType}.${stage}.json`;
    try {
      const psbtHex = JSON.parse(await fs.readFile(filename, 'utf8'));
      const transaction = utxolib.bitgo.createPsbtFromHex(psbtHex, network);
      return { transaction, prevOutputs: undefined };
    } catch (e) {
      if (e.code === 'ENOENT') {
        return await getPsbt(network, params, { writeFixture: filename });
      }
      throw e;
    }
  }
  const transaction = utxolib.testutil.constructPsbt(inputs, outputs, network, walletKeys, stage);
  if (writeFixture) {
    await fs.writeFile(writeFixture, JSON.stringify(transaction.toHex()), 'utf8');
  }
  return {
    transaction,
    prevOutputs: undefined,
  };
}

export async function getTransactionWithSpendType(
  network: utxolib.Network,
  params: FixtureParams
): Promise<ParsedFixture> {
  if (params.fixtureType !== 'networkFullSigned') {
    return await getPsbt(network, params);
  }

  if (params.scriptType === 'p2trMusig2') {
    if (!params.spendType) {
      throw new Error('p2trMusig2 requires params');
    }
  } else {
    if (params.spendType) {
      throw new Error('only p2trMusig2 requires spendType');
    }
  }

  const filename = `spend_${params.scriptType}${params.spendType ? `${params.spendType}` : ''}.json`;
  type Fixture = {
    transaction: { hex: string };
    inputs: { hex: string }[];
  };

  const f: Fixture = await JSON.parse(
    await fs.readFile(
      `../utxo-lib/test/integration_local_rpc/fixtures/${utxolib.getNetworkName(network)}/v1/${filename}`,
      'utf8'
    )
  );

  function getPrevOut(i: utxolib.TxInput): utxolib.TxOutput<bigint> {
    for (const t of inputTxs) {
      if (t.getHash().equals(i.hash) && i.index in t.outs) {
        return t.outs[i.index];
      }
    }
    throw new Error(`missing input ${utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(i))}`);
  }

  const inputTxs = f.inputs.map((i) =>
    utxolib.bitgo.createTransactionFromBuffer(Buffer.from(i.hex, 'hex'), network, { amountType: 'bigint' })
  );
  const tx = utxolib.bitgo.createTransactionFromBuffer(Buffer.from(f.transaction.hex, 'hex'), network, {
    amountType: 'bigint',
  });
  return { transaction: tx, prevOutputs: tx.ins.map((i) => getPrevOut(i)) };
}

export async function getFixtureString(path: string, defaultValue: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (e) {
    if ((e as any).code === 'ENOENT') {
      await fs.writeFile(path, defaultValue, 'utf8');
      throw new Error(`wrote default value for ${path}`);
    }
    throw e;
  }
}
