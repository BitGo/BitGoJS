const accessToken = 'xxxxx'; // grab your token from BGA
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ accessToken, env: 'prod' });
const coin = bitgo.coin('bsv');
/** Given information - wallet id, xpubs and address to verify */
const walletId = 'insert wallet id';
const walletKeys = {
  user: 'xpub...',
  backup: 'xpub...',
  bitgo: 'xpub...',
};
const addressToVerify = 'addrtoverify';
async function retrieveAddressDerivationInfoFromBitGo(address) {
  const res = await bitgo.get(coin.url(`/admin/address/${address}`));
  return {
    address,
    chain: res.body.chain,
    index: res.body.index,
  };
}

async function main() {
  const { chain, index } = await retrieveAddressDerivationInfoFromBitGo(addressToVerify);
  const result = { address: addressToVerify, path: `m/0/0/${chain}/${index}` };
  console.log(result);
  // verifyAddress will throw if the address is invalid
  coin.verifyAddress({
    keychains: [{ pub: walletKeys.user }, { pub: walletKeys.backup }, { pub: walletKeys.bitgo }],
    address: addressToVerify,
    addressType: 'p2sh',
    index,
    chain,
    coinSpecific: {},
  });
}
main()
.then(console.log)
.catch(console.error);
