const BitGoJS = require('bitgo');
const fs = require('fs');
const bitgo = new BitGoJS.BitGo({ env: 'prod' });

async function recovery() {
  const coinInstance = bitgo.coin('bcha');
  const recovery = await coinInstance.recover({
    apiKey: '',
    userKey: '',
    backupKey: '',
    bitgoKey: '',
    recoveryDestination: '16ZTpuSichkK1STB6pTjuXsrQiXw18v8XQ',
    isUnsignedSweep: true,
    scan: 20,
  });

  fs.writeFile('bcha_recovery_unsigned.json', JSON.stringify(recovery, null, 2), () => {});
}

recovery();
