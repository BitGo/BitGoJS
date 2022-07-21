import { BitGo } from 'bitgo';
import { WalletCoinSpecific } from '@bitgo/sdk-core';
const bitgo = new BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-03-app.bitgo-dev.com',
});
// const bitgo = new BitGo({ env: 'test' });
const coin = 'tavaxp';
const accessToken = 'v2x22bd4c133a6a33a7bac966f3e1bb7efddd2f927d09a8fe417f14888a75d027c3';
const walletId = '62ce058254c4540008eb211c3ede7c16';
async function main() {
  bitgo.unlock({
    otp: '000000', duration: 3600,
  });
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  // console.log(await wallet.addresses());
  // console.log(wallet);
  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;
  console.log('Root Address:', coinSpecific.rootAddress);
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());
  console.log('Spendable Balance:', wallet.spendableBalanceString());
  // const txPrebuild = await wallet.prebuildTransaction({
  //   // recipients: [],
  //   recipients: [{
  //     amount: '1000000000', // 1 tavaxp
  //     address: '0x2ce47e59d41f1229e48233f5d8166f2ac13d883b',
  //   }],
  //   type: 'addValidator',
  //   stakingOptions: {
  //     nodeID: 'NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7',
  //     amount: '1000000000', // 1 tavaxp
  //     delegationFeeRate: '10',
  //   },
  // });
  const initiateTxParams = {
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
  };
  const baseCoin = await bitgo.coin(coin);
  // const advanceWhilteListParam = {
  //   id: 'Custodial Wallet Whitelist',
  //   type: 'advancedWhitelist',
  //   condition: {
  //     add: {
  //       item: 'NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7',
  //       type: 'address',
  //     },
  //   },
  //   action: {
  //     type: 'deny',
  //     userIds: [],
  //   },
  // };
  // const res1 = await bitgo.put(baseCoin.url(`/wallet/${walletId}/policy/rule`))
  //   .send(advanceWhilteListParam)
  //   .result();
  // console.log(res1);
  bitgo.unlock({
    otp: '000000', duration: 3600,
  });
  //
  const res = await bitgo.post(baseCoin.url(`/wallet/${walletId}/tx/initiate`))
    .send(initiateTxParams).result();
  console.log(res);
}
main().catch((e) => console.error(e));
