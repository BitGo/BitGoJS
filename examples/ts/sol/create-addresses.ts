// create addresses
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tdot';
const basecoin = bitgo.coin(coin);

// TODO: set your access token here
const accessToken = 'v2x0cf64da651f21b30ca020bad8bc8448b082ed3d6e5b498ec847b9b7ab0f8d4f3';

// set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = '6448bb3a9fce9d0007d3534b6d1aedc2';
const walletPassphrase = 'QczkC@AOmPC0vaR0p^8z';

async function getWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });
  // await bitgo.unlock({ otp: '000000', duration: 3600 });
  // const limit = 1000;
  let prevId = undefined;
  
  
  const wallet = await basecoin.wallets().get({ id: walletId });
  let addresses: Promise<any>[] = [];

  // for (let i = 0; i < 50; i++) {
  //   addresses.push(
  //     wallet
  //       .createAddress()
  //       .then()
  //       .catch((e) => console.error(e))
  //   );
  // }

  console.log('Wallet ID:', wallet.id());
  do {
    const total_addresses = await wallet.addresses({ prevId });
    for (const address of total_addresses.addresses) {
      if (address === '5EWLX8FWaZP8HkgHak9himUYb9i9MLTYNg3gkHNeG81yhmtw') {
        continue;
      }
      console.log(`Address id: ${address.id}`);
      console.log(`Address: ${address.address}`);

      // const transaction = await wallet.send({
      //   address: address.address,
      //   amount: '1000000',
      //   walletPassphrase: walletPassphrase,
      // });
      const transaction = await wallet.sendMany({
        recipients: [
          {
            amount: '10000000000',
            address: address.address,
          },
        ],
        walletPassphrase: walletPassphrase,
        type: 'transfer',
      });
      console.log('Transaction ID:', transaction.id);
    }
    prevId = total_addresses.nextBatchPrevId;
  } while (prevId !== undefined);
}

getWallet().catch((e) => console.error(e));