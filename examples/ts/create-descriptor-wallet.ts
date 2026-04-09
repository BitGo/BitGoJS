import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc'; // Replace with your given coin (e.g. Ltc, Tltc)
import { AbstractUtxoCoin, descriptor } from '@bitgo/abstract-utxo';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// btc = bitcoin, tbtc = testnet bitcoin
const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

// TODO: set a label for your new wallet here
const label = 'Example Descriptor Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = 'test_wallet_passphrase';

// TODO: set your enterprise ID for your new wallet here
const enterprise = 'your_enterprise_id';

async function main() {
  console.log(
    // this wrapper creates three keys: userKey, backupKey, and bitgoKey
    // at the moment, this is a somewhat artificial requirement from wallet platform
    // in the future, we will allow for more flexible key generation
    await descriptor.createWallet.createDescriptorWalletWithWalletPassphrase(
      bitgo,
      bitgo.coin(coin) as AbstractUtxoCoin,
      {
        label,
        walletPassphrase: passphrase,
        enterprise,
        descriptorsFromKeys(userKey, cosigners) {
          // userKey is backed up at BitGo with the wallet passphrase
          // cosigners are backup key and BitGo key
          const xpubs = [userKey, ...cosigners].map((key) => key.neutered().toBase58());

          return [
            // here is a single-sig descriptor for the user key
            descriptor.createNamedDescriptorWithSignature('SingleSigWpkh', `wpkh(${xpubs[0]}/*)`, userKey),
            // here is a 2of3 multisig descriptor for the backup key and BitGo key
            descriptor.createNamedDescriptorWithSignature(
              'MultiSigWsh',
              `wsh(multi(2,${xpubs.map((xpub) => `${xpub}/*`).join(',')}))`,
              userKey
            ),
            // equivalent to the above, but returns two descriptors (external and internal)
            ...descriptor.createWallet.DefaultWsh2Of3(userKey, cosigners),
          ];
        },
      }
    )
  );
}

main().catch((e) => console.log(e));
