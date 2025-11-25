/**
 * Verify that an address belongs to a wallet using the BitGo Express API.
 *
 * This example demonstrates the isWalletAddress endpoint which verifies:
 * - Forwarder addresses (deposit addresses)
 * - Base addresses (wallet contract addresses)
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */

const fetch = require('node-fetch');

const coin = 'hteth'; // change to 'eth' for production

// TODO: set your access token here
const accessToken = '';

// TODO: set your wallet ID here
const walletId = '';

const expressUrl = '';

// Helper function to make API requests to Express
async function apiRequest(method, endpoint, body = null) {
  const response = await fetch(`${expressUrl}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

async function main() {
  console.log('Step 1: Fetching wallet data...');
  const wallet = await apiRequest('GET', `/api/v2/${coin}/wallet/${walletId}`);

  const keychainIds = wallet.keys;
  const baseAddress = wallet.coinSpecific.baseAddress;
  const walletVersion = wallet.coinSpecific.walletVersion;
  const feeAddress = wallet.coinSpecific.feeAddress;
  const walletSalt = wallet.coinSpecific.salt;
  const addressToVerify = wallet.receiveAddress.address;

  console.log('  Base Address:', baseAddress);
  console.log('  Wallet Version:', walletVersion);

  console.log('Step 2: Fetching keychains...');
  const keychains = [];
  for (const keychainId of keychainIds) {
    const keychain = await apiRequest('GET', `/api/v2/${coin}/key/${keychainId}`);
    
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

  console.log('Step 3: Fetching address details...');
  const addressData = await apiRequest('GET', `/api/v2/${coin}/wallet/${walletId}/address/${addressToVerify}`);

  const addressIndex = addressData.index;
  const forwarderVersion = addressData.coinSpecific?.forwarderVersion;
  const forwarderSalt = addressData.coinSpecific?.salt;

  console.log('  Address:', addressToVerify);
  console.log('  Index:', addressIndex);
  console.log('  Forwarder Version:', forwarderVersion);

  console.log('Step 4: Verifying forwarder address...');
  const forwarderParams = {
    address: addressToVerify,
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

  const forwarderResult = await apiRequest('POST', `/api/v2/${coin}/wallet/${walletId}/iswalletaddress`, forwarderParams);
  console.log('  Result:', forwarderResult ? '✓ Valid' : '✗ Invalid');

  console.log('Step 5: Verifying base address...');
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

  const baseResult = await apiRequest('POST', `/api/v2/${coin}/wallet/${walletId}/iswalletaddress`, baseAddressParams);
  console.log('  Result:', baseResult ? '✓ Valid' : '✗ Invalid');
}

main().catch((e) => console.error(e));

