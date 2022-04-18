import { BitGo } from 'bitgo';


const bitgo = new BitGo({
  accessToken: 'v2xeabe23e058fbc1ac50efdf0335e080da17e0c4ffc0c734e359efae500f8e3f92',
  env: 'test',
});

async function createWallet() {
  const newWallet = await bitgo.coin('tsol').wallets().generateWallet({
    label: 'TSOL Andrew 1',
    passphrase: 'Ghghjkg!455544llll',
  });

  console.log(JSON.stringify(newWallet, undefined, 2));
}

const walletId = '624f3d531135ba00085a2e54d690f996';
const rootAddress = 'BMp9iTnATAx95FgafYUA6hhRJckaqnEvPUPw8fXfUkh2';
const toAddress = '75U1KfxmTt8NMhE7apS6DJXQHSTrwyoiVppNP2i7Yy7o';

async function createTokenAccount() {
  const wallet = await bitgo.coin('tsol').wallets().get({ id: walletId });
  const createOrcaAta = await wallet.sendMany({
    memo: { value: 'test create ata', type: 'string' },
    type: 'enabletoken',
    tokenName: 'tsol:usdc',
    walletPassphrase: 'Ghghjkg!455544llll',
  });

  console.log(JSON.stringify(createOrcaAta, undefined, 2));
}

async function tokenTransfer() {
  const wallet = await bitgo.coin('tsol').wallets().get({ id: walletId });
  const createUSDTransfer = await wallet.sendMany({
    memo: { value: 'test orca transfer', type: 'string' },
    type: 'transfer',
    token: 'tsol:usdc',
    walletPassphrase: 'Ghghjkg!455544llll',
    recipients: [
      {
        address: toAddress,
        amount: 1000,
        tokenName: 'tsol:usdc',
      },
    ],
  });

  console.log(JSON.stringify(createUSDTransfer, undefined, 2));
}

// createWallet();
// createTokenAccount();
tokenTransfer();
