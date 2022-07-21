import { BitGo } from 'modules/bitgo/dist/types/src';
import { WalletCoinSpecific } from '@bitgo/sdk-core';
const bitgo = new BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-03-app.bitgo-dev.com',
});
// const bitgo = new BitGo({ env: 'test' });
const coin = 'tavaxp';
const accessToken = 'v2x22bd4c133a6a33a7bac966f3e1bb7efddd2f927d09a8fe417f14888a75d027c3';
const walletId = '62c5cf392b90e00007e2457e0d2ea6f7';
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  // console.log(wallet);
  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;
  console.log('Root Address:', coinSpecific.rootAddress);
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());
  console.log('Spendable Balance:', wallet.spendableBalanceString());
  const txPrebuild = await wallet.prebuildTransaction({
    // recipients: [],
    recipients: [{
      amount: '1000000000', // 1 tavaxp
      address: '0x2ce47e59d41f1229e48233f5d8166f2ac13d883b',
    }],
    type: 'addValidator',
    stakingOptions: {
      nodeID: 'NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7',
      amount: '1000000000', // 1 tavaxp
      delegationFeeRate: '10',
    },
  });
  console.log('Built tx: ', txPrebuild);
}
main().catch((e) => console.error(e));
