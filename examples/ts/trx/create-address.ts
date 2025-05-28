import { BitGo } from 'bitgo';
import { Address } from 'modules/sdk-coin-trx/src';
import * as fs from 'fs/promises';
import * as path from 'path';

// TODO: change to 'production' for mainnet
const env = 'test';
const bitgo = new BitGo({ env });

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '68346ec9706adcf6ced057dbc363f80a';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2xd54a27f8a2eaee422c131d92b92b0d11ad25c14c851416d37af86ffecff89fb1';

// Output file path
const outputFilePath = path.join(__dirname, 'generated-addresses.json');

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  
  // Create an array to store all addresses
  const addresses: string[] = [];
  
  // Create 600 addresses
  for (let i = 0; i < 600; i++) {
    const address: Address = await wallet.createAddress({ label: `Address ${i+1}` });
    addresses.push(address.address);
    
    // Optional: Log progress every 100 addresses
    if ((i + 1) % 100 === 0) {
      console.log(`Created ${i + 1} addresses so far...`);
    }
  }
  
  // Write addresses to file
  await fs.writeFile(outputFilePath, JSON.stringify(addresses, null, 2));
  
  console.log(`All addresses have been saved to: ${outputFilePath}`);
  console.log(`Total addresses created: ${addresses.length}`);
}

main().catch((e) => console.error(e));
