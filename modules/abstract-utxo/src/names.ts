import * as utxolib from '@bitgo/utxo-lib';

function getNetworkName(n: utxolib.Network): utxolib.NetworkName {
  const name = utxolib.getNetworkName(n);
  if (!name) {
    throw new Error('Unknown network');
  }
  return name;
}

/**
 * @param n
 * @returns the family name for a network. Testnets and mainnets of the same coin share the same family name.
 */
export function getFamilyFromNetwork(n: utxolib.Network): string {
  switch (getNetworkName(n)) {
    case 'bitcoin':
    case 'testnet':
    case 'bitcoinPublicSignet':
    case 'bitcoinTestnet4':
    case 'bitcoinBitGoSignet':
      return 'btc';
    case 'bitcoincash':
    case 'bitcoincashTestnet':
      return 'bch';
    case 'ecash':
    case 'ecashTest':
      return 'bcha';
    case 'bitcoingold':
    case 'bitcoingoldTestnet':
      return 'btg';
    case 'bitcoinsv':
    case 'bitcoinsvTestnet':
      return 'bsv';
    case 'dash':
    case 'dashTest':
      return 'dash';
    case 'dogecoin':
    case 'dogecoinTest':
      return 'doge';
    case 'litecoin':
    case 'litecoinTest':
      return 'ltc';
    case 'zcash':
    case 'zcashTest':
      return 'zec';
  }
}

/**
 * Get the chain name for a network.
 * The chain is different for every network.
 */
export function getChainFromNetwork(n: utxolib.Network): string {
  switch (getNetworkName(n)) {
    case 'bitcoinPublicSignet':
      return 'tbtcsig';
    case 'bitcoinTestnet4':
      return 'tbtc4';
    case 'bitcoinBitGoSignet':
      return 'tbtcbgsig';
    case 'bitcoin':
    case 'testnet':
    case 'bitcoincash':
    case 'bitcoincashTestnet':
    case 'ecash':
    case 'ecashTest':
    case 'bitcoingold':
    case 'bitcoingoldTestnet':
    case 'bitcoinsv':
    case 'bitcoinsvTestnet':
    case 'dash':
    case 'dashTest':
    case 'dogecoin':
    case 'dogecoinTest':
    case 'litecoin':
    case 'litecoinTest':
    case 'zcash':
    case 'zcashTest':
      const mainnetName = getFamilyFromNetwork(n);
      return utxolib.isTestnet(n) ? `t${mainnetName}` : mainnetName;
  }
}

/**
 * @param coinName - the name of the coin (e.g. 'btc', 'bch', 'ltc'). Also called 'chain' in some contexts.
 * @returns the network for a coin. This is the mainnet network for the coin.
 */
export function getNetworkFromChain(coinName: string): utxolib.Network {
  for (const network of utxolib.getNetworkList()) {
    if (getChainFromNetwork(network) === coinName) {
      return network;
    }
  }
  throw new Error(`Unknown chain ${coinName}`);
}

export function getFullNameFromNetwork(n: utxolib.Network): string {
  const name = getNetworkName(n);

  let prefix: string;
  switch (name) {
    case 'bitcoinTestnet4':
      prefix = 'Testnet4 ';
      break;
    case 'bitcoinPublicSignet':
      prefix = 'Public Signet ';
      break;
    case 'bitcoinBitGoSignet':
      prefix = 'BitGo Signet ';
      break;
    default:
      if (utxolib.isTestnet(n)) {
        prefix = 'Testnet ';
      } else {
        prefix = '';
      }
  }

  switch (name) {
    case 'bitcoin':
    case 'testnet':
    case 'bitcoinTestnet4':
    case 'bitcoinPublicSignet':
    case 'bitcoinBitGoSignet':
      return prefix + 'Bitcoin';
    case 'bitcoincash':
    case 'bitcoincashTestnet':
      return prefix + 'Bitcoin Cash';
    case 'ecash':
    case 'ecashTest':
      return prefix + 'Bitcoin ABC';
    case 'bitcoingold':
    case 'bitcoingoldTestnet':
      return prefix + 'Bitcoin Gold';
    case 'bitcoinsv':
    case 'bitcoinsvTestnet':
      return prefix + 'Bitcoin SV';
    case 'dash':
    case 'dashTest':
      return prefix + 'Dash';
    case 'dogecoin':
    case 'dogecoinTest':
      return prefix + 'Dogecoin';
    case 'litecoin':
    case 'litecoinTest':
      return prefix + 'Litecoin';
    case 'zcash':
    case 'zcashTest':
      return prefix + 'ZCash';
    default:
      throw new Error('Unknown network');
  }
}
