/**
 * Verify that an address belongs to a wallet using the BitGo SDK.
 *
 * This example demonstrates using the SDK's isWalletAddress method which verifies:
 * - Forwarder addresses (deposit addresses)
 * - Base addresses (wallet contract addresses)
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');

const coin = 'hteth'; // change to 'eth' for production
const env = 'test'; // change to 'prod' for production

// TODO: set your access token here
const accessToken = '';

// TODO: set your wallet ID here
const walletId = '';

async function main() {
  // Initialize BitGo SDK
  const bitgo = new BitGoJS.BitGo({ env, accessToken });
  
  console.log('Step 1: Getting wallet...');
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  
  const coinSpecific = wallet.coinSpecific();
  const baseAddress = coinSpecific.baseAddress;
  const walletVersion = coinSpecific.walletVersion;
  const feeAddress = coinSpecific.feeAddress;
  const walletSalt = coinSpecific.salt;
  
  console.log('  Base Address:', baseAddress);
  console.log('  Wallet Version:', walletVersion);
  
  console.log('Step 2: Fetching keychains...');
  const keychainIds = wallet.keyIds();
  const keychains = [];
  
  for (const keychainId of keychainIds) {
    const keychain = await bitgo.coin(coin).keychains().get({ id: keychainId });
    
    // For TSS keychains, derive pub from commonKeychain (first 66 characters)
    const pub = keychain.pub || (keychain.commonKeychain && keychain.commonKeychain.slice(0, 66));
    
    if (!pub) {
      throw new Error(`Unable to derive pub for keychain ${keychainId}`);
    }
    
    keychains.push({
      pub: pub,
      ...(keychain.ethAddress && { ethAddress: keychain.ethAddress }),
      ...(keychain.commonKeychain && { commonKeychain: keychain.commonKeychain })
    });
  }
  console.log('  Retrieved', keychains.length, 'keychains');
  
  console.log('Step 3: Getting address details...');
  const receiveAddress = wallet.receiveAddress();
  const addressObj = await wallet.getAddress({ address: receiveAddress });
  
  const addressIndex = addressObj.index;
  const forwarderVersion = addressObj.coinSpecific?.forwarderVersion;
  const forwarderSalt = addressObj.coinSpecific?.salt;
  
  console.log('  Address:', receiveAddress);
  console.log('  Index:', addressIndex);
  console.log('  Forwarder Version:', forwarderVersion);
  
  console.log('Step 4: Verifying forwarder address using SDK...');
  const forwarderParams = {
    address: receiveAddress,
    keychains: keychains,
    baseAddress: baseAddress,
    walletVersion: walletVersion,
    index: addressIndex,
    coinSpecific: {
      forwarderVersion: forwarderVersion,
      salt: forwarderSalt,
      feeAddress: feeAddress,
      baseAddress: baseAddress
    }
  };
  
  const forwarderResult = await wallet.baseCoin.isWalletAddress(forwarderParams);
  console.log('  Result:', forwarderResult ? '✓ Valid' : '✗ Invalid');
  
  console.log('Step 5: Verifying base address using SDK...');
  const baseAddressParams = {
    address: baseAddress,
    keychains: keychains,
    baseAddress: baseAddress,
    walletVersion: walletVersion,
    index: 0,
    coinSpecific: {
      salt: walletSalt,
      feeAddress: feeAddress,
      baseAddress: baseAddress
    }
  };
  
  const baseResult = await wallet.baseCoin.isWalletAddress(baseAddressParams);
  console.log('  Result:', baseResult ? '✓ Valid' : '✗ Invalid');
  
  console.log('\n' + (forwarderResult && baseResult ? '✅ Success: Both addresses verified' : '❌ Failed: Verification failed'));
}

main().catch((e) => console.error(e));

