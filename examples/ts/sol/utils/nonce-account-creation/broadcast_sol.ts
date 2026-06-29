import { Connection, clusterApiUrl } from '@solana/web3.js';
import { readFileSync } from 'fs';

// For BitGo Test use solana 'devnet' network ***important***
// For BitGo Prod use solana 'mainnet-beta' network
const network: 'mainnet-beta' | 'devnet' = 'devnet';

interface transaction {
  serializedTx: string;
  scanIndex: string;
}

async function main() {
  const connection = new Connection(clusterApiUrl(network), 'confirmed');

  const txs: transaction[] = JSON.parse(readFileSync('json/txs.json').toString())['transactions'];
  for (let i = 0; i < txs.length; i++) {
    const serializedTx = txs[i].serializedTx;
    try {
      const txid = await connection.sendRawTransaction(Buffer.from(serializedTx, 'base64'));
      await connection.confirmTransaction(txid);
    } catch (e) {
      console.log('Error broadcasting tx : ' + JSON.stringify(txs[i]));
      console.error(e);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(-1);
});
