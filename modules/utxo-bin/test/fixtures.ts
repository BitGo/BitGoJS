import * as utxolib from '@bitgo/utxo-lib';
import * as fs from 'fs/promises';

export type Fixture = {
  transaction: { hex: string };
};

export async function getTransactionWithSpendType(
  network: utxolib.Network,
  t: utxolib.bitgo.outputScripts.ScriptType2Of3
): Promise<utxolib.bitgo.UtxoTransaction> {
  const f: Fixture = await JSON.parse(
    await fs.readFile(
      `../utxo-lib/test/integration_local_rpc/fixtures/${utxolib.getNetworkName(network)}/v1/spend_${t}.json`,
      'utf8'
    )
  );
  return utxolib.bitgo.createTransactionFromHex(f.transaction.hex, network);
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
