const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'prod' });
const Promise = require('bluebird');
const fs = require('fs');
const readline = require('readline');
const stream = fs.createReadStream('./SuiFoundationWallets.csv');
const rl = readline.createInterface( { input: stream });

// TODO: set your access token here
const accessToken = '';

const coin = 'coin';

const enterprise = 'id';

fs.writeFile('./output.csv', 'Name, Wallet Id, Receive Address, Enterprise' + '\n', 'utf8', (err) => {
  if (err) {
    console.error(err);
  }
});


Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  rl.on('line', async (row) => {
    const data = row.split(',');
    const employeeName = data[1];
    const ent = data[4];
    const walletOptions = {
      label: employeeName,
      enterprise,
      type: 'custodial',
      isCustodial: true,
      multisigType: 'tss',
    };

    if (ent === enterprise) {
      const wallet = await bitgo.coin(coin).wallets().add(walletOptions);

      const walletInstance = wallet.wallet;

      const newLine = [];
      newLine.push(employeeName);
      newLine.push(walletInstance.id());
      newLine.push(walletInstance.receiveAddress());
      newLine.push(enterprise);

      fs.appendFileSync('./output.csv', newLine.join(',') + '\n', 'utf8', (err) => {
        if (err) {
          console.error(err);
        }
      });

      console.log(employeeName);
      console.log(`Wallet ID: ${walletInstance.id()}`);
      console.log(`Receive address: ${walletInstance.receiveAddress()}`);
    }
  });

})();
